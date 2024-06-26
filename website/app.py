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
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token, get_jwt_identity
import datetime
import time
from datetime import timedelta


load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = "RomainLeoAdrienAmnaNathan"
app.config["JWT_SECRET_KEY"] ="NathanLeoAdrienRomainAmna"
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_SECURE"] = True  # Mettre à True en production avec HTTPS
app.config["JWT_ACCESS_COOKIE_PATH"] = "/"
app.config["JWT_REFRESH_COOKIE_PATH"] = "/refresh"
app.config["JWT_COOKIE_CSRF_PROTECT"] = True  # Mettre à True en production
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=30)  # Durée de validité de l'access token
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=365)


# Récupérer les clés d'accès depuis les variables d'environnement
aws_access_key_id = "AKIAZQ3DT3D4D4FHKNV4"
aws_secret_access_key = "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"
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
        self.connected_clients = set()
        self.clients_count = 0

    def run(self):
        asyncio.run(self.start_server(self.port))

    async def start_server(self, port):
        try:
            print(f"Starting WebSocket server on port {port}")
            self.server = await websockets.serve(self.register_client, "0.0.0.0", port)
            await self.stop_event.wait()
        except Exception as e:
            print(f"WebSocket server on port {port} encountered an error:", e)

    async def register_client(self, websocket: WebSocketServerProtocol):
        
        if self.clients_count <= int(self.configuration["users_count"]) :
            self.connected_clients.add(websocket)
            self.clients_count += 1
            print("Client registered")
            try:
                async for message in websocket:
                    await self.broadcast(message)
            finally:
                self.connected_clients.remove(websocket)
                self.clients_count -= 1

    async def broadcast(self, message: str):
        if self.connected_clients:
            print(message)
            await asyncio.gather(*(client.send(message) for client in self.connected_clients))

    def stop_server(self):
        if self.server:
            self.server.close()
            asyncio.new_event_loop().run_until_complete(asyncio.sleep(1))
            self.stop_event.set()

connected_clients: Set[WebSocketServerProtocol] = set()
websocket_threads = []

def start_websocket(configuration):
    stop_event = asyncio.Event()
    stop_event = asyncio.Event()
    thread = WebSocketThread(configuration, stop_event)
    thread.start()
    websocket_threads.append((thread, stop_event))
    websocket_threads.append((thread, stop_event))

def stop_websocket(port):
    global websocket_threads

    # Find the WebSocket thread corresponding to the specified port
    threads_to_remove = []
    for thread, stop_event, stop_event in websocket_threads:
        if int(thread.configuration["port"]) == int(port):
            print("Stopping WebSocket server on port:", port)
            stop_event.set()
            threads_to_remove.append((thread, stop_event))
            stop_event.set()
            threads_to_remove.append((thread, stop_event))

    # Remove the thread from the list
    for thread, stop_event in threads_to_remove:
        websocket_threads.remove((thread, stop_event))

    for thread, stop_event in threads_to_remove:
        websocket_threads.remove((thread, stop_event))

connected_clients: Set[WebSocketServerProtocol] = set()
websocket_threads = []



def start_websocket(configuration):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    stop_event = asyncio.Event()
    thread = WebSocketThread(configuration, stop_event)
    thread.start()
    websocket_threads.append((thread, stop_event))


def stop_websocket(port):
    global websocket_threads

    # Find the WebSocket thread corresponding to the specified port
    threads_to_remove = []
    for thread, stop_event in websocket_threads:
        if int(thread.configuration["port"]) == int(port):
            print("Stopping WebSocket server on port:", port)
            stop_event.set()
            threads_to_remove.append((thread, stop_event))

    # Remove the thread from the list
    for thread, stop_event in threads_to_remove:
        websocket_threads.remove((thread, stop_event))


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/token/<string:token>', methods=['GET'])
def getToken(token):
    try:
        # Recherche dans la table `configs` pour voir si le token existe
        response = table_config.scan(FilterExpression=Attr('config_encoded').eq(token))
        items = response.get('Items', [])
        
        if items:
            return jsonify({'exists': True}), 200
        else:
            return jsonify({'exists': False}), 404
    except ClientError as e:
        return jsonify({'error': 'Error checking token', 'details': str(e)}), 500


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
    allowed_fields = {'email', 'credit'}

    # Vérifier si l'email est déjà utilisé par un autre utilisateur
    if 'email' in data:
        response = table.scan(FilterExpression=Attr('email').eq(data['email']))
        existing_user_email = response.get('Items')
        if existing_user_email and existing_user_email[0]['username'] != username:
            return jsonify({'error': 'Email already exists'}), 400

    # Vérifier si des champs non autorisés sont présents dans la requête
    for field in data.keys():
        if field not in allowed_fields:
            return jsonify({'error': f'Field "{field}" not allowed for update'}), 400

    # Construire l'expression de mise à jour
    update_expression = 'SET '
    expression_attribute_values = {}

    if 'password' in data:
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), salt)
        update_expression += 'password = :password, '
        expression_attribute_values[':password'] = hashed_password.decode('utf-8')
        update_expression += 'salt = :salt, '
        expression_attribute_values[':salt'] = salt.decode('utf-8')

    if 'email' in data:
        update_expression += 'email = :email, '
        expression_attribute_values[':email'] = data['email']

    if 'credit' in data:
        update_expression += 'credit = :credit, '
        expression_attribute_values[':credit'] = int(data['credit'])

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
        return jsonify({'message': 'No valid fields to update'}), 400

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
@jwt_required()
def deleteUser(username):
    current_user = get_jwt_identity()
    
    # Vérifier si l'utilisateur actuel est un administrateur
    if not current_user or not current_user['is_admin']:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        # Supprimer l'utilisateur de la base de données
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
        'creation_date': datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S'),
        'config_encoded' : encoded_configuration,
        'config_encoded' : encoded_configuration
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


@app.route('/config/<int:port>', methods=["GET"])
@jwt_required(locations=["cookies"])
def getConfig(port):
    try:
        current_user = get_jwt_identity()
        if not current_user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        # Récupérer la configuration depuis la base de données en fonction de l'utilisateur et du port
        response = table_config.get_item(
            Key={
                'username': current_user['username'],
                'port': port
            }
        )
        config = response.get('Item')

        if config:
            return jsonify({'config': config}), 200
        else:
            return jsonify({'message': 'Config not found'}), 404

    except ClientError as e:
        return jsonify({'error': 'Error retrieving config', 'details': str(e)}), 500

@app.route('/config/<int:port>', methods=["PUT"])
@jwt_required()
def updateConfigUsersCount(port):
    try:
        current_user = get_jwt_identity()
        if not current_user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        # Vérifier si l'utilisateur est administrateur
        if not current_user.get('is_admin', False):
            return jsonify({'error': 'Unauthorized, admin access required'}), 401
        
        # Récupérer les données JSON de la requête
        request_data = request.get_json()
        new_users_count = request_data.get('users_count')

        if new_users_count is None:
            return jsonify({'error': 'Users count must be provided in JSON'}), 400
        
        # Mettre à jour le nombre d'utilisateurs dans la configuration
        response = table_config.update_item(
            Key={
                'username': current_user['username'],  # Clé de partition (hash key)
                'port': port  # Clé de tri (range key) ou une autre clé selon votre schéma
            },
            UpdateExpression='SET users_count = :uc',
            ExpressionAttributeValues={
                ':uc': int(new_users_count)
            },
            ReturnValues='UPDATED_NEW'
        )
        
        updated_config = response.get('Attributes')
        if updated_config:
            return jsonify({'message': 'Users count updated successfully', 'config': updated_config}), 200
        else:
            return jsonify({'error': 'Failed to update users count'}), 500

    except ClientError as e:
        return jsonify({'error': 'Error updating users count', 'details': str(e)}), 500




if __name__ == '__main__':
    signal.signal(signal.SIGINT, signal_handler)
    app.run(debug=True, host="0.0.0.0")

    
