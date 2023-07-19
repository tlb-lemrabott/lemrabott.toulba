---
title: "Housing Management System"
description: "A custom Backend RESTful API for the Housing Management System"
dateString: March 2023
draft: false
tags: ["JavaScript", "Nodejs", "Express.js", "RESTful API", "Docker", "MongoDB Database"]
weight: 202
cover:
    image: "projects/housing-managemnt-api/cover.png"
---

## Intro
The [**Housing System Management project**] is a robust and efficient application developed to manage housing-related data through a RESTful API. Leveraging Node.js and MongoDB, this project provides a seamless and secure way to interact with housing-related information while following the MVC (Model-View-Controller) architectural pattern. To ensure proper authentication and authorization, JSON Web Tokens (JWT) have been implemented. Additionally, Docker has been utilized to simplify the deployment and management of the MongoDB Server.

## Key Features: 
- RESTful API: The project is built around a RESTful API design, enabling clients to perform CRUD (Create, Read, Update, Delete) operations on housing-related data. The API adheres to best practices for a consistent and user-friendly experience.
- Node.js: Node.js, known for its high-performance and event-driven architecture, forms the foundation of this project. It allows for efficient handling of incoming requests and responses, making the application scalable and responsive.
- MongoDB: MongoDB, a popular NoSQL database, has been chosen as the backend data store. Its flexible schema design accommodates housing-related information, making it well-suited for this project.
- JWT Authorization: To ensure secure access to the API's endpoints, JSON Web Tokens (JWT) have been implemented. This provides authentication and authorization capabilities, allowing users to access appropriate resources based on their roles.
- MVC Model: Following the Model-View-Controller (MVC) architectural pattern, the codebase has been organized into distinct modules for better separation of concerns. This promotes code reusability, maintainability, and scalability.
- Dockerized MongoDB Server: Docker has been utilized to containerize the MongoDB Server, simplifying the setup and deployment process. It ensures that the application and database environment remain consistent across different development and production environments.
- Thorough Testing: The API has undergone comprehensive testing using both REST API testing frameworks and Postman. This testing approach ensures that the API functions correctly, delivering a reliable and stable user experience.

## Technologies Used:
- Node.js: For server-side application development and handling HTTP requests.
- Express.Js: A Node.js framework for building robust APIs.
- MongoDB: As the NoSQL database for storing and managing housing-related data.
- JWT: For authentication and authorization of API endpoints.
- Docker: For containerizing and managing the MongoDB Server.
- REST API: For defining the API endpoints and interactions.
- Postman: For manual and automated API testing and validation.

## GitHub Repository:
The source code and documentation for this project can be found in the following GitHub repository: 
🔗 [**Housing-Management API Repository**](https://github.com/tlb-lemrabott/Housing-Management-System).

## Conclusion:
The Housing System Management API built using **Node.js**, **Express.Js**, **MongoDB**, and **JWT** is a feature-rich and reliable application for managing housing-related data. With its RESTful architecture, Dockerized database, and thorough testing, the project ensures seamless functionality, security, and efficiency in handling housing information. This application could be readily integrated into real-world housing systems or serve as a solid foundation for further enhancements and customizations. Feel free to explore the GitHub repository to dive deeper into the code and contribute to the project's development.