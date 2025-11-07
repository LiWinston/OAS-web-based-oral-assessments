# Deployment Guide on Windows

This guide provides step-by-step instructions for deploying the application on your own computer.

> If you are using a Unix-based system (Linux or MacOS), the main things to change is the commands to run the backend server. You would use `./mvnw` instead of `./mvnw.cmd`, and the copy command would be `cp` instead of `copy`. The rest of the steps should be similar. Same for the environment variable setup.

## Prerequisites

* Java 8
* Git if you plan to clone the repository.
* Node.js and npm for building frontend assets.
* MySQL 8.0 for the database.

## Steps to Deploy

0. Assume you have the repository cloned or downloaded to your local machine.
1. Run the SQL script provided `oas_log.sql` to set up the database schema and initial data. (If not using the school's MySQL server)
2. Configure the database connection settings in the `application.yml` file located in the `backend/src/main/resources` directory. Key name is `spring.datasource.url`. If you are using the school's MySQL server, the URL should look like this:
   ```
   spring.datasource.url: jdbc:mysql://oas12025.eng.unimelb.edu.au:3306/swen90017_db?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC&useLegacyDatetimeCode=false
   ```
3. Run the backend server in the `backend` folder:
   ```powershell
   ./mvnw.cmd clean package -DskipTests

    cp target/OAS-0.0.1-SNAPSHOT.jar app.jar

    <redacted for privacy>

    java -jar app.jar --server.port=8081
   ```
   We provide a PowerShell script `start.ps1` to help you start the backend server. You should check and set the environment variables for the backend server if you are using your own database.
4. Build and run the frontend:
   ```bash
   cd frontend

   npm install
   ```

5. Copy frontend environment configuration provided (`.env.local`) to frontend folder.

6. Start the frontend development server in the `frontend` folder:
   ```bash
   npm run dev
   ```