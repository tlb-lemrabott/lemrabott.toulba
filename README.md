# 🌐 Lemrabott Toulba — Personal Website


Hi 👋

I am Lemrabott. A highly dedicated software engineer with an M.S. in Computer Science and over 3 years of production-level experience. I have proven expertise in building scalable distributed systems, developing infrastructure using Java and Spring Boot, and working with complex data structures and algorithms. 

I am passionate about solving real-world problems with reliable, accessible, and performant software solutions.

This is the official github repository for my personal website [Lemrabott Toulba](https://www.lemrabotttoulba.com/).
A fast, secure, and modern static site built with **Hugo v0.114** and hosted on AWS. 


---

## Features
- ⚡ **Lightning-fast** static site powered by [Hugo](https://gohugo.io/)
- 💡 Tech stack overview with **DevIcon** for clean skill display
- 📧 Contact form sends messages through an existing AWS API Gateway endpoint
- 🌐 DNS management and routing via **AWS Route 53**
- 🔁 Fully automated **CI/CD pipeline** via GitHub Actions

---

## 🛠️ Technology Stack
### 🌍 Frontend (Static Site)
- **Hugo v0.114** (Static Site Generator)
- **HTML**, **CSS**, **JavaScript**, **TypeScript**
- **TOML**, **YAML**, **JSON** (Site configuration)
- **DevIcon** for clean and responsive tech stack icons
- **JsDeliver CDN** for optimized content delivery

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
├── .github/workflows/  # GitHub Actions for CI/CD
└── README.md           # This README file

---

## 🔁 CI/CD with GitHub Actions
Every push to the main branch builds the Hugo site and deploys it to an AWS S3 bucket.


---

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Hugo Version](https://img.shields.io/badge/hugo-v0.114.0-blue)

