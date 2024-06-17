from boto3.dynamodb.conditions import Attr
from flask import Flask, redirect, render_template, request, jsonify,make_response, url_for,flash, session
from dotenv import load_dotenv
import os
import boto3
from botocore.exceptions import ClientError
import bcrypt
import jwt
import json
import base64
import socket
import threading
import asyncio
import websockets
import signal
import sys
from websockets import WebSocketServerProtocol
from typing import Set
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token, get_jwt_identity,verify_jwt_in_request
from functools import wraps
import datetime
import time


load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv('SECRET_KEY')
app.config["JWT_SECRET_KEY"] = os.getenv('JWT_SECRET_KEY')
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_SECURE"] = True  # Mettre à True en production avec HTTPS
app.config["JWT_ACCESS_COOKIE_PATH"] = "/"
app.config["JWT_REFRESH_COOKIE_PATH"] = "/refresh"
app.config["JWT_COOKIE_CSRF_PROTECT"] = True  # Mettre à True en production


# Récupérer les clés d'accès depuis les variables d'environnement
aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
aws_region = os.getenv('AWS_REGION', 'eu-west-3')  # Assurez-vous de définir votre région AWS dans le fichier .env





# Utiliser les clés d'accès pour créer un client boto3
dynamodb = boto3.resource(
    'dynamodb',
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key,
    region_name=aws_region
)

# Vérifier la connexion à DynamoDB
try:
    dynamodb.meta.client.describe_table(TableName='user')
    print("Connexion à DynamoDB réussie.")
except ClientError as e:
    print("Erreur lors de la connexion à DynamoDB :", e)

# try:
#     table = dynamodb.create_table(
#         TableName='configs',
#         KeySchema=[
#             {
#                 'AttributeName': 'username',
#                 'KeyType': 'HASH'  # Partition key
#             },
#             {
#                 'AttributeName': 'port',
#                 'KeyType': 'RANGE'
#             }
#         ],
#         AttributeDefinitions=[
#             {
#                 'AttributeName': 'username',
#                 'AttributeType': 'S'
#             },
#             {
#                 'AttributeName': 'port',
#                 'AttributeType': 'N'
#             }
#         ],
#         ProvisionedThroughput={
#             'ReadCapacityUnits': 5,
#             'WriteCapacityUnits': 5
#         }
#     )
#     # Attendre que la table soit créée
#     table.meta.client.get_waiter('table_exists').wait(TableName='configs')
#     print("Table 'configs' créée avec succès.")
# except ClientError as e:
#     print("Erreur lors de la création de la table 'user':", e)

table = dynamodb.Table('user')
table_config = dynamodb.Table('configs')

app = Flask(__name__)
jwt = JWTManager(app)
app.secret_key = "porthub"

class WebSocketThread(threading.Thread):
    def __init__(self, configuration, stop_event):
        super().__init__()
        self.configuration = configuration
        self.port = configuration["port"]
        self.stop_event = stop_event
        self.server = None

    def run(self):
        port = self.configuration["port"]
        asyncio.run(self.start_server(port))

    async def start_server(self, port):
        try:
            async with websockets.serve(self.register_client, "localhost", port):
                await self.stop_event.wait()
        except Exception as e:
            print(f"WebSocket server on port {port} encountered an error:", e)

    async def register_client(self, websocket: websockets.WebSocketServerProtocol):
        global connected_clients
        connected_clients.add(websocket)
        try:
            async for message in websocket:
                await self.broadcast(message)
        finally:
            connected_clients.remove(websocket)

    async def broadcast(self, message: str):
        if connected_clients:
            await asyncio.wait([client.send(message) for client in connected_clients])

    def stop_server(self):
        if self.server:
            self.server.close()
            asyncio.new_event_loop().run_until_complete(asyncio.sleep(1))
            self.stop_event.set()

connected_clients: Set[websockets.WebSocketServerProtocol] = set()
websocket_threads = []

def start_websocket(configuration):
    stop_event = threading.Event()
    thread = WebSocketThread(configuration, stop_event)
    thread.start()
    websocket_threads.append(thread)

def stop_websocket(port):
    global websocket_threads

    # Find the WebSocket thread corresponding to the specified port
    threads_to_remove = []
    for thread in websocket_threads:
        if int(thread.configuration["port"]) == int(port):
            print("Stopping WebSocket server on port:", port)
            thread.stop_event.set()
            threads_to_remove.append(thread)

    # Remove the thread from the list
    for thread in threads_to_remove:
        websocket_threads.remove(thread)





@app.route('/')
def home():
    return render_template('index.html')

@app.route('/registerdb', methods=["POST"])
def registerUser():
    username = request.form['username']
    email = request.form['email']
    password = request.form['password']

    # Vérifier si l'adresse e-mail est déjà utilisée
    response = table.scan(FilterExpression=Attr('email').eq(email))
    existing_user_email = response.get('Items')
    if existing_user_email:
        return jsonify({'error': 'Email already exists'}), 400

    # Vérifier si le nom d'utilisateur est déjà utilisé
    response = table.scan(FilterExpression=Attr('username').eq(username))
    existing_user_username = response.get('Items')
    if existing_user_username:
        return jsonify({'error': 'Username already exists'}), 400

    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    new_user = {
        'username': username,
        'email': email,
        'password': hashed_password.decode('utf-8'),
        'salt': salt.decode('utf-8'),
        'is_admin': False,
        'credit':0
    }
    try:
        table.put_item(Item=new_user)
        message = 'User registered successfully'
        return redirect(url_for('login'))
    except ClientError as e:
        message = 'Error registering user'
        return jsonify({'error': message, 'details': str(e)}), 500



@app.route('/user/<string:username>', methods=["PUT"])
@jwt_required()
def updateUser(username):
    data = request.get_json()

    # Vérifier les champs autorisés
    allowed_fields = {'email', 'password'}

    # Vérifier si des champs non autorisés sont présents dans la requête
    for field in data.keys():
        if field not in allowed_fields:
            return jsonify({'error': f'Field "{field}" not allowed for update'}), 400

    # Construire l'expression de mise à jour
    update_expression = 'SET '
    expression_attribute_values = {}

    # Vérifier si le mot de passe doit être mis à jour
    # Vérifier si le mot de passe doit être mis à jour
    if 'password' in data:
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), salt)
        update_expression += 'password = :password, '
        expression_attribute_values[':password'] = hashed_password.decode('utf-8')
        update_expression += 'salt = :salt, '
        expression_attribute_values[':salt'] = salt.decode('utf-8')


    # Vérifier si l'email doit être mis à jour
    if 'email' in data:
        update_expression += 'email = :email, '
        expression_attribute_values[':email'] = data['email']

    # Supprimer le sel s'il n'est pas nécessaire
    if 'password' not in data:
        expression_attribute_values.pop(':salt', None)

    # Vérifier si des champs ont été spécifiés pour la mise à jour
    if not update_expression.endswith('SET '):
        update_expression = update_expression[:-2]  # Supprimer la virgule et l'espace à la fin

        try:
            response = table.update_item(
                Key={'username': username},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues='UPDATED_NEW'
            )
            updated_user = response.get('Attributes')
            if updated_user:
                return jsonify({'message': 'User updated successfully', 'user': updated_user}), 200
            else:
                return jsonify({'message': 'User not found'}), 404
        except ClientError as e:
            return jsonify({'error': 'Error updating user', 'details': str(e)}), 500
    else:
        return jsonify({'error': 'No fields to update provided'}), 400

@app.route('/users', methods=["GET"])
@jwt_required()
def listUsers():
    users = get_all_users()
    return jsonify({'users': users})


def get_all_users():
    try:
        response = table.scan()
        users = response.get('Items', [])
        # Supprimer les champs sensibles avant de renvoyer les utilisateurs
        for user in users:
            user.pop('password', None)
            user.pop('salt', None)
        return users
    except ClientError as e:
        print("Error getting all users:", e)
        return []



@app.route('/user/<string:username>', methods=["GET"])
def getUserByPseudo(username):
    try:
        response = table.get_item(Key={'username': username})
        user = response.get('Item')
        if user:
            # Supprimer les champs sensibles avant de renvoyer l'utilisateur
            user.pop('password', None)
            return jsonify({'user': user}), 200
        else:
            return jsonify({'message': 'User not found'}), 404
    except ClientError as e:
        return jsonify({'error': 'Error getting user', 'details': str(e)}), 500

@app.route('/user/<string:username>', methods=["DELETE"])
@jwt_required(optional=True, locations=["cookies"])
def deleteUser(username):
    current_user = get_jwt_identity()
    if not current_user:
        return redirect(url_for('login'))
    if current_user['is_admin']==True :
        try:
            response = table.delete_item(Key={'username': username}, ReturnValues='ALL_OLD')
            deleted_user = response.get('Attributes')
            if deleted_user:
                return jsonify({'message': 'User deleted successfully', 'user': deleted_user}), 200
            else:
                return jsonify({'message': 'User not found'}), 404
        except ClientError as e:
            return jsonify({'error': 'Error deleting user', 'details': str(e)}), 500


def authenticate(username, password):
    # Récupérer l'utilisateur depuis la base de données en fonction du nom d'utilisateur
    response = table.get_item(Key={'username': username})
    user = response.get('Item')
    if user:
        # Vérifier si le mot de passe correspond
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), user['salt'].encode('utf-8'))
        if hashed_password == user['password'].encode('utf-8'):
            return user
    return None

@app.route('/logindb', methods=['POST'])
def logindb():
    username = request.form["username"]
    password = request.form["password"]

    user = authenticate(username, password)
    if user:
        is_admin = user.get('is_admin') == True
        credit = user.get('credit')

        token_data = {
            'username': username,
            'is_admin': is_admin,
            'credit': str(credit)
        }
       
        token = create_access_token(identity=token_data)

        response = make_response(redirect(url_for('redirection')))
    
        response.set_cookie('access_token_cookie', token)

        session["username"] = username
        
        # Ajouter le token aux cookies de la réponse (ou stocker ailleurs selon vos besoins)
        return response
    else:
        return jsonify({'error': 'Invalid credentials'}), 401
    
@app.route('/redirection')
@jwt_required(optional=True,locations='cookies')
def redirection():
    try :
        current_user = get_jwt_identity()
    
        if current_user['is_admin']==True:
            return redirect(url_for('adminUser'))
    except :
        return redirect(url_for('login'))
    return redirect(url_for('login'))

@app.route('/adminUser')
@jwt_required(optional=True,locations='cookies')    
def adminUser():
    current_user = get_jwt_identity()
    try : 
        if current_user['is_admin']==True:
            return render_template('adminUser.html')
    except :
        return redirect(url_for('login'))
    
@app.route('/email/<string:email>', methods=["GET"])
def getEmail(email):
    try:
        # Recherche dans la base de données DynamoDB si l'e-mail existe
        response = table.scan(FilterExpression=Attr('email').eq(email))
        user = response.get('Items')

        if user:
            # Supprimer les champs sensibles avant de renvoyer l'utilisateur
            for u in user:
                u.pop('password', None)
                u.pop('salt', None)
            return jsonify({'user': user}), 200
        else:
            return jsonify({'message': 'Email not found'}), 404
    except ClientError as e:
        return jsonify({'error': 'Error checking email', 'details': str(e)}), 500


@app.route('/configs')
@jwt_required()
def listConfigs():
    try:
        current_user = get_jwt_identity()
        username = current_user['username']
        
        # Filter configurations by username
        response = table_config.scan(FilterExpression=Attr('username').eq(username))
        configs = response.get('Items', [])
        
        return jsonify({'configs': configs}), 200
    except ClientError as e:
        return jsonify({'error': 'Error getting configurations', 'details': str(e)}), 500


@app.route('/login')
@jwt_required(optional=True,locations="cookies")
def login():
    if get_jwt_identity():
        return redirect(url_for('panel'))
    return render_template("connexion.html")

@app.route('/register')
@jwt_required(optional=True,locations="cookies")
def register():
    if get_jwt_identity():
        return redirect(url_for('panel'))
    return render_template("register.html")


@app.route('/create_config', methods=["POST"])
def create_config():
    passwd = request.form["password"]
    users_count = request.form["users_count"]

    port = find_free_port()

    configuration = {
        "port": port,
        "password": passwd,
        "users_count": users_count
    }
    # Démarrer le serveur WebSocket dans un thread séparé
    start_websocket(configuration)

    json_configuration = json.dumps(configuration, separators=(',', ':')).encode('utf-8')
    encoded_configuration = base64.b64encode(json_configuration).decode("utf-8")

    flash(f"JSON config (base64 encoded): {encoded_configuration}", "success")

    print("Configuration encodée:", encoded_configuration)

    username = session["username"]

    ts = time.time()

    new_config = {
        'username': username,
        'passwd': passwd,
        'port': port,
        'users_count': users_count,
        'creation_date': datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')
    }
    try:
        table_config.put_item(Item=new_config)
        message = 'Config added successfully'
        return redirect(url_for('panel'))
    except ClientError as e:
        message = 'Error registering config'
        return jsonify({'error': message, 'details': str(e)}), 500

@app.route('/config/<string:port>', methods=["DELETE"])
def deleteConfig(port):
    current_user = session["username"]
    if not current_user:
        return redirect(url_for('login'))

    try:
        # Vérifiez si la configuration existe pour l'utilisateur donné et le port spécifié
        print(current_user, port)
        response = table_config.scan(
            FilterExpression=Attr('username').eq(current_user) & Attr('port').eq(int(port))
        )
        items = response.get('Items', [])
        if not items:
            return jsonify({'message': 'Config not found'}), 404

        # Supprimer la configuration
        table_config.delete_item(
            Key={
                'username': current_user,
                'port': int(port)
            }
        )
        stop_websocket(port)
        return jsonify({'message': 'Config deleted successfully'}), 200

    except ClientError as e:
        return jsonify({'error': 'Error deleting config', 'details': str(e)}), 500


@app.route('/panel')
@jwt_required(optional=True, locations=["cookies"])
def panel():
    current_user = get_jwt_identity()
    if not current_user:
        return redirect(url_for('login'))  # Redirect to the login page if JWT token is not present
    return render_template('panel.html', user=current_user)


def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('localhost', 0))
        return s.getsockname()[1]

def signal_handler(sig, frame):
    print('Stopping WebSocket threads...')
    for thread in websocket_threads:
        thread[0].stop_event.set()
        thread[0].join()
    print('Exiting...')
    sys.exit(0)


if __name__ == '__main__':
    signal.signal(signal.SIGINT, signal_handler)
    app.run(debug=True)

    
