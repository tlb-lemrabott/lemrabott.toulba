# Blog: Streamlined Spring Boot Development with Docker and AWS ECS

This blog post outlines a **complete workflow for developing, testing, and deploying a Spring Boot application** using Docker and AWS ECS Fargate. The workflow is designed so that a new developer can start contributing with minimal setup.

---

## 1. Docker Responsibilities

The Dockerfile in your project handles the following tasks:

### Build Stage
- Compiles the Spring Boot application into a JAR using Maven.
- Ensures the build runs inside a container, so no local JDK is required.

### Runtime Stage
- Copies the compiled JAR into a lightweight JRE container.
- Exposes the application port (default: 8080).
- Sets the entry point to run the JAR using `java -jar app.jar`.

### Optional Developer Support
- Supports mounting local source code for hot reload with Spring Boot DevTools.

**Example Multi-Stage Dockerfile:**

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

---

## 2. GitHub Actions Responsibilities

GitHub Actions automates **CI/CD** for your application:

1. Trigger on push to main or feature branches.
2. Checkout code from GitHub.
3. Build Docker image using the same Dockerfile.
4. Authenticate with AWS using secrets.
5. Push Docker image to **Amazon ECR**.
6. Update ECS Fargate service to deploy the new image.

**Example GitHub Actions Workflow:**

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

---

## 3. New Developer Onboarding Workflow

### Requirements
- Git installed
- Docker installed
- IDE installed (IntelliJ IDEA, VS Code, etc.)

### Setup
1. Fork the repository.
2. Clone your fork locally:

```bash
git clone <your-forked-repo-url>
cd <repo-name>
```

3. Open Docker Desktop.
4. Build and run the app locally:

```bash
docker build -t myapp:dev .
docker run -p 8080:8080 myapp:dev
```

5. Verify the app runs successfully at `http://localhost:8080`.

### Feature Development Process
1. Create a GitHub Issue describing the feature → get approval.
2. In IDE, create a new branch for the issue:

```bash
git checkout -b feature/<issue-id>-<short-description>
```

3. Develop feature code and business logic.
4. Build and run the app locally using Docker to ensure no errors:

```bash
docker build -t myapp:dev .
docker run -p 8080:8080 myapp:dev
```

5. Write and run unit/integration tests inside Docker:

```bash
docker run myapp:dev mvn test
```

6. Commit changes including the issue ID:

```bash
git add .
git commit -m "ISSUE-123: Add new payment validation feature"
git push origin feature/<issue-id>-<short-description>
```

7. Create a pull request to the upstream repository.
8. PR Review:
   - If approved → merge done.
   - If changes requested → fix locally, amend commit, force push:

```bash
git add .
git commit --amend
git push -f origin feature/<issue-id>-<short-description>
```

### Post Merge / Deployment
- GitHub Actions automatically builds the Docker image, pushes to AWS ECR, and updates ECS Fargate service.
- Developer does not need to touch AWS manually.

---

## ✅ Summary
- Developers need **only Git, Docker, and an IDE** to start.  
- The **same Dockerfile** works for local testing and CI/CD deployment.  
- **GitHub Actions** handles automated deployment to AWS ECS Fargate, ensuring production-ready updates.  
- Local Docker builds enable safe testing before pushing code, reducing errors and setup complexity.

