FROM openjdk:8-jdk-alpine
LABEL maintainer="dongqiaoh1@student.unimelb.edu.au"
WORKDIR /app
COPY target/OAS-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar", "--server.port=8081"]
