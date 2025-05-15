export interface PythonOptions {
  version: string
  features: {
    jwt: boolean
    crud: boolean
    swagger: boolean
    tests: boolean
  }
  database: {
    type: "mongodb" | "mysql" | "postgres" | "sqlite"
    connectionString: string
  }
}

export function generatePythonCode(options: PythonOptions) {
  const files: Record<string, string> = {}

  // Generate requirements.txt
  files["requirements.txt"] = generateRequirementsTxt(options)

  // Generate app.py
  files["app.py"] = generateAppPy(options)

  // Generate database connection
  if (options.database.type !== "sqlite") {
    files["database.py"] = generateDatabasePy(options)
  }

  // Generate models
  files["models.py"] = generateModelsPy(options)

  if (options.features.jwt) {
    files["auth.py"] = generateAuthPy(options)
    files["routes/auth_routes.py"] = generateAuthRoutesPy(options)
  }

  // Generate routes
  files["routes/user_routes.py"] = generateUserRoutesPy(options)
  files["routes/__init__.py"] = "# Routes package\n"

  // Generate .env
  files[".env"] = generateEnvFile(options)

  // Generate README.md
  files["README.md"] = generateReadme(options)

  return files
}

function generateRequirementsTxt(options: PythonOptions): string {
  const requirements = ["Flask==2.0.1", "Flask-Cors==3.0.10", "python-dotenv==0.19.0"]

  if (options.features.jwt) {
    requirements.push("PyJWT==2.1.0")
    requirements.push("Flask-JWT-Extended==4.2.3")
  }

  if (options.features.swagger) {
    requirements.push("flask-swagger-ui==3.36.0")
    requirements.push("apispec==5.1.1")
  }

  switch (options.database.type) {
    case "mongodb":
      requirements.push("pymongo==3.12.0")
      requirements.push("Flask-PyMongo==2.3.0")
      break
    case "mysql":
      requirements.push("Flask-SQLAlchemy==2.5.1")
      requirements.push("PyMySQL==1.0.2")
      break
    case "postgres":
      requirements.push("Flask-SQLAlchemy==2.5.1")
      requirements.push("psycopg2-binary==2.9.1")
      break
    case "sqlite":
      requirements.push("Flask-SQLAlchemy==2.5.1")
      break
  }

  if (options.features.tests) {
    requirements.push("pytest==6.2.5")
    requirements.push("pytest-flask==1.2.0")
  }

  return requirements.join("\n")
}

function generateAppPy(options: PythonOptions): string {
  return `from flask import Flask, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

${options.database.type !== "sqlite" ? "# Import database connection\nfrom database import init_db" : ""}
${options.features.swagger ? "from flask_swagger_ui import get_swaggerui_blueprint" : ""}

# Import routes
from routes.user_routes import user_bp
${options.features.jwt ? "from routes.auth_routes import auth_bp" : ""}

app = Flask(__name__)
CORS(app)

# Configure app
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-key")

${
  options.database.type === "sqlite"
    ? `# Configure SQLite database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize database
from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy(app)

# Import models
from models import *

# Create database tables
@app.before_first_request
def create_tables():
    db.create_all()`
    : `# Initialize database
init_db(app)`
}

${
  options.features.jwt
    ? `# Configure JWT
from flask_jwt_extended import JWTManager
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-jwt-key")
jwt = JWTManager(app)`
    : ""
}

${
  options.features.swagger
    ? `# Configure Swagger
SWAGGER_URL = '/api/docs'
API_URL = '/static/swagger.json'
swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "Python API"
    }
)
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)`
    : ""
}

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api/users')
${options.features.jwt ? "app.register_blueprint(auth_bp, url_prefix='/api/auth')" : ""}

@app.route('/')
def home():
    return jsonify({"message": "Welcome to the Python API generated with BackendIO"})

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
`
}

function generateDatabasePy(options: PythonOptions): string {
  switch (options.database.type) {
    case "mongodb":
      return `from flask_pymongo import PyMongo

mongo = PyMongo()

def init_db(app):
    app.config["MONGO_URI"] = "${options.database.connectionString}"
    mongo.init_app(app)
    print("Connected to MongoDB")
`
    case "mysql":
      return `from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    app.config["SQLALCHEMY_DATABASE_URI"] = "${options.database.connectionString}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)
    print("Connected to MySQL")
    
    # Create tables
    with app.app_context():
        db.create_all()
`
    case "postgres":
      return `from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    app.config["SQLALCHEMY_DATABASE_URI"] = "${options.database.connectionString}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)
    print("Connected to PostgreSQL")
    
    # Create tables
    with app.app_context():
        db.create_all()
`
    default:
      return ""
  }
}

function generateModelsPy(options: PythonOptions): string {
  switch (options.database.type) {
    case "mongodb":
      return `# MongoDB models are defined as schemas in the routes
from bson import ObjectId

class User:
    def __init__(self, username, email, password, _id=None):
        self.username = username
        self.email = email
        self.password = password
        self._id = _id or ObjectId()
    
    @staticmethod
    def from_mongo(mongo_doc):
        if not mongo_doc:
            return None
        user = User(
            username=mongo_doc.get('username'),
            email=mongo_doc.get('email'),
            password=mongo_doc.get('password'),
            _id=mongo_doc.get('_id')
        )
        return user
    
    def to_json(self):
        return {
            "_id": str(self._id),
            "username": self.username,
            "email": self.email
        }
`
    case "mysql":
    case "postgres":
    case "sqlite":
      return `${options.database.type === "sqlite" ? "from app import db" : "from database import db"}
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def to_json(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat()
        }
`
    default:
      return ""
  }
}

function generateAuthPy(options: PythonOptions): string {
  return `import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import os

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "dev-jwt-key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_IN = 3600  # 1 hour

def hash_password(password):
    return generate_password_hash(password)

def check_password(hashed_password, password):
    return check_password_hash(hashed_password, password)

def generate_token(user_id):
    payload = {
        "exp": datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_EXPIRES_IN),
        "iat": datetime.datetime.utcnow(),
        "sub": str(user_id)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        return "Token expired. Please log in again."
    except jwt.InvalidTokenError:
        return "Invalid token. Please log in again."
`
}

function generateAuthRoutesPy(options: PythonOptions): string {
  if (options.database.type === "mongodb") {
    return `from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from database import mongo
from auth import hash_password, check_password, generate_token
from bson.objectid import ObjectId

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Check if required fields are present
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Check if user already exists
    if mongo.db.users.find_one({"email": data['email']}):
        return jsonify({"error": "User already exists"}), 400
    
    # Create new user
    new_user = {
        "username": data['username'],
        "email": data['email'],
        "password": hash_password(data['password']),
        "created_at": datetime.datetime.utcnow()
    }
    
    user_id = mongo.db.users.insert_one(new_user).inserted_id
    
    return jsonify({"message": "User created successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Check if required fields are present
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400
    
    # Find user
    user = mongo.db.users.find_one({"email": data['email']})
    
    # Check if user exists and password is correct
    if not user or not check_password(user['password'], data['password']):
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Generate token
    token = generate_token(str(user['_id']))
    
    return jsonify({
        "token": token,
        "user": {
            "id": str(user['_id']),
            "username": user['username'],
            "email": user['email']
        }
    })
`
  } else {
    return `from flask import Blueprint, request, jsonify
from models import User
${options.database.type === "sqlite" ? "from app import db" : "from database import db"}
from auth import hash_password, check_password, generate_token
import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Check if required fields are present
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "User already exists"}), 400
    
    # Create new user
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=hash_password(data['password'])
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User created successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Check if required fields are present
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400
    
    # Find user
    user = User.query.filter_by(email=data['email']).first()
    
    # Check if user exists and password is correct
    if not user or not check_password(user.password, data['password']):
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Generate token
    token = generate_token(user.id)
    
    return jsonify({
        "token": token,
        "user": user.to_json()
    })
`
  }
}

function generateUserRoutesPy(options: PythonOptions): string {
  if (options.database.type === "mongodb") {
    return `from flask import Blueprint, request, jsonify
from database import mongo
from bson.objectid import ObjectId
${options.features.jwt ? "from auth import decode_token" : ""}

user_bp = Blueprint('user', __name__)

${
  options.features.jwt
    ? `
# Middleware to verify token
def token_required(f):
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        
        user_id = decode_token(token)
        if isinstance(user_id, str) and user_id.startswith("Token"):
            return jsonify({"error": user_id}), 401
        
        return f(user_id, *args, **kwargs)
    
    return decorated
`
    : ""
}

@user_bp.route('/', methods=['GET'])
${options.features.jwt ? "@token_required" : ""}
def get_users(${options.features.jwt ? "current_user_id" : ""}):
    users = list(mongo.db.users.find({}, {"password": 0}))
    
    # Convert ObjectId to string
    for user in users:
        user['_id'] = str(user['_id'])
    
    return jsonify(users)

@user_bp.route('/<id>', methods=['GET'])
${options.features.jwt ? "@token_required" : ""}
def get_user(${options.features.jwt ? "current_user_id, " : ""}id):
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(id)}, {"password": 0})
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Convert ObjectId to string
        user['_id'] = str(user['_id'])
        
        return jsonify(user)
    except:
        return jsonify({"error": "Invalid user ID"}), 400

@user_bp.route('/<id>', methods=['PUT'])
${options.features.jwt ? "@token_required" : ""}
def update_user(${options.features.jwt ? "current_user_id, " : ""}id):
    try:
        data = request.get_json()
        
        # Check if user exists
        user = mongo.db.users.find_one({"_id": ObjectId(id)})
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Update user
        mongo.db.users.update_one(
            {"_id": ObjectId(id)},
            {"$set": {
                "username": data.get('username', user['username']),
                "email": data.get('email', user['email'])
            }}
        )
        
        return jsonify({"message": "User updated successfully"})
    except:
        return jsonify({"error": "Invalid user ID"}), 400

@user_bp.route('/<id>', methods=['DELETE'])
${options.features.jwt ? "@token_required" : ""}
def delete_user(${options.features.jwt ? "current_user_id, " : ""}id):
    try:
        # Check if user exists
        user = mongo.db.users.find_one({"_id": ObjectId(id)})
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Delete user
        mongo.db.users.delete_one({"_id": ObjectId(id)})
        
        return jsonify({"message": "User deleted successfully"})
    except:
        return jsonify({"error": "Invalid user ID"}), 400
`
  } else {
    return `from flask import Blueprint, request, jsonify
from models import User
${options.database.type === "sqlite" ? "from app import db" : "from database import db"}
${options.features.jwt ? "from auth import decode_token" : ""}

user_bp = Blueprint('user', __name__)

${
  options.features.jwt
    ? `
# Middleware to verify token
def token_required(f):
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        
        user_id = decode_token(token)
        if isinstance(user_id, str) and user_id.startswith("Token"):
            return jsonify({"error": user_id}), 401
        
        return f(user_id, *args, **kwargs)
    
    return decorated
`
    : ""
}

@user_bp.route('/', methods=['GET'])
${options.features.jwt ? "@token_required" : ""}
def get_users(${options.features.jwt ? "current_user_id" : ""}):
    users = User.query.all()
    return jsonify([user.to_json() for user in users])

@user_bp.route('/<int:id>', methods=['GET'])
${options.features.jwt ? "@token_required" : ""}
def get_user(${options.features.jwt ? "current_user_id, " : ""}id):
    user = User.query.get(id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify(user.to_json())

@user_bp.route('/<int:id>', methods=['PUT'])
${options.features.jwt ? "@token_required" : ""}
def update_user(${options.features.jwt ? "current_user_id, " : ""}id):
    user = User.query.get(id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.get_json()
    
    if 'username' in data:
        user.username = data['username']
    
    if 'email' in data:
        user.email = data['email']
    
    db.session.commit()
    
    return jsonify({"message": "User updated successfully"})

@user_bp.route('/<int:id>', methods=['DELETE'])
${options.features.jwt ? "@token_required" : ""}
def delete_user(${options.features.jwt ? "current_user_id, " : ""}id):
    user = User.query.get(id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({"message": "User deleted successfully"})
`
  }
}

function generateEnvFile(options: PythonOptions): string {
  return `# Environment variables
PORT=5000
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret_key
${
  options.database.type === "mongodb"
    ? `MONGO_URI=${options.database.connectionString}`
    : options.database.type === "mysql"
      ? `DATABASE_URL=${options.database.connectionString}`
      : options.database.type === "postgres"
        ? `DATABASE_URL=${options.database.connectionString}`
        : "# SQLite doesn't need a connection string"
}
`
}

function generateReadme(options: PythonOptions): string {
  return `# Python API

This project was generated with BackendIO.

## Features

- Flask REST API
${options.features.jwt ? "- JWT Authentication\n" : ""}
${options.features.crud ? "- CRUD Operations\n" : ""}
${options.features.swagger ? "- Swagger Documentation\n" : ""}
${options.features.tests ? "- Unit Tests\n" : ""}
- ${options.database.type.charAt(0).toUpperCase() + options.database.type.slice(1)} Database

## Requirements

- Python ${options.version}
- pip

## Installation

1. Create a virtual environment:
\`\`\`bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
\`\`\`

2. Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

3. Set up environment variables:
Create a .env file with the following variables:
\`\`\`
PORT=5000
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret_key
${
  options.database.type === "mongodb"
    ? `MONGO_URI=${options.database.connectionString}`
    : options.database.type === "mysql" || options.database.type === "postgres"
      ? `DATABASE_URL=${options.database.connectionString}`
      : "# SQLite doesn't need a connection string"
}
\`\`\`

## Running the Application

\`\`\`bash
python app.py
\`\`\`

The API will be available at http://localhost:5000

${options.features.swagger ? "## API Documentation\n\nSwagger documentation is available at http://localhost:5000/api/docs\n" : ""}

${options.features.tests ? "## Running Tests\n\n```bash\npytest\n```\n" : ""}

## API Endpoints

### Users
- GET /api/users - Get all users
- GET /api/users/:id - Get a user by ID
- PUT /api/users/:id - Update a user
- DELETE /api/users/:id - Delete a user

${options.features.jwt ? "### Authentication\n- POST /api/auth/register - Register a new user\n- POST /api/auth/login - Login and get a JWT token\n" : ""}

## Generated with BackendIO
`
}
