---
title: "Secure User Authentication with Backend-Managed Cognito"
description: "A complete user authentication workflow using Amazon Cognito, following the Backend-Managed Authentication model of Cognito"
dateString: Apr 2025
draft: false
tags: ["Java", "Spring Boot", "AWS Cognito", "ReactJS", "OAuth2", "JWT"]
showToc: false
weight: 200
cover:
    image: "projects/cognito-app/image.png"
---

## Description
This project demonstrates a complete user authentication workflow using Amazon Cognito, providing a user-friendly interface for login, error handling, password change enforcement, and home page access post-login.
> 🛡️ Authentication Approach Used: This implementation follows the Backend-Managed Authentication model. The front-end sends login requests to a backend server, which securely communicates with AWS Cognito to handle authentication, token management, and session control.

## 🧩 Key Features:
- **Login Interface**: Users are prompted to enter their username and password to log in. The login form is designed for simplicity and clarity.

- **Error Handling:** "User Not Found", If a user enters a username that is not registered in the Cognito User Pool, an appropriate error message is shown.

- **Error Handling:**  "Incorrect Password", When an incorrect password is entered for a valid username, the interface displays an error message informing the user.

- **Force Password Change**: If Cognito requires the user to change their password (e.g., after an admin reset or first login), the user is redirected to a password change form after entering valid credentials.

- **Successful Login & Home Page Access:** Upon successful login (and password change, if required), the user is redirected to the home page, where authenticated content is accessible.

- **Secure Backend Integration**: The front-end sends login requests to the backend, which interacts securely with AWS Cognito for token handling, session management, and authentication validation.

## ⚙️ Technologies Used:
- **ReactJS**: For hadling routing to Cognito interface and Home page.
- **AWS Cognito**: Handles user authentication, password policies, and token generation.
- **Spring Boot**: Backend server for secure communication with Cognito (Backend-Managed Authentication model).
- **OAuth2 and JWT**: For session control and secure access to protected routes.
- **Responsive UI/UX**: Ensures optimal usability with clear feedback and guidance during login.

## 🎲 GitHub Repository:
The demo, source code and documentation for this project can be found in the following GitHub repository:  
🔗 [**Secure User Authentication with Backend-Managed Cognito**](https://github.com/tlb-lemrabott/aws-cognito-app-v1/tree/main)

## 📖 Further Reading:
Explore the article that compares multiple AWS Cognito authentication strategies and when to use each:  
🔗 [**Three Approaches to Integrate AWS Cognito Authentication in Your Application**](https://lemrabotttoulba.com/blogs/3873874/)

This blog post covers:
- Direct UI Integration with AWS Cognito API using front-end SDKs like AWS Amplify.
- Backend-Managed Authentication, where your backend handles user verification and token management.
- Cognito Hosted UI a quick, fully managed solution using AWS’s built-in login interface.

Each method is explained with its pros, cons, and best use cases, helping you choose the right fit for your app’s architecture and security needs.

## Conclusion:
This project delivers a real-world example of secure login flow integration with AWS services. Through clean UI, robust error handling, and backend integration, it demonstrates best practices in backend-managed based authentication ensuring a smooth, informative, and secure user experience across all login scenarios.
