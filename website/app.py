from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import os
import boto3
from botocore.exceptions import ClientError
import bcrypt

load_dotenv()

app = Flask(__name__)

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
    if e.response['Error']['Code'] == 'ResourceNotFoundException':
        print("La table 'user' n'existe pas.")
    else:
        print("Erreur lors de la connexion à DynamoDB :", e)

# Créer la table user si elle n'existe pas
try:
    table = dynamodb.create_table(
        TableName='user',
        KeySchema=[
            {
                'AttributeName': 'id',
                'KeyType': 'HASH'  # Partition key
            }
        ],
        AttributeDefinitions=[
            {
                'AttributeName': 'id',
                'AttributeType': 'N'
            }
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    )
    # Attendre que la table soit créée
    table.meta.client.get_waiter('table_exists').wait(TableName='user')
    print("Table 'user' créée avec succès.")
except ClientError as e:
    if e.response['Error']['Code'] == 'ResourceInUseException':
        print("La table 'user' existe déjà.")
    else:
        print("Erreur lors de la création de la table 'user':", e)

table = dynamodb.Table('user')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/register', methods=["POST"])
def registerUser():
    data = request.get_json()
    user_id = int(table.item_count) + 1  # Simuler un ID auto-incrémenté
    password = data['password']
    # Générer un sel aléatoire pour le hachage du mot de passe
    salt = bcrypt.gensalt()
    # Hacher le mot de passe avec le sel
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    new_user = {
        'id': user_id,
        'username': data['username'],
        'email': data['email'],
        'password': hashed_password.decode('utf-8'),  # Convertir le hachage en chaîne de caractères
        'salt': salt.decode('utf-8')  # Convertir le sel en chaîne de caractères
    }
    
    try:
        table.put_item(Item=new_user)
        message = 'User registered successfully'
        return jsonify({'message': message, 'user': new_user}), 201
    except ClientError as e:
        message = 'Error registering user'
        return jsonify({'error': message, 'details': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
