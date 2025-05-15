export const generateNodeJSCode = (config: any): Record<string, string> => {
  const { version, features, database } = config

  const files: Record<string, string> = {}

  // Basic structure
  files["package.json"] = JSON.stringify(
    {
      name: "backend-generator",
      version: "1.0.0",
      description: "Generated backend",
      main: "index.js",
      scripts: {
        start: "node index.js",
        dev: "nodemon index.js",
        test: features.tests ? "jest" : 'echo "Error: no test specified" && exit 1',
      },
      dependencies: {
        express: "^4.18.0",
        cors: "^2.8.5",
        ...(database.type === "mongodb" ? { mongoose: "^6.0.0" } : {}),
        ...(database.type === "mysql" ? { mysql2: "^2.3.3", sequelize: "^6.19.0" } : {}),
        ...(database.type === "postgres" ? { pg: "^8.7.3", "pg-hstore": "^2.3.4", sequelize: "^6.19.0" } : {}),
        ...(database.type === "sqlite" ? { sqlite3: "^5.0.8", sequelize: "^6.19.0" } : {}),
        ...(features.jwt ? { jsonwebtoken: "^8.5.1", bcryptjs: "^2.4.3" } : {}),
        ...(features.swagger ? { "swagger-ui-express": "^4.3.0", "swagger-jsdoc": "^6.2.1" } : {}),
        dotenv: "^16.0.0",
      },
      devDependencies: {
        ...(features.tests ? { jest: "^28.0.0", supertest: "^6.2.3" } : {}),
        nodemon: "^2.0.15",
      },
    },
    null,
    2,
  )

  // Main index.js file
  files["index.js"] = `
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

${
  features.swagger
    ? `
// Swagger documentation
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'API Documentation',
    },
    servers: [
      {
        url: 'http://localhost:' + PORT,
        description: 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js', './models/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
`
    : ""
}

// Routes
${features.crud ? "const userRoutes = require('./routes/user.routes');\napp.use('/api/users', userRoutes);" : ""}
${features.jwt ? "const authRoutes = require('./routes/auth.routes');\napp.use('/api/auth', authRoutes);" : ""}

// Database connection
${database.type !== "none" ? "require('./config/db.config');" : ""}

// Start server
app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});

${features.tests ? "module.exports = app; // For testing" : ""}
`

  // Environment variables
  files[".env"] = `
PORT=3000
${database.type === "mongodb" ? `MONGODB_URI=${database.connectionString}` : ""}
${
  database.type === "mysql" || database.type === "postgres" || database.type === "sqlite"
    ? `DB_HOST=${database.type === "sqlite" ? "localhost" : database.connectionString.split("@")[1]?.split(":")[0] || "localhost"}
DB_USER=${database.type === "sqlite" ? "" : database.connectionString.split("//")[1]?.split(":")[0] || "root"}
DB_PASSWORD=${database.type === "sqlite" ? "" : database.connectionString.split(":")[2]?.split("@")[0] || "password"}
DB_NAME=${database.type === "sqlite" ? database.connectionString : database.connectionString.split("/").pop() || "mydb"}
DB_DIALECT=${database.type}`
    : ""
}
${features.jwt ? "JWT_SECRET=your_jwt_secret_key\nJWT_EXPIRES_IN=1h" : ""}
`

  // Database configuration
  if (database.type !== "none") {
    files["config/db.config.js"] =
      database.type === "mongodb"
        ? `
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));
`
        : `
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    ${database.type === "sqlite" ? "storage: process.env.DB_NAME," : ""}
    logging: false,
  }
);

// Test the connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync all models
    await sequelize.sync();
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

module.exports = sequelize;
`
  }

  // Models
  if (features.crud) {
    if (database.type === "mongodb") {
      files["models/user.model.js"] = `
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the user
 *         name:
 *           type: string
 *           description: The name of the user
 *         email:
 *           type: string
 *           description: The email of the user
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the user was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the user was last updated
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  ${
    features.jwt
      ? `
  password: {
    type: String,
    required: true,
  },`
      : ""
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
`
    } else if (["mysql", "postgres", "sqlite"].includes(database.type)) {
      files["models/user.model.js"] = `
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the user
 *         name:
 *           type: string
 *           description: The name of the user
 *         email:
 *           type: string
 *           description: The email of the user
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the user was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the user was last updated
 */
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  ${
    features.jwt
      ? `
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },`
      : ""
  }
});

module.exports = User;
`
    }
  }

  // Controllers
  if (features.crud) {
    files["controllers/user.controller.js"] =
      database.type === "mongodb"
        ? `
const User = require('../models/user.model');

// Create a new user
exports.create = async (req, res) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users
exports.findAll = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single user by ID
exports.findOne = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a user
exports.update = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a user
exports.delete = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
`
        : `
const User = require('../models/user.model');

// Create a new user
exports.create = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users
exports.findAll = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single user by ID
exports.findOne = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a user
exports.update = async (req, res) => {
  try {
    const [updated] = await User.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const updatedUser = await User.findByPk(req.params.id);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a user
exports.delete = async (req, res) => {
  try {
    const deleted = await User.destroy({
      where: { id: req.params.id }
    });
    if (deleted === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
`
  }

  // Routes
  if (features.crud) {
    files["routes/user.routes.js"] = `
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
${features.jwt ? "const { verifyToken } = require('../middleware/auth.middleware');" : ""}

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/', ${features.jwt ? "verifyToken, " : ""}userController.findAll);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/:id', ${features.jwt ? "verifyToken, " : ""}userController.findOne);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
router.post('/', ${features.jwt ? "verifyToken, " : ""}userController.create);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/:id', ${features.jwt ? "verifyToken, " : ""}userController.update);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', ${features.jwt ? "verifyToken, " : ""}userController.delete);

module.exports = router;
`
  }

  // JWT Authentication
  if (features.jwt) {
    files["controllers/auth.controller.js"] =
      database.type === "mongodb"
        ? `
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create new user
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });

    // Save user
    const savedUser = await user.save();

    // Remove password from response
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      user: userResponse,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
`
        : `
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: req.body.email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create new user
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json({
      user: userResponse,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
`

    files["routes/auth.routes.js"] = `
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists
 *       500:
 *         description: Server error
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;
`

    files["middleware/auth.middleware.js"] = `
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
`
  }

  // Tests
  if (features.tests) {
    files["tests/user.test.js"] = `
const request = require('supertest');
const app = require('../index');
${database.type === "mongodb" ? "const mongoose = require('mongoose');" : "const sequelize = require('../config/db.config');"}
const User = require('../models/user.model');

${features.jwt ? "let token;" : ""}
let userId;

beforeAll(async () => {
  // Clear users collection
  ${database.type === "mongodb" ? "await User.deleteMany({});" : "await User.destroy({ where: {}, truncate: true });"}
  
  ${
    features.jwt
      ? `
  // Create a test user and get token
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
  
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'password123'
    });
  
  token = loginResponse.body.token;
  `
      : `
  // Create a test user
  const response = await request(app)
    .post('/api/users')
    .send({
      name: 'Test User',
      email: 'test@example.com'
    });
  `
  }
  
  userId = response.body.${database.type === "mongodb" ? "_id" : "id"};
});

afterAll(async () => {
  // Disconnect from database
  ${database.type === "mongodb" ? "await mongoose.connection.close();" : "await sequelize.close();"}
});

describe('User API', () => {
  it('should get all users', async () => {
    const response = await request(app)
      .get('/api/users')
      ${features.jwt ? ".set('Authorization', `Bearer ${token}`)" : ""};
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get a user by ID', async () => {
    const response = await request(app)
      .get(\`/api/users/\${userId}\`)
      ${features.jwt ? ".set('Authorization', `Bearer ${token}`)" : ""};
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Test User');
  });

  it('should update a user', async () => {
    const response = await request(app)
      .put(\`/api/users/\${userId}\`)
      ${features.jwt ? ".set('Authorization', `Bearer ${token}`)" : ""}
      .send({
        name: 'Updated User'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated User');
  });

  it('should return 404 for non-existent user', async () => {
    const response = await request(app)
      .get('/api/users/${database.type === "mongodb" ? "60f1a5c5c6e1e52d68a38f99" : "999"}')
      ${features.jwt ? ".set('Authorization', `Bearer ${token}`)" : ""};
    
    expect(response.status).toBe(404);
  });
});
`
  }

  // README.md
  files["README.md"] = `
# Node.js Backend API

This is a Node.js backend API generated with BackendIO.

## Features

- Express.js REST API
${features.jwt ? "- JWT Authentication\n" : ""}
${features.crud ? "- CRUD Operations\n" : ""}
${features.swagger ? "- Swagger Documentation\n" : ""}
${features.tests ? "- Jest Testing\n" : ""}
- ${database.type.charAt(0).toUpperCase() + database.type.slice(1)} Database

## Requirements

- Node.js ${version}
- ${database.type.charAt(0).toUpperCase() + database.type.slice(1)} Database

## Installation

1. Clone the repository
2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
Create a .env file with the following variables:
\`\`\`
PORT=3000
${database.type === "mongodb" ? `MONGODB_URI=${database.connectionString}` : ""}
${
  database.type === "mysql" || database.type === "postgres" || database.type === "sqlite"
    ? `DB_HOST=${database.type === "sqlite" ? "localhost" : database.connectionString.split("@")[1]?.split(":")[0] || "localhost"}
DB_USER=${database.type === "sqlite" ? "" : database.connectionString.split("//")[1]?.split(":")[0] || "root"}
DB_PASSWORD=${database.type === "sqlite" ? "" : database.connectionString.split(":")[2]?.split("@")[0] || "password"}
DB_NAME=${database.type === "sqlite" ? database.connectionString : database.connectionString.split("/").pop() || "mydb"}
DB_DIALECT=${database.type}`
    : ""
}
${features.jwt ? "JWT_SECRET=your_jwt_secret_key\nJWT_EXPIRES_IN=1h" : ""}
\`\`\`

## Running the Application

\`\`\`bash
# Development
npm run dev

# Production
npm start
\`\`\`

The API will be available at http://localhost:3000

${features.swagger ? "## API Documentation\n\nSwagger documentation is available at http://localhost:3000/api-docs\n" : ""}

${features.tests ? "## Running Tests\n\n```bash\nnpm test\n```\n" : ""}

## API Endpoints

${
  features.crud
    ? `### Users
- GET /api/users - Get all users
- GET /api/users/:id - Get a user by ID
- POST /api/users - Create a new user
- PUT /api/users/:id - Update a user
- DELETE /api/users/:id - Delete a user
`
    : ""
}

${
  features.jwt
    ? `### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login and get a JWT token
- GET /api/auth/me - Get current user (requires authentication)
`
    : ""
}

## Generated with BackendIO
`

  return files
}
