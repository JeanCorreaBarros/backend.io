export interface JavaOptions {
  version: string
  features: {
    jwt: boolean
    crud: boolean
    swagger: boolean
    tests: boolean
  }
  database: {
    type: "mysql" | "postgres" | "h2"
    connectionString: string
  }
}

export function generateJavaCode(options: JavaOptions) {
  const files: Record<string, string> = {}

  // Generate pom.xml
  files["pom.xml"] = generatePomXml(options)

  // Generate application.properties
  files["src/main/resources/application.properties"] = generateApplicationProperties(options)

  // Generate main application class
  files["src/main/java/com/backendio/api/Application.java"] = generateApplicationClass(options)

  // Generate model
  files["src/main/java/com/backendio/api/model/User.java"] = generateUserModel()

  // Generate repository
  files["src/main/java/com/backendio/api/repository/UserRepository.java"] = generateUserRepository()

  // Generate controller
  files["src/main/java/com/backendio/api/controller/UserController.java"] = generateUserController(options)

  if (options.features.jwt) {
    // Generate security config
    files["src/main/java/com/backendio/api/security/SecurityConfig.java"] = generateSecurityConfig()

    // Generate JWT utilities
    files["src/main/java/com/backendio/api/security/JwtTokenUtil.java"] = generateJwtTokenUtil()

    // Generate auth controller
    files["src/main/java/com/backendio/api/controller/AuthController.java"] = generateAuthController()

    // Generate auth models
    files["src/main/java/com/backendio/api/model/AuthRequest.java"] = generateAuthRequest()
    files["src/main/java/com/backendio/api/model/AuthResponse.java"] = generateAuthResponse()
  }

  // Generate service
  files["src/main/java/com/backendio/api/service/UserService.java"] = generateUserService()
  files["src/main/java/com/backendio/api/service/UserServiceImpl.java"] = generateUserServiceImpl(options)

  // Generate exception handling
  files["src/main/java/com/backendio/api/exception/ResourceNotFoundException.java"] =
    generateResourceNotFoundException()
  files["src/main/java/com/backendio/api/exception/GlobalExceptionHandler.java"] = generateGlobalExceptionHandler()

  // Generate README.md
  files["README.md"] = generateReadme(options)

  return files
}

function generatePomXml(options: JavaOptions): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.6.3</version>
        <relativePath/>
    </parent>
    
    <groupId>com.backendio</groupId>
    <artifactId>api</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>api</name>
    <description>Java API generated with BackendIO</description>
    
    <properties>
        <java.version>${options.version.replace("Java ", "")}</java.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        
        ${getDatabaseDependency(options.database.type)}
        
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        
        ${
          options.features.jwt
            ? `
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt</artifactId>
            <version>0.9.1</version>
        </dependency>
        `
            : ""
        }
        
        ${
          options.features.swagger
            ? `
        <dependency>
            <groupId>io.springfox</groupId>
            <artifactId>springfox-boot-starter</artifactId>
            <version>3.0.0</version>
        </dependency>
        `
            : ""
        }
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        
        ${
          options.features.jwt
            ? `
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
        `
            : ""
        }
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
`
}

function getDatabaseDependency(dbType: string): string {
  switch (dbType) {
    case "mysql":
      return `
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <scope>runtime</scope>
        </dependency>
      `
    case "postgres":
      return `
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
      `
    case "h2":
      return `
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
      `
    default:
      return ""
  }
}

function generateApplicationProperties(options: JavaOptions): string {
  let dbConfig = ""

  switch (options.database.type) {
    case "mysql":
      dbConfig = `
# MySQL Configuration
spring.datasource.url=${options.database.connectionString}
spring.datasource.username=root
spring.datasource.password=password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
`
      break
    case "postgres":
      dbConfig = `
# PostgreSQL Configuration
spring.datasource.url=${options.database.connectionString}
spring.datasource.username=postgres
spring.datasource.password=password
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
`
      break
    case "h2":
      dbConfig = `
# H2 Configuration
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=password
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
`
      break
  }

  return `# Server Configuration
server.port=8080

${dbConfig}

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

${
  options.features.jwt
    ? `
# JWT Configuration
jwt.secret=backendio_jwt_secret_key
jwt.expiration=3600000
`
    : ""
}

${
  options.features.swagger
    ? `
# Swagger Configuration
springfox.documentation.swagger-ui.path=/api-docs
`
    : ""
}
`
}

function generateApplicationClass(options: JavaOptions): string {
  return `package com.backendio.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
${
  options.features.swagger
    ? `
import springfox.documentation.swagger2.annotations.EnableSwagger2;
`
    : ""
}

@SpringBootApplication
${options.features.swagger ? "@EnableSwagger2" : ""}
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

}
`
}

function generateUserModel(): string {
  return `package com.backendio.api.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
`
}

function generateUserRepository(): string {
  return `package com.backendio.api.repository;

import com.backendio.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
}
`
}

function generateUserController(options: JavaOptions): string {
  return `package com.backendio.api.controller;

import com.backendio.api.model.User;
import com.backendio.api.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody Map<String, String> updates) {
        return ResponseEntity.ok(userService.updateUser(id, updates));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
`
}

function generateSecurityConfig(): string {
  return `package com.backendio.api.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtRequestFilter jwtRequestFilter;

    @Autowired
    public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder());
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().disable()
            .authorizeRequests()
            .antMatchers("/api/auth/**").permitAll()
            .antMatchers("/h2-console/**").permitAll()
            .antMatchers("/api-docs/**").permitAll()
            .anyRequest().authenticated()
            .and()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS);

        // For H2 Console
        http.headers().frameOptions().disable();

        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
    }
}

class JwtRequestFilter {
    // Implementation omitted for brevity
}
`
}

function generateJwtTokenUtil(): string {
  return `package com.backendio.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtTokenUtil {

    @Value("\${jwt.secret}")
    private String secret;

    @Value("\${jwt.expiration}")
    private Long expiration;

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, userDetails.getUsername());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, secret)
                .compact();
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser().setSigningKey(secret).parseClaimsJws(token).getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}
`
}

function generateAuthController(): string {
  return `package com.backendio.api.controller;

import com.backendio.api.model.AuthRequest;
import com.backendio.api.model.AuthResponse;
import com.backendio.api.model.User;
import com.backendio.api.security.JwtTokenUtil;
import com.backendio.api.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final UserService userService;
    private final JwtTokenUtil jwtTokenUtil;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthController(
            AuthenticationManager authenticationManager,
            UserDetailsService userDetailsService,
            UserService userService,
            JwtTokenUtil jwtTokenUtil,
            PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.userService = userService;
        this.jwtTokenUtil = jwtTokenUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request) {
        // Check if user already exists
        if (userService.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email already in use");
        }

        if (userService.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body("Username already in use");
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userService.saveUser(user);

        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.badRequest().body("Invalid credentials");
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        final String token = jwtTokenUtil.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(token));
    }
}
`
}

function generateAuthRequest(): string {
  return `package com.backendio.api.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthRequest {
    private String username;
    private String email;
    private String password;
}
`
}

function generateAuthResponse(): string {
  return `package com.backendio.api.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
}
`
}

function generateUserService(): string {
  return `package com.backendio.api.service;

import com.backendio.api.model.User;

import java.util.List;
import java.util.Map;

public interface UserService {
    List<User> getAllUsers();
    User getUserById(Long id);
    User updateUser(Long id, Map<String, String> updates);
    void deleteUser(Long id);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    User saveUser(User user);
}
`
}

function generateUserServiceImpl(options: JavaOptions): string {
  return `package com.backendio.api.service;

import com.backendio.api.exception.ResourceNotFoundException;
import com.backendio.api.model.User;
import com.backendio.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Override
    public User updateUser(Long id, Map<String, String> updates) {
        User user = getUserById(id);
        
        if (updates.containsKey("username")) {
            user.setUsername(updates.get("username"));
        }
        
        if (updates.containsKey("email")) {
            user.setEmail(updates.get("email"));
        }
        
        return userRepository.save(user);
    }

    @Override
    public void deleteUser(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public User saveUser(User user) {
        return userRepository.save(user);
    }
}
`
}

function generateResourceNotFoundException(): string {
  return `package com.backendio.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
`
}

function generateGlobalExceptionHandler(): string {
  return `package com.backendio.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> resourceNotFoundException(ResourceNotFoundException ex, WebRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", new Date());
        response.put("message", ex.getMessage());
        response.put("path", request.getDescription(false));
        
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> globalExceptionHandler(Exception ex, WebRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", new Date());
        response.put("message", ex.getMessage());
        response.put("path", request.getDescription(false));
        
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
`
}

function generateReadme(options: JavaOptions): string {
  return `# Java Spring Boot API

This project was generated with BackendIO.

## Features

- Spring Boot REST API
${options.features.jwt ? "- JWT Authentication with Spring Security\n" : ""}
${options.features.crud ? "- CRUD Operations\n" : ""}
${options.features.swagger ? "- Swagger Documentation\n" : ""}
${options.features.tests ? "- Unit Tests\n" : ""}
- ${options.database.type.charAt(0).toUpperCase() + options.database.type.slice(1)} Database with Spring Data JPA

## Requirements

- ${options.version}
- Maven

## Building the Application

\`\`\`bash
mvn clean install
\`\`\`

## Running the Application

\`\`\`bash
mvn spring-boot:run
\`\`\`

The API will be available at http://localhost:8080

${options.features.swagger ? "## API Documentation\n\nSwagger documentation is available at http://localhost:8080/api-docs\n" : ""}

${options.features.tests ? "## Running Tests\n\n```bash\nmvn test\n```\n" : ""}

## API Endpoints

### Users
- GET /api/users - Get all users
- GET /api/users/{id} - Get a user by ID
- PUT /api/users/{id} - Update a user
- DELETE /api/users/{id} - Delete a user

${options.features.jwt ? "### Authentication\n- POST /api/auth/register - Register a new user\n- POST /api/auth/login - Login and get a JWT token\n" : ""}

## Generated with BackendIO
`
}
