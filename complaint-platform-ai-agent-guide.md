# City Complaint & Service Request Platform - Java Spring Boot Implementation Guide

**Project Timeline:** 5 days  
**Deployment Target:** Render/Railway (Free Tier)  
**Backend:** Java 17+ Spring Boot 3.x  
**Frontend:** React / Thymeleaf  
**Database:** PostgreSQL (Neon)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Project Setup](#project-setup)
4. [Database Design (JPA Entities)](#database-design-jpa-entities)
5. [Spring Boot Project Structure](#spring-boot-project-structure)
6. [REST API Endpoints](#rest-api-endpoints)
7. [Authentication (Spring Security + JWT)](#authentication-spring-security--jwt)
8. [AI Integration (Claude API)](#ai-integration-claude-api)
9. [Frontend Setup (React)](#frontend-setup-react)
10. [5-Day Implementation Timeline](#5-day-implementation-timeline)
11. [Deployment Guide](#deployment-guide)

---

## Project Overview

### Architecture Diagram

```
┌─────────────────┐
│  React Frontend │
│  (Port 3000)    │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────────────────────┐
│  Spring Boot Backend (Port 8080) │
│  - REST Controllers              │
│  - Service Layer                 │
│  - JPA Repositories              │
│  - Spring Security + JWT         │
│  - Claude AI Integration         │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  PostgreSQL Database    │
│  (Neon - Free Tier)     │
│  - Complaints           │
│  - Citizens             │
│  - Staff/Departments    │
│  - Feedback             │
└─────────────────────────┘

External Services:
├─ Claude API (AI Scoring)
├─ Mapbox Static API (Maps)
└─ JWT/Security
```

### Workflow Flow

```
Citizen → Files Complaint (React Form)
  → POST /api/complaints/create
  → Spring Boot: Validate + Call Claude AI
  → Score Severity + Save to DB
  → Return to Frontend with Severity Badge

Department Staff → Views Dashboard
  → GET /api/dashboard/staff
  → Spring Boot: Query Complaints by Department
  → Assign + Update Status
  → AI generates reply suggestions
```

---

## Architecture & Tech Stack

### Backend Stack

| Component | Technology                  | Version | Purpose                        |
| --------- | --------------------------- | ------- | ------------------------------ |
| Framework | Spring Boot                 | 3.2+    | REST API, dependency injection |
| Language  | Java                        | 17+     | Backend language               |
| Database  | PostgreSQL                  | -       | Persistent data                |
| ORM       | Spring Data JPA + Hibernate | 6.x     | Database mapping               |
| Security  | Spring Security             | 6.x     | Authentication, JWT            |
| AI        | Anthropic SDK               | Latest  | Claude API calls               |
| Build     | Maven                       | 3.8+    | Dependency management          |
| Server    | Embedded Tomcat             | -       | REST server                    |

### Frontend Stack (Separate Repository)

| Component | Technology      | Purpose       |
| --------- | --------------- | ------------- |
| Framework | React 18        | UI components |
| HTTP      | Axios           | API calls     |
| State     | Context API     | Global state  |
| Styling   | Tailwind CSS    | UI styling    |
| Form      | React Hook Form | Form handling |
| Build     | Vite            | Fast bundling |

### Deployment Stack

| Service          | Purpose             | Free Tier        |
| ---------------- | ------------------- | ---------------- |
| Render / Railway | Backend hosting     | 750 hrs/month    |
| Neon             | PostgreSQL database | 0.5 GB storage   |
| Mapbox           | Static maps         | 100k requests/mo |
| Vercel / Netlify | Frontend hosting    | Unlimited        |

---

## Project Setup

### Step 1: Create Spring Boot Project

#### Option A: Using Spring Boot CLI

```bash
# Install Spring Boot CLI (if not already installed)
brew install spring-boot  # macOS
# or download from https://spring.io/projects/spring-boot

# Create project
spring boot new complaint-platform --from=https://start.spring.io

cd complaint-platform
```

#### Option B: Using Spring Initializr (Web UI)

1. Go to https://start.spring.io
2. **Project:** Maven Project
3. **Language:** Java
4. **Spring Boot:** 3.2.0 (or latest)
5. **Project Metadata:**
   - Group: `com.city`
   - Artifact: `complaint-platform`
   - Name: `Complaint Platform`
   - Package: `com.city.complaints`
   - Packaging: `JAR`
   - Java: `17`

6. **Dependencies** (click "Add Dependencies"):
   - Spring Web
   - Spring Data JPA
   - PostgreSQL Driver
   - Spring Security
   - Lombok
   - Validation
   - Spring Boot DevTools

7. Click **GENERATE** and unzip the file

#### Option C: Manual Maven Setup

```bash
# Create project folder
mkdir complaint-platform
cd complaint-platform

# Create pom.xml structure
mkdir -p src/main/java/com/city/complaints
mkdir -p src/main/resources
mkdir -p src/test/java
```

### Step 2: Configure pom.xml

**File: `pom.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>

    <groupId>com.city</groupId>
    <artifactId>complaint-platform</artifactId>
    <version>1.0.0</version>
    <name>Complaint Platform</name>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <!-- Spring Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring Data JPA -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- PostgreSQL -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <version>42.7.0</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Spring Security -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.3</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Anthropic SDK (Claude API) -->
        <dependency>
            <groupId>com.anthropic</groupId>
            <artifactId>anthropic-java</artifactId>
            <version>0.0.1</version>
        </dependency>

        <!-- HTTP Client for API calls -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webflux</artifactId>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
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
```

### Step 3: Configure application.yml

**File: `src/main/resources/application.yml`**

```yaml
spring:
  application:
    name: complaint-platform

  datasource:
    url: jdbc:postgresql://localhost:5432/complaints_db
    username: postgres
    password: postgres
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
    show-sql: false

  security:
    jwt:
      secret: your-super-secret-jwt-key-change-in-production-at-least-256-bits
      expiration: 86400000 # 24 hours in milliseconds

server:
  port: 8080
  servlet:
    context-path: /api

logging:
  level:
    root: INFO
    com.city.complaints: DEBUG

# CORS Configuration
cors:
  allowed-origins: http://localhost:3000,http://localhost:5173
  allowed-methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
  allowed-headers: "*"
  max-age: 3600

# Claude API
anthropic:
  api-key: ${ANTHROPIC_API_KEY}
  model: claude-3-5-sonnet-20241022
  max-tokens: 200

# Mapbox
mapbox:
  token: ${MAPBOX_TOKEN}
```

### Step 4: Create application.properties (Alternative)

**File: `src/main/resources/application.properties`**

```properties
spring.application.name=complaint-platform
spring.datasource.url=jdbc:postgresql://localhost:5432/complaints_db
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
server.port=8080
server.servlet.context-path=/api
```

### Step 5: Verify Project Structure

```
complaint-platform/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/city/complaints/
│   │   │   ├── ComplaintPlatformApplication.java (Main)
│   │   │   ├── config/
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   ├── entity/
│   │   │   ├── dto/
│   │   │   ├── exception/
│   │   │   └── security/
│   │   └── resources/
│   │       ├── application.yml
│   │       └── application-prod.yml
│   └── test/
├── .gitignore
└── README.md
```

### Step 6: Build and Run

```bash
# Clean build
mvn clean install

# Run application
mvn spring-boot:run

# Application starts on http://localhost:8080/api
```

---

## Database Design (JPA Entities)

### Project Structure for Entities

```
src/main/java/com/city/complaints/entity/
├── Citizen.java
├── Department.java
├── Staff.java
├── Complaint.java
├── Feedback.java
└── StatusHistory.java
```

### Entity Files

#### 1. Citizen.java

```java
package com.city.complaints.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "citizens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Citizen {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;  // Hashed with BCrypt

    @Column(nullable = false)
    private String fullName;

    private String phone;
    private String address;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Relations
    @OneToMany(mappedBy = "citizen", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Complaint> complaints;

    @OneToMany(mappedBy = "citizen", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Feedback> feedbacks;
}
```

#### 2. Department.java

```java
package com.city.complaints.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "departments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String name;  // e.g., "Roads & Highways"

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;
    private String location;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Relations
    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Staff> staff;

    @OneToMany(mappedBy = "department")
    private List<Complaint> complaints;
}
```

#### 3. Staff.java

```java
package com.city.complaints.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "staff")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;  // Hashed

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String role;  // "ADMIN", "TECHNICIAN"

    @ManyToOne
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    private Boolean isActive = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Relations
    @OneToMany(mappedBy = "assignedTo")
    private List<Complaint> assignedComplaints;
}
```

#### 4. Complaint.java

```java
package com.city.complaints.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Index(name = "idx_status", columnList = "status")
@Index(name = "idx_severity", columnList = "severity")
@Index(name = "idx_department", columnList = "department_id")
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String category;  // "Roads", "Water", "Electricity", "Sanitation"

    private String locationName;
    private Double latitude;
    private Double longitude;

    private String photoUrl;

    // AI-generated
    @Column(nullable = false)
    private String severity = "MEDIUM";  // "LOW", "MEDIUM", "HIGH", "CRITICAL"

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    private String suggestedCategory;

    // Status workflow
    @Column(nullable = false)
    private String status = "PENDING";  // "PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED"

    // Assignment
    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne
    @JoinColumn(name = "assigned_to_id")
    private Staff assignedTo;

    // Resolution
    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    private LocalDateTime resolvedAt;

    // Metadata
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Relations
    @ManyToOne
    @JoinColumn(name = "citizen_id", nullable = false)
    private Citizen citizen;

    @OneToOne(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    private Feedback feedback;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StatusHistory> statusHistory;
}
```

#### 5. Feedback.java

```java
package com.city.complaints.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedbacks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private Integer rating;  // 1-5

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Relations
    @OneToOne
    @JoinColumn(name = "complaint_id", nullable = false, unique = true)
    private Complaint complaint;

    @ManyToOne
    @JoinColumn(name = "citizen_id", nullable = false)
    private Citizen citizen;
}
```

#### 6. StatusHistory.java

```java
package com.city.complaints.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "status_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Relations
    @ManyToOne
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;
}
```

---

## Spring Boot Project Structure

### Directory Layout

```
src/main/java/com/city/complaints/
├── ComplaintPlatformApplication.java      (Entry point)
│
├── config/
│   ├── SecurityConfig.java                (Spring Security + JWT)
│   ├── CorsConfig.java                    (CORS configuration)
│   ├── JwtConfig.java                     (JWT properties)
│   └── AiConfig.java                      (Claude API config)
│
├── controller/
│   ├── AuthController.java                (Login/Signup)
│   ├── ComplaintController.java           (Complaint CRUD)
│   ├── DashboardController.java           (Dashboard stats)
│   ├── FeedbackController.java            (Feedback submission)
│   └── PublicController.java              (Public endpoints)
│
├── service/
│   ├── ComplaintService.java              (Business logic)
│   ├── AuthService.java                   (Auth logic)
│   ├── AiService.java                     (Claude AI calls)
│   ├── DashboardService.java              (Stats calculations)
│   └── JwtService.java                    (JWT token management)
│
├── repository/
│   ├── CitizenRepository.java
│   ├── StaffRepository.java
│   ├── DepartmentRepository.java
│   ├── ComplaintRepository.java
│   ├── FeedbackRepository.java
│   └── StatusHistoryRepository.java
│
├── dto/
│   ├── request/
│   │   ├── CreateComplaintRequest.java
│   │   ├── LoginRequest.java
│   │   ├── SignupRequest.java
│   │   ├── UpdateStatusRequest.java
│   │   └── FeedbackRequest.java
│   │
│   └── response/
│       ├── ComplaintResponse.java
│       ├── AuthResponse.java
│       ├── DashboardResponse.java
│       └── ApiResponse.java
│
├── exception/
│   ├── ApiException.java
│   ├── ResourceNotFoundException.java
│   ├── UnauthorizedException.java
│   └── GlobalExceptionHandler.java
│
└── security/
    ├── JwtAuthenticationFilter.java
    ├── JwtProvider.java
    └── SecurityUser.java
```

---

## REST API Endpoints

### Base URL

```
http://localhost:8080/api
```

### Authentication Endpoints

#### POST /auth/citizen/signup

```json
Request:
{
  "email": "citizen@example.com",
  "password": "securepass123",
  "fullName": "John Doe",
  "phone": "1234567890",
  "address": "123 Main St"
}

Response (201):
{
  "success": true,
  "message": "Citizen registered successfully",
  "data": {
    "id": "uuid",
    "email": "citizen@example.com",
    "fullName": "John Doe"
  }
}
```

#### POST /auth/citizen/login

```json
Request:
{
  "email": "citizen@example.com",
  "password": "securepass123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "citizen": {
      "id": "uuid",
      "email": "citizen@example.com",
      "fullName": "John Doe"
    }
  }
}
```

#### POST /auth/staff/login

```json
Request:
{
  "email": "staff@department.com",
  "password": "securepass123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "staff": {
      "id": "uuid",
      "email": "staff@department.com",
      "fullName": "Jane Smith",
      "department": "Roads & Highways",
      "role": "TECHNICIAN"
    }
  }
}
```

---

### Complaint Endpoints

#### POST /complaints (Create - WITH AI SCORING)

```http
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "title": "Pothole on Main Street",
  "description": "Large pothole at the intersection causing vehicle damage",
  "category": "Roads",
  "locationName": "Main Street & 5th Avenue",
  "latitude": 23.8103,
  "longitude": 90.4125
}

Response (201):
{
  "success": true,
  "message": "Complaint created successfully",
  "data": {
    "id": "uuid",
    "title": "Pothole on Main Street",
    "description": "...",
    "category": "Roads",
    "severity": "HIGH",
    "aiSummary": "Critical pothole at intersection causing vehicle damage. Requires immediate repair.",
    "status": "PENDING",
    "createdAt": "2024-09-26T10:30:00"
  }
}
```

#### GET /complaints

```http
Authorization: Bearer {token}
Query: ?status=PENDING&severity=HIGH&category=Roads&page=0&size=10

Response (200):
{
  "success": true,
  "data": {
    "complaints": [
      {
        "id": "uuid",
        "title": "Pothole on Main Street",
        "severity": "HIGH",
        "status": "ASSIGNED",
        "category": "Roads",
        "createdAt": "2024-09-26T10:30:00"
      }
    ],
    "totalElements": 45,
    "totalPages": 5,
    "currentPage": 0
  }
}
```

#### GET /complaints/:id

```http
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Pothole on Main Street",
    "description": "...",
    "severity": "HIGH",
    "status": "IN_PROGRESS",
    "category": "Roads",
    "latitude": 23.8103,
    "longitude": 90.4125,
    "assignedTo": {
      "id": "uuid",
      "fullName": "Jane Smith",
      "email": "jane@department.com"
    },
    "statusHistory": [
      {
        "status": "PENDING",
        "createdAt": "2024-09-26T10:30:00"
      },
      {
        "status": "ASSIGNED",
        "createdAt": "2024-09-26T10:45:00"
      }
    ]
  }
}
```

#### PATCH /complaints/:id/status (Update Status + AI Reply)

```http
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "status": "IN_PROGRESS",
  "note": "Work started. Expected completion: 2 days.",
  "includeAiReply": true
}

Response (200):
{
  "success": true,
  "data": {
    "complaint": { ... },
    "suggestedReply": "We've received your complaint and our team has started investigating. Expected resolution: 2 days."
  }
}
```

#### PATCH /complaints/:id/assign

```http
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "assignedToId": "staff_uuid"
}

Response (200):
{
  "success": true,
  "data": { ... }
}
```

---

### Dashboard Endpoints

#### GET /dashboard/citizen

```http
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "stats": {
      "totalComplaints": 5,
      "pending": 1,
      "inProgress": 2,
      "resolved": 2
    },
    "recentComplaints": [ ... ]
  }
}
```

#### GET /dashboard/staff

```http
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "stats": {
      "totalAssigned": 12,
      "pending": 3,
      "inProgress": 5,
      "resolved": 4,
      "avgResolutionTime": "2.5 days",
      "highPriorityCount": 2
    },
    "assignedComplaints": [ ... ]
  }
}
```

#### GET /public/statistics (No Auth Required)

```http
Response (200):
{
  "success": true,
  "data": {
    "stats": {
      "totalComplaints": 150,
      "resolved": 120,
      "pending": 30,
      "avgResolutionTime": "3 days"
    },
    "byCategory": {
      "Roads": 45,
      "Water": 38,
      "Electricity": 42
    },
    "byDepartment": [
      {
        "name": "Roads & Highways",
        "total": 45,
        "resolved": 40
      }
    ]
  }
}
```

---

## Authentication (Spring Security + JWT)

### File: `config/SecurityConfig.java`

```java
package com.city.complaints.config;

import com.city.complaints.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(userDetailsService)
                .passwordEncoder(passwordEncoder())
                .and()
                .build();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeHttpRequests()
                // Public endpoints
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/public/**").permitAll()
                // Protected endpoints
                .requestMatchers(HttpMethod.GET, "/complaints").authenticated()
                .requestMatchers(HttpMethod.POST, "/complaints").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/complaints/**").authenticated()
                .requestMatchers("/dashboard/**").authenticated()
                .anyRequest().authenticated()
            .and()
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

### File: `security/JwtProvider.java`

```java
package com.city.complaints.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtProvider {

    @Value("${spring.security.jwt.secret}")
    private String jwtSecret;

    @Value("${spring.security.jwt.expiration}")
    private int jwtExpirationMs;

    public String generateToken(Authentication authentication) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        return Jwts.builder()
                .subject(authentication.getName())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```

### File: `security/JwtAuthenticationFilter.java`

```java
package com.city.complaints.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            String authHeader = request.getHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);

                if (jwtProvider.validateToken(token)) {
                    String username = jwtProvider.getUsernameFromToken(token);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication", e);
        }

        filterChain.doFilter(request, response);
    }
}
```

---

## AI Integration (Claude API)

### File: `service/AiService.java`

````java
package com.city.complaints.service;

import com.anthropic.client.Anthropic;
import com.anthropic.models.Message;
import com.anthropic.models.MessageParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class AiService {

    @Value("${anthropic.api-key}")
    private String apiKey;

    @Value("${anthropic.model}")
    private String model;

    @Value("${anthropic.max-tokens}")
    private Integer maxTokens;

    // ============ SEVERITY SCORING ============
    public SeverityScoreDto scoreComplaintSeverity(String description, String category) {
        try {
            Anthropic client = new Anthropic.Builder()
                    .apiKey(apiKey)
                    .build();

            String prompt = """
                You are a city complaint severity assessor. Analyze this complaint and rate its urgency.

                Category: %s
                Description: "%s"

                Consider:
                - Public safety risk (CRITICAL: severe injury/death risk)
                - Number of people affected (HIGH: many people, MEDIUM: moderate, LOW: few)
                - Financial impact

                Respond ONLY with valid JSON (no markdown):
                {
                  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
                  "reason": "Brief reason"
                }
                """.formatted(category, description);

            Message message = client.messages.create(
                    new com.anthropic.models.MessageCreateParams.Builder()
                            .model(model)
                            .maxTokens(maxTokens)
                            .messages(List.of(
                                    MessageParam.userMessage(prompt)
                            ))
                            .build()
            );

            String response = message.content().get(0).asText().text();

            // Parse JSON response
            SeverityScoreDto result = parseJsonResponse(response, SeverityScoreDto.class);
            return result != null ? result : new SeverityScoreDto("MEDIUM", "Assessment completed");

        } catch (Exception e) {
            log.error("AI severity scoring failed", e);
            return new SeverityScoreDto("MEDIUM", "AI assessment failed");
        }
    }

    // ============ REPLY SUGGESTIONS ============
    public String generateReplyTemplate(String category, String severity, String description) {
        try {
            Anthropic client = new Anthropic.Builder()
                    .apiKey(apiKey)
                    .build();

            String prompt = """
                Generate a professional, empathetic reply from a city department to a citizen complaint. Keep it under 100 words.

                Category: %s
                Severity: %s
                Issue: "%s"

                Requirements:
                - Acknowledge the issue
                - Provide expected resolution time (CRITICAL: 24h, HIGH: 48h, MEDIUM: 3-5 days, LOW: 1-2 weeks)
                - Be professional and reassuring

                Respond with ONLY the message body.
                """.formatted(category, severity, description);

            Message message = client.messages.create(
                    new com.anthropic.models.MessageCreateParams.Builder()
                            .model(model)
                            .maxTokens(maxTokens)
                            .messages(List.of(
                                    MessageParam.userMessage(prompt)
                            ))
                            .build()
            );

            return message.content().get(0).asText().text();

        } catch (Exception e) {
            log.error("Reply template generation failed", e);
            return "We have received your complaint and will investigate promptly.";
        }
    }

    // Helper to parse JSON
    private <T> T parseJsonResponse(String json, Class<T> type) {
        try {
            // Remove markdown formatting if present
            json = json.replace("```json", "").replace("```", "").trim();
            return new com.fasterxml.jackson.databind.ObjectMapper().readValue(json, type);
        } catch (Exception e) {
            log.error("JSON parsing failed", e);
            return null;
        }
    }

    // DTO for severity score response
    public record SeverityScoreDto(String severity, String reason) {}
}
````

### Integration in Controller

**File: `controller/ComplaintController.java`**

```java
@RestController
@RequestMapping("/complaints")
@Slf4j
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    @Autowired
    private AiService aiService;

    @PostMapping
    public ResponseEntity<?> createComplaint(
            @Valid @RequestBody CreateComplaintRequest request,
            Authentication authentication) {

        try {
            // 1. Validate input
            if (request.getLatitude() == null || request.getLongitude() == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Location is required"));
            }

            // 2. Score severity with AI
            AiService.SeverityScoreDto severityScore =
                    aiService.scoreComplaintSeverity(
                            request.getDescription(),
                            request.getCategory());

            // 3. Create complaint with AI-scored severity
            Complaint complaint = complaintService.createComplaint(
                    request,
                    authentication.getName(),
                    severityScore.severity());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse(true, "Complaint created successfully", complaint));

        } catch (Exception e) {
            log.error("Error creating complaint", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}
```

---

## Frontend Setup (React)

### Create React Frontend

```bash
# Create Vite + React project
npm create vite@latest complaint-platform-frontend -- --template react
cd complaint-platform-frontend

# Install dependencies
npm install axios react-router-dom react-hook-form zod @hookform/resolvers
npm install tailwindcss postcss autoprefixer
npm install lucide-react

# Setup Tailwind
npx tailwindcss init -p
```

### Frontend Directory Structure

```
complaint-platform-frontend/
├── src/
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── auth/
│   │   │   ├── CitizenSignup.jsx
│   │   │   ├── CitizenLogin.jsx
│   │   │   └── StaffLogin.jsx
│   │   ├── complaints/
│   │   │   ├── CreateComplaint.jsx
│   │   │   ├── ComplaintsList.jsx
│   │   │   └── ComplaintDetail.jsx
│   │   └── dashboard/
│   │       ├── CitizenDashboard.jsx
│   │       ├── StaffDashboard.jsx
│   │       └── PublicBoard.jsx
│   │
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── ComplaintForm.jsx
│   │   ├── ComplaintCard.jsx
│   │   ├── SeverityBadge.jsx
│   │   ├── StatusBadge.jsx
│   │   └── LoadingSpinner.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useApi.js
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── services/
│   │   └── api.js (Axios configuration)
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── .env
├── vite.config.js
└── package.json
```

### Key Files

**File: `.env`**

```
VITE_API_URL=http://localhost:8080/api
VITE_MAPBOX_TOKEN=pk_xxxxx
```

**File: `src/services/api.js`**

```javascript
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 5-Day Implementation Timeline

### Day 1: Project Setup + Database (6-8 hours)

**Goal:** Database ready, entities created

- [x] Create Spring Boot project using Spring Initializr
- [x] Add all dependencies (Maven pom.xml)
- [x] Configure PostgreSQL (Neon)
- [x] Create all JPA entities (6 classes)
- [x] Configure application.yml
- [x] Run migrations
- [x] Test DB connection in Prisma Studio or DBeaver

**Deliverable:** `mvn spring-boot:run` works, no errors

**Time:** 6-8 hours

---

### Day 2: Security + Core API (7-8 hours)

**Goal:** Auth working, complaint CRUD endpoints

- [x] Implement Spring Security config
- [x] Implement JWT provider and filters
- [x] Create AuthService & AuthController
  - [x] POST /auth/citizen/signup
  - [x] POST /auth/citizen/login
  - [x] POST /auth/staff/login
- [x] Create ComplaintRepository & ComplaintService
- [x] Create ComplaintController
  - [x] POST /complaints (with AI scoring)
  - [x] GET /complaints (with pagination & filters)
  - [x] GET /complaints/:id
  - [x] PATCH /complaints/:id/status
- [x] Implement Zod/validation
- [x] Error handling

**Deliverable:** Postman collection, all endpoints tested

**Time:** 7-8 hours

---

### Day 3: AI Integration + Frontend Start (7-8 hours)

**Goal:** AI severity scoring working, React project setup

- [x] Implement AiService with Claude API
  - [x] scoreComplaintSeverity()
  - [x] generateReplyTemplate()
  - [x] generateSummary()
- [x] Integrate AI into complaint creation endpoint
- [x] Create React frontend project (Vite)
- [x] Set up routing
- [x] Create Navbar component
- [x] Build auth pages (signup/login)
- [x] Build complaint creation form
- [x] Test API integration from React

**Deliverable:** Can create complaint from React, see AI severity badge

**Time:** 7-8 hours

---

### Day 4: Dashboards + Unique Features (6-7 hours)

**Goal:** All UI pages built, unique features added

- [x] Create DashboardController & DashboardService
  - [x] GET /dashboard/citizen
  - [x] GET /dashboard/staff
  - [x] GET /public/statistics
- [x] Build React pages
  - [x] Citizen dashboard
  - [x] Staff dashboard
  - [x] Public board
- [x] Add static Mapbox component
  - [x] Show complaint locations on map
- [x] Add department statistics
- [x] Implement complaint assignment feature
- [x] Build feedback form

**Deliverable:** All pages load, dashboards show data

**Time:** 6-7 hours

---

### Day 5: Testing + Deployment (5-6 hours)

**Goal:** Live on Render, all workflows tested

- [x] Test complete workflows
  - [x] Citizen signup → create complaint → dashboard
  - [x] Staff login → assign → update status → AI reply
  - [x] Public board accessible
- [x] Create seed data script
  - [x] Sample departments
  - [x] Sample complaints
- [x] Deploy backend to Render
  - [x] Create Render account
  - [x] Set env variables
  - [x] Deploy PostgreSQL connection
  - [x] Test API on Render URL
- [x] Deploy frontend to Vercel
  - [x] Update API_URL in env
  - [x] Deploy to Vercel
- [x] Create demo script

**Deliverable:** Live demo URL, all features working

**Time:** 5-6 hours

---

## Deployment Guide

### Backend: Deploy to Render

```bash
# 1. Create Render account at render.com

# 2. Connect GitHub repo (if using Git)
git init
git add .
git commit -m "Initial commit"
git push origin main

# 3. In Render dashboard:
#    - New → Web Service
#    - Connect GitHub repo
#    - Environment: Java 17
#    - Build command: mvn clean install
#    - Start command: java -jar target/complaint-platform-1.0.0.jar
#    - Add environment variables:
#      - DATABASE_URL
#      - ANTHROPIC_API_KEY
#      - MAPBOX_TOKEN
#      - spring.security.jwt.secret

# 4. Deploy (automatic on push to main)
```

### Frontend: Deploy to Vercel

```bash
# 1. Push to GitHub

# 2. In Vercel:
#    - Import project
#    - Framework: Vite
#    - Build command: npm run build
#    - Install command: npm install
#    - Output directory: dist
#    - Environment variables:
#      - VITE_API_URL=https://your-render-backend.onrender.com/api

# 3. Deploy
```

### Database: Neon PostgreSQL

```bash
# 1. Create project at neon.tech

# 2. Get connection string
# Format: postgresql://user:password@host/database

# 3. Add to Render env variables as DATABASE_URL
```

---

## Troubleshooting

### Issue: "Cannot find symbol: class Anthropic"

```bash
# Maven doesn't have anthropic SDK, use REST HTTP instead
# Or add custom Anthropic Java SDK (build yourself)
```

### Issue: "JWT token expired"

- Increase `spring.security.jwt.expiration` in application.yml

### Issue: "CORS error from React"

- Ensure CorsConfig.java is properly configured
- Add frontend URL to allowed-origins

### Issue: "Database connection timeout on Render"

- Verify DATABASE_URL is correct
- Check Neon connection limits

---

## Success Criteria

✅ Core Features Complete
✅ AI Features Working (Severity Scoring + Reply Suggestions)
✅ Authentication (JWT) Working
✅ All API Endpoints Tested
✅ React Frontend Fully Functional
✅ Deployed on Render (Backend) + Vercel (Frontend)
✅ Database Migrations Complete
✅ Demo Data Seeded

---

## Notes for Development

1. **Start with entities first** - Everything depends on database schema
2. **Test APIs with Postman** - Before building frontend
3. **AI calls must complete in <10 sec** - Add timeouts to prevent hanging
4. **Keep frontend simple** - Tailwind for quick styling
5. **Error messages matter** - Show user-friendly errors
6. **CORS is important** - Configure properly in SecurityConfig
7. **JWT expiration should be ~24 hours** - For demo purpose
8. **Use prepared statements** - Spring Data JPA handles this automatically
9. **Seed test data** - Makes demo much easier
10. **Deploy backend first** - Then update frontend API_URL

---

**Project:** City Complaint & Service Request Platform  
**Tech Stack:** Java Spring Boot 3.x + React + PostgreSQL  
**Timeline:** 5 Days  
**Deployment:** Render (Backend) + Vercel (Frontend)  
**Date:** 2026-09-26
