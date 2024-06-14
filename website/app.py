from boto3.dynamodb.conditions import Attr
from flask import Flask, redirect, render_template, request, jsonify,make_response, url_for,flash
from dotenv import load_dotenv
import os
import boto3
from botocore.exceptions import ClientError
import bcrypt
import jwt

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv('SECRET_KEY')

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

# Créer la table user si elle n'existe pas
# try:
#     table = dynamodb.create_table(
#         TableName='user',
#         KeySchema=[
#             {
#                 'AttributeName': 'username',
#                 'KeyType': 'HASH'  # Partition key
#             }
#         ],
#         AttributeDefinitions=[
#             {
#                 'AttributeName': 'username',
#                 'AttributeType': 'S'
#             }
#         ],
#         ProvisionedThroughput={
#             'ReadCapacityUnits': 5,
#             'WriteCapacityUnits': 5
#         }
#     )
#     # Attendre que la table soit créée
#     table.meta.client.get_waiter('table_exists').wait(TableName='user')
#     print("Table 'user' créée avec succès.")
# except ClientError as e:
#     print("Erreur lors de la création de la table 'user':", e)

table = dynamodb.Table('user')

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
def deleteUser(username):
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

    print(username,password)

    user = authenticate(username, password)
    if user:
        is_admin = user.get('role') == 'admin'
        credit = user.get('credit')

        token_data = {
            'username': username,
            'is_admin': is_admin,
            'credit': str(credit)
        }
        token = jwt.encode(token_data, app.config['SECRET_KEY'], algorithm='HS256')

        # Créer une réponse contenant le token
        response = make_response(jsonify({'token': token}))

        
        # Ajouter le token aux cookies de la réponse (ou stocker ailleurs selon vos besoins)
        response.set_cookie('token', token)

        return redirect(url_for('login'))
    else:
        return jsonify({'error': 'Invalid credentials'}), 401
    
@app.route('/register')
def register():
    return render_template("register.html")

@app.route('/login')
def login():
    return render_template("connexion.html")
if __name__ == '__main__':
    app.run(debug=True)
