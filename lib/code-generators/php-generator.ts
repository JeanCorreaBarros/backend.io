export interface PHPOptions {
  version: string
  features: {
    jwt: boolean
    crud: boolean
    swagger: boolean
    tests: boolean
  }
  database: {
    type: "mysql" | "postgres" | "sqlite"
    connectionString: string
  }
}

export function generatePHPCode(options: PHPOptions) {
  const files: Record<string, string> = {}

  // Generate composer.json
  files["composer.json"] = generateComposerJson(options)

  // Generate index.php
  files["public/index.php"] = generateIndexPhp(options)

  // Generate .htaccess
  files["public/.htaccess"] = generateHtaccess()

  // Generate config files
  files["config/database.php"] = generateDatabaseConfig(options)

  if (options.features.jwt) {
    files["config/jwt.php"] = generateJwtConfig()
  }

  // Generate bootstrap file
  files["bootstrap/app.php"] = generateBootstrapApp(options)

  // Generate controllers
  files["app/Controllers/UserController.php"] = generateUserController(options)

  if (options.features.jwt) {
    files["app/Controllers/AuthController.php"] = generateAuthController(options)
  }

  // Generate models
  files["app/Models/User.php"] = generateUserModel(options)

  // Generate middleware
  if (options.features.jwt) {
    files["app/Middleware/JwtMiddleware.php"] = generateJwtMiddleware()
  }

  // Generate routes
  files["app/routes.php"] = generateRoutes(options)

  // Generate .env
  files[".env"] = generateEnvFile(options)

  // Generate README.md
  files["README.md"] = generateReadme(options)

  return files
}

function generateComposerJson(options: PHPOptions): string {
  const dependencies: Record<string, string> = {
    "slim/slim": "^4.9",
    "slim/psr7": "^1.5",
    "php-di/php-di": "^6.3",
    "vlucas/phpdotenv": "^5.3",
  }

  if (options.features.jwt) {
    dependencies["firebase/php-jwt"] = "^5.4"
  }

  switch (options.database.type) {
    case "mysql":
    case "postgres":
      dependencies["illuminate/database"] = "^8.0"
      break
    case "sqlite":
      dependencies["illuminate/database"] = "^8.0"
      break
  }

  if (options.features.swagger) {
    dependencies["swagger-php"] = "^3.2"
  }

  const devDependencies: Record<string, string> = {}

  if (options.features.tests) {
    devDependencies["phpunit/phpunit"] = "^9.5"
  }

  return JSON.stringify(
    {
      name: "backend-io/php-api",
      description: "PHP API generated with BackendIO",
      type: "project",
      require: dependencies,
      "require-dev": devDependencies,
      autoload: {
        "psr-4": {
          "App\\": "app/",
        },
      },
      scripts: {
        start: "php -S localhost:8000 -t public",
      },
    },
    null,
    2,
  )
}

function generateIndexPhp(options: PHPOptions): string {
  return `<?php
declare(strict_types=1);

use DI\\ContainerBuilder;
use Slim\\Factory\\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Set up dependencies
$containerBuilder = new ContainerBuilder();
$container = $containerBuilder->build();

// Create app
$app = AppFactory::createFromContainer($container);

// Add error middleware
$app->addErrorMiddleware(true, true, true);

// Register routes
require __DIR__ . '/../app/routes.php';

// Run app
$app->run();
`
}

function generateHtaccess(): string {
  return `RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]
`
}

function generateDatabaseConfig(options: PHPOptions): string {
  return `<?php
declare(strict_types=1);

return [
    'driver' => '${options.database.type}',
    'connection_string' => '${options.database.connectionString}',
    'charset' => 'utf8',
    'collation' => 'utf8_unicode_ci',
    'prefix' => '',
];
`
}

function generateJwtConfig(): string {
  return `<?php
declare(strict_types=1);

return [
    'secret' => $_ENV['JWT_SECRET'] ?? 'your-secret-key',
    'algorithm' => 'HS256',
    'expires' => 3600, // 1 hour
];
`
}

function generateBootstrapApp(options: PHPOptions): string {
  return `<?php
declare(strict_types=1);

use Illuminate\\Database\\Capsule\\Manager as Capsule;

// Set up database connection
$capsule = new Capsule;

$dbConfig = require __DIR__ . '/../config/database.php';

$capsule->addConnection([
    'driver' => $dbConfig['driver'],
    'database' => $dbConfig['connection_string'],
    'charset' => $dbConfig['charset'],
    'collation' => $dbConfig['collation'],
    'prefix' => $dbConfig['prefix'],
]);

// Make this Capsule instance available globally
$capsule->setAsGlobal();

// Setup the Eloquent ORM
$capsule->bootEloquent();

// Create tables if they don't exist
if (!Capsule::schema()->hasTable('users')) {
    Capsule::schema()->create('users', function ($table) {
        $table->increments('id');
        $table->string('username')->unique();
        $table->string('email')->unique();
        $table->string('password');
        $table->timestamps();
    });
}
`
}

function generateUserController(options: PHPOptions): string {
  return `<?php
declare(strict_types=1);

namespace App\\Controllers;

use Psr\\Http\\Message\\ResponseInterface as Response;
use Psr\\Http\\Message\\ServerRequestInterface as Request;
use App\\Models\\User;

class UserController
{
    public function getAll(Request $request, Response $response): Response
    {
        $users = User::all();
        $response->getBody()->write(json_encode($users));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getOne(Request $request, Response $response, array $args): Response
    {
        $id = (int) $args['id'];
        $user = User::find($id);

        if (!$user) {
            $response->getBody()->write(json_encode(['error' => 'User not found']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode($user));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = (int) $args['id'];
        $user = User::find($id);

        if (!$user) {
            $response->getBody()->write(json_encode(['error' => 'User not found']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $data = $request->getParsedBody();
        
        if (isset($data['username'])) {
            $user->username = $data['username'];
        }
        
        if (isset($data['email'])) {
            $user->email = $data['email'];
        }
        
        $user->save();

        $response->getBody()->write(json_encode(['message' => 'User updated successfully']));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = (int) $args['id'];
        $user = User::find($id);

        if (!$user) {
            $response->getBody()->write(json_encode(['error' => 'User not found']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $user->delete();

        $response->getBody()->write(json_encode(['message' => 'User deleted successfully']));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
`
}

function generateAuthController(options: PHPOptions): string {
  return `<?php
declare(strict_types=1);

namespace App\\Controllers;

use Psr\\Http\\Message\\ResponseInterface as Response;
use Psr\\Http\\Message\\ServerRequestInterface as Request;
use App\\Models\\User;
use Firebase\\JWT\\JWT;

class AuthController
{
    public function register(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        // Validate required fields
        if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
            $response->getBody()->write(json_encode(['error' => 'Missing required fields']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        // Check if user already exists
        $existingUser = User::where('email', $data['email'])->first();
        if ($existingUser) {
            $response->getBody()->write(json_encode(['error' => 'User already exists']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        // Create new user
        $user = new User();
        $user->username = $data['username'];
        $user->email = $data['email'];
        $user->password = password_hash($data['password'], PASSWORD_DEFAULT);
        $user->save();
        
        $response->getBody()->write(json_encode(['message' => 'User created successfully']));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }
    
    public function login(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        // Validate required fields
        if (!isset($data['email']) || !isset($data['password'])) {
            $response->getBody()->write(json_encode(['error' => 'Missing email or password']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        // Find user
        $user = User::where('email', $data['email'])->first();
        
        // Verify credentials
        if (!$user || !password_verify($data['password'], $user->password)) {
            $response->getBody()->write(json_encode(['error' => 'Invalid credentials']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
        
        // Generate JWT token
        $jwtConfig = require __DIR__ . '/../../config/jwt.php';
        
        $payload = [
            'iss' => 'backend-io',
            'sub' => $user->id,
            'iat' => time(),
            'exp' => time() + $jwtConfig['expires']
        ];
        
        $token = JWT::encode($payload, $jwtConfig['secret'], $jwtConfig['algorithm']);
        
        $response->getBody()->write(json_encode([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email
            ]
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
}
`
}

function generateUserModel(options: PHPOptions): string {
  return `<?php
declare(strict_types=1);

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class User extends Model
{
    protected $fillable = ['username', 'email', 'password'];
    
    protected $hidden = ['password'];
}
`
}

function generateJwtMiddleware(): string {
  return `<?php
declare(strict_types=1);

namespace App\\Middleware;

use Psr\\Http\\Message\\ResponseInterface as Response;
use Psr\\Http\\Message\\ServerRequestInterface as Request;
use Psr\\Http\\Server\\MiddlewareInterface;
use Psr\\Http\\Server\\RequestHandlerInterface as RequestHandler;
use Firebase\\JWT\\JWT;
use Firebase\\JWT\\ExpiredException;

class JwtMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandler $handler): Response
    {
        $header = $request->getHeaderLine('Authorization');
        
        if (!$header) {
            $response = new \\Slim\\Psr7\\Response();
            $response->getBody()->write(json_encode(['error' => 'Token is missing']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
        
        $token = str_replace('Bearer ', '', $header);
        $jwtConfig = require __DIR__ . '/../../config/jwt.php';
        
        try {
            $decoded = JWT::decode($token, $jwtConfig['secret'], [$jwtConfig['algorithm']]);
            $request = $request->withAttribute('user_id', $decoded->sub);
            return $handler->handle($request);
        } catch (ExpiredException $e) {
            $response = new \\Slim\\Psr7\\Response();
            $response->getBody()->write(json_encode(['error' => 'Token expired']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        } catch (\\Exception $e) {
            $response = new \\Slim\\Psr7\\Response();
            $response->getBody()->write(json_encode(['error' => 'Invalid token']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
    }
}
`
}

function generateRoutes(options: PHPOptions): string {
  return `<?php
declare(strict_types=1);

use Slim\\Routing\\RouteCollectorProxy;
use App\\Controllers\\UserController;
${options.features.jwt ? "use App\\Controllers\\AuthController;\nuse App\\Middleware\\JwtMiddleware;" : ""}

// Define app routes
$app->get('/', function ($request, $response) {
    $response->getBody()->write(json_encode([
        'message' => 'Welcome to the PHP API generated with BackendIO'
    ]));
    return $response->withHeader('Content-Type', 'application/json');
});

// User routes
$app->group('/api/users', function (RouteCollectorProxy $group) {
    $group->get('', [UserController::class, 'getAll']);
    $group->get('/{id}', [UserController::class, 'getOne']);
    $group->put('/{id}', [UserController::class, 'update']);
    $group->delete('/{id}', [UserController::class, 'delete']);
})${options.features.jwt ? "->add(new JwtMiddleware())" : ""};

${
  options.features.jwt
    ? `
// Auth routes
$app->group('/api/auth', function (RouteCollectorProxy $group) {
    $group->post('/register', [AuthController::class, 'register']);
    $group->post('/login', [AuthController::class, 'login']);
});
`
    : ""
}
`
}

function generateEnvFile(options: PHPOptions): string {
  return `# Environment variables
APP_ENV=development
APP_DEBUG=true
${options.features.jwt ? "JWT_SECRET=your_jwt_secret_key" : ""}
`
}

function generateReadme(options: PHPOptions): string {
  return `# PHP API

This project was generated with BackendIO.

## Features

- Slim Framework REST API
${options.features.jwt ? "- JWT Authentication\n" : ""}
${options.features.crud ? "- CRUD Operations\n" : ""}
${options.features.swagger ? "- Swagger Documentation\n" : ""}
${options.features.tests ? "- Unit Tests\n" : ""}
- ${options.database.type.charAt(0).toUpperCase() + options.database.type.slice(1)} Database with Eloquent ORM

## Requirements

- PHP ${options.version}
- Composer

## Installation

1. Install dependencies:
\`\`\`bash
composer install
\`\`\`

2. Set up environment variables:
Create a .env file with the following variables:
\`\`\`
APP_ENV=development
APP_DEBUG=true
${options.features.jwt ? "JWT_SECRET=your_jwt_secret_key" : ""}
\`\`\`

## Running the Application

\`\`\`bash
composer start
\`\`\`

The API will be available at http://localhost:8000

${options.features.swagger ? "## API Documentation\n\nSwagger documentation is available at http://localhost:8000/api/docs\n" : ""}

${options.features.tests ? "## Running Tests\n\n```bash\nvendor/bin/phpunit\n```\n" : ""}

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
