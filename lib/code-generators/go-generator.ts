export interface GoOptions {
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

export function generateGoCode(options: GoOptions) {
  const files: Record<string, string> = {}

  // Generate go.mod
  files["go.mod"] = generateGoMod(options)

  // Generate main.go
  files["main.go"] = generateMainGo(options)

  // Generate config files
  files["config/config.go"] = generateConfigGo(options)
  files[".env"] = generateEnvFile(options)

  // Generate models
  files["models/user.go"] = generateUserModel(options)

  // Generate database connection
  files["database/database.go"] = generateDatabaseGo(options)

  // Generate handlers
  files["handlers/user_handler.go"] = generateUserHandler(options)

  if (options.features.jwt) {
    files["handlers/auth_handler.go"] = generateAuthHandler(options)
    files["middleware/jwt_middleware.go"] = generateJwtMiddleware(options)
  }

  // Generate routes
  files["routes/routes.go"] = generateRoutes(options)

  // Generate utils
  if (options.features.jwt) {
    files["utils/jwt_utils.go"] = generateJwtUtils(options)
  }
  files["utils/response_utils.go"] = generateResponseUtils()

  // Generate README.md
  files["README.md"] = generateReadme(options)

  return files
}

function generateGoMod(options: GoOptions): string {
  return `module github.com/backendio/api

go 1.${options.version.replace("Go ", "").split(".")[0]}

require (
	github.com/gin-gonic/gin v1.7.7
	github.com/joho/godotenv v1.4.0
	${getDatabaseImports(options.database.type)}
	${options.features.jwt ? "github.com/golang-jwt/jwt v3.2.2+incompatible" : ""}
	${options.features.swagger ? "github.com/swaggo/gin-swagger v1.4.1\n\tgithub.com/swaggo/swag v1.7.9" : ""}
)
`
}

function getDatabaseImports(dbType: string): string {
  switch (dbType) {
    case "mysql":
      return "github.com/go-sql-driver/mysql v1.6.0\n\tgorm.io/driver/mysql v1.3.2\n\tgorm.io/gorm v1.23.2"
    case "postgres":
      return "github.com/lib/pq v1.10.4\n\tgorm.io/driver/postgres v1.3.1\n\tgorm.io/gorm v1.23.2"
    case "sqlite":
      return "gorm.io/driver/sqlite v1.3.1\n\tgorm.io/gorm v1.23.2"
    default:
      return ""
  }
}

function generateMainGo(options: GoOptions): string {
  return `package main

import (
	"log"

	"github.com/backendio/api/config"
	"github.com/backendio/api/database"
	"github.com/backendio/api/routes"
	"github.com/gin-gonic/gin"
)

// @title BackendIO API
// @version 1.0
// @description API generated with BackendIO
// @host localhost:8080
// @BasePath /api
func main() {
	// Load configuration
	config, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize database
	db, err := database.InitDB(config)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Set up Gin router
	r := gin.Default()

	// Set up routes
	routes.SetupRoutes(r, db)

	// Start server
	log.Printf("Server running on port %s", config.ServerPort)
	if err := r.Run(":" + config.ServerPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
`
}

function generateConfigGo(options: GoOptions): string {
  return `package config

import (
	"os"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	ServerPort string
	DBType     string
	DBConnStr  string
	${options.features.jwt ? "JWTSecret  string\n\tJWTExpiry  string" : ""}
}

// LoadConfig loads configuration from environment variables
func LoadConfig() (*Config, error) {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		return nil, err
	}

	config := &Config{
		ServerPort: getEnv("SERVER_PORT", "8080"),
		DBType:     getEnv("DB_TYPE", "${options.database.type}"),
		DBConnStr:  getEnv("DB_CONN_STR", "${options.database.connectionString}"),
		${
      options.features.jwt
        ? `JWTSecret:  getEnv("JWT_SECRET", "your_jwt_secret"),
		JWTExpiry:  getEnv("JWT_EXPIRY", "24h"),`
        : ""
    }
	}

	return config, nil
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
`
}

function generateEnvFile(options: GoOptions): string {
  return `# Server Configuration
SERVER_PORT=8080

# Database Configuration
DB_TYPE=${options.database.type}
DB_CONN_STR=${options.database.connectionString}

${
  options.features.jwt
    ? `# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=24h`
    : ""
}
`
}

function generateUserModel(options: GoOptions): string {
  return `package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID        uint           \`json:"id" gorm:"primaryKey"\`
	Username  string         \`json:"username" gorm:"uniqueIndex;not null"\`
	Email     string         \`json:"email" gorm:"uniqueIndex;not null"\`
	Password  string         \`json:"-" gorm:"not null"\`
	CreatedAt time.Time      \`json:"created_at"\`
	UpdatedAt time.Time      \`json:"updated_at"\`
	DeletedAt gorm.DeletedAt \`json:"-" gorm:"index"\`
}

${
  options.features.jwt
    ? `
// AuthRequest represents the authentication request
type AuthRequest struct {
	Username string \`json:"username,omitempty"\`
	Email    string \`json:"email" binding:"required"\`
	Password string \`json:"password" binding:"required"\`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	Token string \`json:"token"\`
	User  User   \`json:"user"\`
}
`
    : ""
}
`
}

function generateDatabaseGo(options: GoOptions): string {
  return `package database

import (
	"github.com/backendio/api/config"
	"github.com/backendio/api/models"
	${getDatabaseDriverImport(options.database.type)}
	"gorm.io/gorm"
)

// InitDB initializes the database connection
func InitDB(config *config.Config) (*gorm.DB, error) {
	var db *gorm.DB
	var err error

	${getDatabaseConnectionCode(options.database.type)}

	// Auto migrate the schema
	err = db.AutoMigrate(&models.User{})
	if err != nil {
		return nil, err
	}

	return db, nil
}
`
}

function getDatabaseDriverImport(dbType: string): string {
  switch (dbType) {
    case "mysql":
      return '"gorm.io/driver/mysql"'
    case "postgres":
      return '"gorm.io/driver/postgres"'
    case "sqlite":
      return '"gorm.io/driver/sqlite"'
    default:
      return ""
  }
}

function getDatabaseConnectionCode(dbType: string): string {
  switch (dbType) {
    case "mysql":
      return `db, err = gorm.Open(mysql.Open(config.DBConnStr), &gorm.Config{})`
    case "postgres":
      return `db, err = gorm.Open(postgres.Open(config.DBConnStr), &gorm.Config{})`
    case "sqlite":
      return `db, err = gorm.Open(sqlite.Open(config.DBConnStr), &gorm.Config{})`
    default:
      return ""
  }
}

function generateUserHandler(options: GoOptions): string {
  return `package handlers

import (
	"net/http"
	"strconv"

	"github.com/backendio/api/models"
	"github.com/backendio/api/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// UserHandler handles user-related requests
type UserHandler struct {
	DB *gorm.DB
}

// NewUserHandler creates a new UserHandler
func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{DB: db}
}

// GetAllUsers gets all users
// @Summary Get all users
// @Description Get all users
// @Tags users
// @Accept json
// @Produce json
// @Success 200 {array} models.User
// @Router /users [get]
func (h *UserHandler) GetAllUsers(c *gin.Context) {
	var users []models.User
	result := h.DB.Find(&users)
	if result.Error != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to get users")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, users)
}

// GetUserByID gets a user by ID
// @Summary Get a user by ID
// @Description Get a user by ID
// @Tags users
// @Accept json
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} models.User
// @Failure 404 {object} utils.ErrorResponse
// @Router /users/{id} [get]
func (h *UserHandler) GetUserByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var user models.User
	result := h.DB.First(&user, id)
	if result.Error != nil {
		utils.RespondWithError(c, http.StatusNotFound, "User not found")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, user)
}

// UpdateUser updates a user
// @Summary Update a user
// @Description Update a user
// @Tags users
// @Accept json
// @Produce json
// @Param id path int true "User ID"
// @Param user body models.User true "User object"
// @Success 200 {object} models.User
// @Failure 404 {object} utils.ErrorResponse
// @Router /users/{id} [put]
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var user models.User
	result := h.DB.First(&user, id)
	if result.Error != nil {
		utils.RespondWithError(c, http.StatusNotFound, "User not found")
		return
	}

	var updateData struct {
		Username string \`json:"username,omitempty"\`
		Email    string \`json:"email,omitempty"\`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request body")
		return
	}

	if updateData.Username != "" {
		user.Username = updateData.Username
	}

	if updateData.Email != "" {
		user.Email = updateData.Email
	}

	h.DB.Save(&user)

	utils.RespondWithJSON(c, http.StatusOK, user)
}

// DeleteUser deletes a user
// @Summary Delete a user
// @Description Delete a user
// @Tags users
// @Accept json
// @Produce json
// @Param id path int true "User ID"
// @Success 204 {object} nil
// @Failure 404 {object} utils.ErrorResponse
// @Router /users/{id} [delete]
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var user models.User
	result := h.DB.First(&user, id)
	if result.Error != nil {
		utils.RespondWithError(c, http.StatusNotFound, "User not found")
		return
	}

	h.DB.Delete(&user)

	c.Status(http.StatusNoContent)
}
`
}

function generateAuthHandler(options: GoOptions): string {
  return `package handlers

import (
	"net/http"

	"github.com/backendio/api/models"
	"github.com/backendio/api/utils"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AuthHandler handles authentication-related requests
type AuthHandler struct {
	DB *gorm.DB
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{DB: db}
}

// Register registers a new user
// @Summary Register a new user
// @Description Register a new user
// @Tags auth
// @Accept json
// @Produce json
// @Param user body models.AuthRequest true "User registration data"
// @Success 201 {object} utils.SuccessResponse
// @Failure 400 {object} utils.ErrorResponse
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.AuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Check if user already exists
	var existingUser models.User
	if result := h.DB.Where("email = ?", req.Email).First(&existingUser); result.Error == nil {
		utils.RespondWithError(c, http.StatusBadRequest, "User with this email already exists")
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	// Create user
	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
	}

	if result := h.DB.Create(&user); result.Error != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create user")
		return
	}

	utils.RespondWithSuccess(c, http.StatusCreated, "User registered successfully")
}

// Login logs in a user
// @Summary Login a user
// @Description Login a user and get a JWT token
// @Tags auth
// @Accept json
// @Produce json
// @Param user body models.AuthRequest true "User login data"
// @Success 200 {object} models.AuthResponse
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.AuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Find user
	var user models.User
	if result := h.DB.Where("email = ?", req.Email).First(&user); result.Error != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Generate token
	token, err := utils.GenerateJWT(user.ID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, models.AuthResponse{
		Token: token,
		User:  user,
	})
}
`
}

function generateJwtMiddleware(options: GoOptions): string {
  return `package middleware

import (
	"net/http"
	"strings"

	"github.com/backendio/api/utils"
	"github.com/gin-gonic/gin"
)

// JWTAuth middleware for JWT authentication
func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.RespondWithError(c, http.StatusUnauthorized, "Authorization header is required")
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.RespondWithError(c, http.StatusUnauthorized, "Authorization header format must be Bearer {token}")
			c.Abort()
			return
		}

		token := parts[1]
		claims, err := utils.ValidateJWT(token)
		if err != nil {
			utils.RespondWithError(c, http.StatusUnauthorized, "Invalid or expired token")
			c.Abort()
			return
		}

		// Set user ID in context
		c.Set("userID", claims.UserID)
		c.Next()
	}
}
`
}

function generateRoutes(options: GoOptions): string {
  return `package routes

import (
	"github.com/backendio/api/handlers"
	${options.features.jwt ? '"github.com/backendio/api/middleware"' : ""}
	"github.com/gin-gonic/gin"
	${options.features.swagger ? '"github.com/swaggo/gin-swagger"\n\t"github.com/swaggo/gin-swagger/swaggerFiles"' : ""}
	"gorm.io/gorm"
)

// SetupRoutes sets up all the routes for the application
func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	// Create handlers
	userHandler := handlers.NewUserHandler(db)
	${options.features.jwt ? "authHandler := handlers.NewAuthHandler(db)" : ""}

	// API routes
	api := r.Group("/api")

	${
    options.features.jwt
      ? `
	// Auth routes
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}
	`
      : ""
  }

	// User routes
	users := api.Group("/users")
	${options.features.jwt ? "users.Use(middleware.JWTAuth())" : ""}
	{
		users.GET("", userHandler.GetAllUsers)
		users.GET("/:id", userHandler.GetUserByID)
		users.PUT("/:id", userHandler.UpdateUser)
		users.DELETE("/:id", userHandler.DeleteUser)
	}

	${
    options.features.swagger
      ? `
	// Swagger documentation
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	`
      : ""
  }

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})
}
`
}

function generateJwtUtils(options: GoOptions): string {
  return `package utils

import (
	"errors"
	"time"

	"github.com/backendio/api/config"
	"github.com/golang-jwt/jwt"
)

// JWTClaims represents the claims in the JWT
type JWTClaims struct {
	UserID uint \`json:"user_id"\`
	jwt.StandardClaims
}

// GenerateJWT generates a new JWT token
func GenerateJWT(userID uint) (string, error) {
	// Load config
	config, err := config.LoadConfig()
	if err != nil {
		return "", err
	}

	// Parse expiry duration
	expiry, err := time.ParseDuration(config.JWTExpiry)
	if err != nil {
		return "", err
	}

	// Create claims
	claims := JWTClaims{
		UserID: userID,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(expiry).Unix(),
			IssuedAt:  time.Now().Unix(),
			Issuer:    "backendio",
		},
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token
	tokenString, err := token.SignedString([]byte(config.JWTSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateJWT validates a JWT token and returns the claims
func ValidateJWT(tokenString string) (*JWTClaims, error) {
	// Load config
	config, err := config.LoadConfig()
	if err != nil {
		return nil, err
	}

	// Parse token
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(config.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	// Validate token
	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	// Get claims
	claims, ok := token.Claims.(*JWTClaims)
	if !ok {
		return nil, errors.New("invalid claims")
	}

	return claims, nil
}
`
}

function generateResponseUtils(): string {
  return `package utils

import (
	"github.com/gin-gonic/gin"
)

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string \`json:"error"\`
}

// SuccessResponse represents a success response
type SuccessResponse struct {
	Message string \`json:"message"\`
}

// RespondWithError sends an error response
func RespondWithError(c *gin.Context, code int, message string) {
	c.JSON(code, ErrorResponse{Error: message})
}

// RespondWithJSON sends a JSON response
func RespondWithJSON(c *gin.Context, code int, payload interface{}) {
	c.JSON(code, payload)
}

// RespondWithSuccess sends a success response
func RespondWithSuccess(c *gin.Context, code int, message string) {
	c.JSON(code, SuccessResponse{Message: message})
}
`
}

function generateReadme(options: GoOptions): string {
  return `# Go API

This project was generated with BackendIO.

## Features

- Gin Web Framework
${options.features.jwt ? "- JWT Authentication\n" : ""}
${options.features.crud ? "- CRUD Operations\n" : ""}
${options.features.swagger ? "- Swagger Documentation\n" : ""}
${options.features.tests ? "- Unit Tests\n" : ""}
- ${options.database.type.charAt(0).toUpperCase() + options.database.type.slice(1)} Database with GORM

## Requirements

- Go ${options.version}

## Installation

1. Clone the repository
2. Install dependencies:
\`\`\`bash
go mod download
\`\`\`

3. Set up environment variables:
Create a .env file with the following variables:
\`\`\`
SERVER_PORT=8080
DB_TYPE=${options.database.type}
DB_CONN_STR=${options.database.connectionString}
${options.features.jwt ? "JWT_SECRET=your_jwt_secret\nJWT_EXPIRY=24h" : ""}
\`\`\`

## Running the Application

\`\`\`bash
go run main.go
\`\`\`

The API will be available at http://localhost:8080

${options.features.swagger ? "## API Documentation\n\nSwagger documentation is available at http://localhost:8080/swagger/index.html\n" : ""}

${options.features.tests ? "## Running Tests\n\n```bash\ngo test ./...\n```\n" : ""}

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
