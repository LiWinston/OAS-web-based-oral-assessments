Spring Boot Remote Deployment Guide

1. Prerequisites

1.1 Hardware Requirements
CPU: At least 1 core
Memory: At least 16 GB
Storage: At least 20 GB available space

1.2 Software Requirements

Operating System (any one of the following):
Debian GNU/Linux 12 (Bookworm)
Windows 10
macOS 11.0 or higher

Required Tools:

Git: Code management
MySQL: Database
Docker: Containerization
Swagger: API documentation and testing
SonarQube: Continuous Integration(Optional)
Nginx: Web server(Optional)
Jenkins: Continuous Deployment
Auth0: Authentication



2. Download Project Code

git clone https://github.com/SWEN90017-2025-SM1/OAS-web-based-oral-assessments.git

3. Install Docker (on Debian GNU/Linux 12)

sudo -s
apt update
apt install -y apt-transport-https ca-certificates curl gnupg2 software-properties-common
curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
apt update
apt install docker-ce -y
systemctl start docker
systemctl enable docker
usermod -aG docker your_username
docker --version



4. Configure SSH Access

cd ~/.ssh
nano authorized_keys
chmod 600 authorized_keys
cat authorized_keys  # Optional: verify

This allows passwordless login using your local private key.



5. Pull Required Base Image
docker pull mysql:8



6. Create MySQL Container
sudo docker run -d \
--name mysql8 \
-e MYSQL_ROOT_PASSWORD=swen90017_ps \
-e MYSQL_DATABASE=swen90017_db \
-e MYSQL_USER=swen90017_user \
-e MYSQL_PASSWORD=90017 \
-p 3306:3306 \
-v mysql_data:/var/lib/mysql \
mysql:8



7. Build and Export Spring Boot Docker Image (Local Machine)

7.1 Build the JAR
./mvnw clean package -DskipTests

7.2 Create Builder and Build for amd64
docker buildx create --use --name crossbuilder
docker buildx build --platform=linux/amd64 -t my-springboot-app --load .

7.3 Save Image as Tarball
docker save my-springboot-app:latest -o my-springboot-app.tar

7.4 Upload Tarball to Server
scp my-springboot-app.tar ubuntu@oas12025.eng.unimelb.edu.au:~

7.5 (Optional) Clean Local Tarball
rm my-springboot-app.tar



8. Deploy on Remote Server
8.1 SSH to Server
ssh ubuntu@oas12025.eng.unimelb.edu.au

8.2 Load Docker Image
sudo docker load -i my-springboot-app.tar

8.3 (Optional) Remove Tarball After Load
rm my-springboot-app.tar

8.4 Remove Existing Container (If Any)
sudo docker rm -f oas-app

8.5 Run Container
sudo docker run -d -p 8081:8081 --name oas-app my-springboot-app



9. Post Deployment Verification

9.1 Check Container Status
sudo docker ps

9.2 View Container Logs
sudo docker logs -f oas-app

9.3 Open Firewall Port
sudo ufw allow 8081/tcp

9.4 Access Application
http://45.113.232.163:8081



✅ Deployment Complete

Your Spring Boot application is now running on a remote server via Docker! 

 