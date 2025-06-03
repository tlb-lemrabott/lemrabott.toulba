# 🌐 Lemrabott Toulba — Personal Website


Hi 👋

I am Lemrabott. A highly dedicated software engineer with an M.S. in Computer Science and over 3 years of production-level experience. I have proven expertise in building scalable distributed systems, developing infrastructure using Java and Spring Boot, and working with complex data structures and algorithms. 

I am passionate about solving real-world problems with reliable, accessible, and performant software solutions.

This is the official github repository for my personal website [Lemrabott Toulba](https://www.lemrabotttoulba.com/).
A fast, secure, and modern static site built with **Hugo v0.114**, powered by **AWS services** for **Nodejs** backend process. 


---

## Features
- ⚡ **Lightning-fast** static site powered by [Hugo](https://gohugo.io/)
- 🧠 **Real-time LeetCode statistics** with animations, ranking, and breakdowns
- 📈 Real-time data visualization using **Chart.js** and **CountUp.js**
- 💡 Tech stack overview with **DevIcon** for clean skill display
- 🔒 API rate-limited (10 requests per hour per IP) _Custom Implementation_
- 🧠 Browser caching for LeetCode data and theme preferences with a 5-minute expiration, automatically refreshing after expiry.
- ☁️ **Serverless backend** leveraging AWS Lambda & Express (via `@vendia/serverless-express`)
- 📧 Email notifications powered by **AWS SNS**
- 🌐 DNS management and routing via **AWS Route 53**
- 📊 CloudWatch logging for Lambda execution tracing and debugging
- 🔁 Fully automated **CI/CD pipeline** via GitHub Actions

---

## 🛠️ Technology Stack
### 🌍 Frontend (Static Site)
- **Hugo v0.114** (Static Site Generator)
- **HTML**, **CSS**, **JavaScript**, **TypeScript**
- **TOML**, **YAML**, **JSON** (Site configuration)
- **Chart.js** & **CountUp.js** for live charts and animations
- **DevIcon** for clean and responsive tech stack icons
- **JsDeliver CDN** for optimized content delivery

### 🔙 Backend (Serverless Microservice)
- **Node.js** + **Express**
- **AWS Lambda** (Serverless Functions)
- **AWS API Gateway** (HTTP endpoint with stage routing)
- **AWS SNS** for sending email notifications (e.g., contact form or alerting)
- **AWS Route 53** for DNS and domain routing management
- **CloudWatch Logs** (Request tracing and debugging)
- **IAM Roles & Policies** (Security)
- **@vendia/serverless-express** for Lambda-Express bridge
- **leetcode-query** (NPM API wrapper for LeetCode stats)

### 🔁 DevOps & CI/CD
- **GitHub Actions**: Automated deployment pipeline

---

## 📂 Project Structure
lemrabott.toulba/
├── config/             # Hugo site configuration in YAML/TOML/JSON
├── content/            # Hugo pages (experience, education, etc.)
├── layouts/            # Hugo custom layouts
├── static/             # Static assets (images, js, css)
├── themes/             # PaperMod theme with custom modifications
├── leetcode-api/       # AWS Lambda backend service
│   ├── app.ts          # Express application setup
│   ├── lambda.ts       # Lambda handler (serverless-express)
│   ├── service.ts      # LeetCode query logic
│   ├── tsconfig.json   # TypeScript configuration
│   └── package.json    # Dependencies & scripts
├── .github/workflows/  # GitHub Actions for CI/CD
└── README.md           # This README file

---


## 🚦 API Details
GET /api/v1/leetcode/{username}
Retrieves live LeetCode stats via leetcode-query
Response includes:
- Total Solved
- Acceptance Rate
- Submission Breakdown
- Ranking

---

## 📊 Charts and Animations
- Chart.js for interactive pie/doughnut graphs of submission breakdowns.
- CountUp.js for animated counters of statistics.
- Live updates trigger automatically for a dynamic user experience.

---

## 🔒 Security & Optimization
- 🔐 IAM User, Role, and policy based permissions

---

## 🔁 CI/CD with GitHub Actions
Every push to the main branch automatically triggers:
- Building and deploying the backend service function to AWS Lambda.
- Building and deploying the Hugo UI pages to an AWS S3 bucket.


---

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Hugo Version](https://img.shields.io/badge/hugo-v0.114.0-blue)

