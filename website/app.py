from flask import Flask, render_template,request,jsonify
from dotenv import load_dotenv
import os
import boto3


load_dotenv()

app = Flask(__name__)



dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION'),
                          aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                          aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'))

# Accéder à la table DynamoDB
table = dynamodb.Table('Porthub_database')
# Utiliser la variable DATABASE_URL dans app.config
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
@app.route('/')
def home():
    return render_template('index.html')


@app.route('/register', methods=["POST"])
def registerUser():
    data = request.get_json()
    new_user = {'username': data['username'], 'email': data['email'], 'password': data['password']}
    return jsonify(new_user)
    return new_user
    





if __name__ == '__main__':
    app.run(debug=True)
