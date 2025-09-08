---
title: "Spring Boot Deployment and DevOps Best Practices – My Personal Approach"
description: "My Personal Approach for the Best Practices to Deploy Spring Boot Applications with Docker and GitHub Actions"
dateString: Sep 2025
draft: false
tags: ["Spring Boot", "DevOps", "GitHub", "Git", "Github Actions", "CI/CD", "Docker", "AWS Cloud"]
weight: 199
---

## Overview

In this blog, I want to share what I consider to be one of the best practices for deploying and managing a Spring Boot application using Docker and GitHub Actions. The focus is on streamlining the DevOps process to enable scalability, simplify onboarding for new developers, and ensure production stability through well-defined CI/CD pipelines.

## Why This Approach Matters

### Key Benefits

- **🔄 Automated CI/CD**: Pipelines remove manual steps from deployment, ensuring consistency, reliability, and faster feedback cycles. You can safely push code knowing that tests, builds, and deployments will be handled automatically and uniformly.

- **🐳 Docker Simplification**: Makes collaboration frictionless. A new developer doesn't need to install JDKs, configure local environments, or worry about version mismatches. All they need is Docker, Git, and an IDE. With these, they can build, run, and test the application in exactly the same way as in production.

- **🚀 Production Parity**: Combining Docker and GitHub Actions ensures that the same build pipeline is used locally and in production, which eliminates "it works on my machine" issues and increases confidence in deployments.

- **👥 Team Scalability**: This approach sets up a standardized development environment that scales well as more contributors join. Each developer can focus on writing code and business logic rather than wrestling with environment setup.

## What You'll Learn

In the following sections, I'll walk you through:

1. **Docker's Impact on Development**: How Docker eliminates environment inconsistencies and simplifies the development experience
2. **CI/CD Pipeline Benefits**: How GitHub Actions automates deployment and ensures reliable, consistent releases 
3. **Developer Onboarding**: How a new developer can onboard quickly and start contributing without installing JDKs or complex dependencies

## 1. Docker: Eliminating Development Environment Inconsistencies

### How Dockerfile Simplifies Your Build Process

Your Dockerfile will handle three main tasks:

#### 🔨 Build Stage
- Compile the Spring Boot app into a JAR using Maven (no local JDK required)
- Run unit tests if needed
- Create a production-ready artifact

#### 🚀 Runtime Stage
- Copy the compiled JAR from build stage into a lightweight JRE container
- Expose the application port (e.g., 8080)
- Set the entry point to run the JAR: `java -jar app.jar`

#### 👨‍💻 Developer Support (Optional)
- Support mounting local source code for hot reload / faster testing with Spring Boot DevTools

### Multi-Stage Dockerfile Example

```dockerfile
# Stage 1: Build JAR
FROM maven:3.9.1-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/myapp.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
```

> **💡 Pro Tip**: The multi-stage build approach ensures your production image is lightweight and contains only the necessary runtime dependencies.

## 2. CI/CD Pipeline: Automating Reliable Deployments

### Pipeline Overview

GitHub Actions streamlines the complete **CI/CD** process for your application:

1. **🔄 Trigger**: Automatically runs on push to main or feature branches
2. **📥 Checkout**: Retrieves code from GitHub repository
3. **🏗️ Build**: Creates Docker image using the same Dockerfile used locally
4. **🔐 Authenticate**: Securely connects to AWS using stored secrets
5. **📤 Push**: Uploads Docker image to Amazon ECR
6. **🚀 Deploy**: Updates ECS Fargate service with the new image

### GitHub Actions Workflow Example

```yaml
name: Build and Deploy to ECS

on:
  push:
    branches:
      - main
      - 'feature/*'

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build Docker image
        run: |
          docker build -t myapp:${{ github.sha }} .
          docker tag myapp:${{ github.sha }} ${{ secrets.ECR_URI }}:latest

      - name: Push Docker image to ECR
        run: |
          docker push ${{ secrets.ECR_URI }}:latest

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster my-cluster --service my-service --force-new-deployment
```

> **🔧 Required Secrets**: Make sure to configure these secrets in your GitHub repository settings:
> - `AWS_ACCESS_KEY_ID`
> - `AWS_SECRET_ACCESS_KEY`
> - `ECR_URI`

## 3. Developer Onboarding & Workflow

### Prerequisites

Before starting, ensure you have these tools installed:

- **Git** - Version control
- **Docker** - Containerization platform
- **IDE** - IntelliJ IDEA, VS Code, or your preferred editor

### Initial Setup

#### Step 1: Fork and Clone Repository

```bash
# Fork the repository on GitHub, then clone your fork
git clone <your-forked-repo-url>
cd <repo-name>
```

#### Step 2: Build and Run Locally

```bash
# Build the Docker image
docker build -t myapp:dev .

# Run the application
docker run -p 8080:8080 myapp:dev
```

#### Step 3: Verify Setup

Open your browser and navigate to `http://localhost:8080` to confirm the application is running successfully.

### Feature Development Process

#### 1. Create and Plan Feature

- Create a GitHub Issue describing the feature
- Get team approval before starting development

#### 2. Create Feature Branch

```bash
git checkout -b feature/<issue-id>-<short-description>
```

#### 3. Develop and Test

```bash
# Develop your feature code and business logic
# Build and test locally using Docker
docker build -t myapp:dev .
docker run -p 8080:8080 myapp:dev

# Run unit/integration tests
docker run myapp:dev mvn test
```

#### 4. Commit and Push Changes

```bash
git add .
git commit -m "ISSUE-123: Add new payment validation feature"
git push origin feature/<issue-id>-<short-description>
```

#### 5. Create Pull Request

- Create a pull request to the upstream repository
- Include the issue ID in the PR description

#### 6. Code Review Process

**If approved:**
- Merge the PR and you're done! 🎉

**If changes requested:**
```bash
# Make necessary changes locally
git add .
git commit --amend
git push -f origin feature/<issue-id>-<short-description>
```

### Automated Deployment

Once your PR is merged:

- **🤖 GitHub Actions** automatically builds the Docker image
- **📤 Pushes** the image to AWS ECR
- **🚀 Updates** ECS Fargate service with the new deployment
- **✅ No manual AWS interaction** required from developers

> **🎯 Key Advantage**: Developers can focus entirely on code and business logic without worrying about deployment infrastructure.

## 🎯 Key Takeaways

This DevOps approach provides a robust, scalable foundation for Spring Boot application development:

### ✅ Developer Benefits
- **Minimal Setup**: Developers need only **Git, Docker, and an IDE** to start contributing
- **Consistent Environment**: The **same Dockerfile** works for local testing and CI/CD deployment
- **Safe Testing**: Local Docker builds enable thorough testing before pushing code, reducing errors and setup complexity

### ✅ Team Benefits
- **Faster Onboarding**: New team members can start contributing within minutes
- **Reduced Friction**: No more "it works on my machine" issues
- **Standardized Process**: Everyone follows the same streamlined development and deployment process

### ✅ Production Benefits
- **Automated Deployment**: **GitHub Actions** handles automated deployment to AWS ECS Fargate
- **Production Parity**: Same build process locally and in production
- **Reliable Releases**: Automated testing and deployment ensure production-ready updates

---
