
## Hutool

### Background:

In the current project, we have requirements for common utility functions such as string manipulation and date operations. To avoid reinventing the wheel, improve development efficiency, and maintain code consistency, we have decided to standardize the use of the Hutool utility library across the project.

### Scope of Reuse:

- String, date, and collection processing

- File and stream (I/O) operations

- Object Convert operations

- HTTP Client

### Integration Guidelines:

Maven Dependency

        <dependency> 

            <groupId>cn.hutool</groupId> 

            <artifactId>hutool-all</artifactId> 

            <version>5.8.11</version> 

        </dependency> 

### Usage Guidelines:

- Centralized Wrapping: Commonly used Hutool features should be wrapped in project-specific utility classes for better abstraction and reuse.

- Avoid Overuse: Use Hutool where appropriate; avoid over-reliance to reduce external dependency risks.

- Readable Code: Maintain clear and meaningful method usage to ensure code readability and maintainability.

## SendGrid

### Background:

In our application, many core system features rely on email notifications (such as user registration, password recovery, and message alerts). To simplify email delivery while ensuring high deliverability and scalability, we have chosen SendGrid as our email service provider.

### Scope of Reuse:

- Welcome emails

- Password reset links

- Notification emails

### Integration Guidelines:

Maven Dependency

        <dependency> 

            <groupId>com.sendgrid</groupId> 

            <artifactId>sendgrid-java</artifactId> 

            <version>4.9.3</version> 

        </dependency> 

### Usage Guidelines:

- Store the SendGrid API key securely (e.g., in environment variables or secrets manager).

- Never hardcode API keys in source code or configuration files under version control.

- Be mindful of SendGrid rate limits and queue bulk emails where necessary.





## Microsoft Graph SDK

### Background:

In our system, there may be a need to interact with Microsoft 365 Calendar, and the Microsoft Graph SDK provides a unified and secure way to interact with the Microsoft ecosystem.

### Scope of Reuse:

- Managing Teams and calendars

### Integration Guidelines:

Maven Dependency

        <!-- Microsoft Graph SDK for integrating Calendar --> 

        <dependency> 

            <!-- Include the sdk as a dependency --> 

            <groupId>com.microsoft.graph</groupId> 

            <artifactId>microsoft-graph</artifactId> 

            <!--x-release-please-start-version--> 

            <version>6.33.0</version> 

            <!--x-release-please-end--> 

        </dependency> 

        <dependency> 

            <!-- This dependency is only needed if you are using a TokenCredential object for authentication --> 

            <groupId>com.azure</groupId> 

            <artifactId>azure-identity</artifactId> 

            <version>1.11.0</version> 

        </dependency> 

### Usage Guidelines:

- Store the Azure AD credentials securely (e.g., in environment variables or secrets manager).

- Never hardcode Azure AD credentials in source code or configuration files under version control.

- After receiving the access token and refresh token through the third-party authentication callback, the refresh token can be used later to enable login-free access.



## jjwt

### Background:

To implement stateless authentication in modern web services , we adopt JWT (JSON Web Tokens) for access control. The JJWT library provides a robust and developer-friendly way to issue, parse, and validate JWT tokens.

### Integration Guidelines:

Maven Dependency

        <dependency> 

            <groupId>io.jsonwebtoken</groupId> 

            <artifactId>jjwt-api</artifactId> 

            <version>0.11.5</version> 

        </dependency> 

        <dependency> 

            <groupId>io.jsonwebtoken</groupId> 

            <artifactId>jjwt-impl</artifactId> 

            <version>0.11.5</version> 

            <scope>runtime</scope> 

        </dependency> 

        <dependency> 

            <groupId>io.jsonwebtoken</groupId> 

            <artifactId>jjwt-jackson</artifactId> 

            <version>0.11.5</version> 

            <scope>runtime</scope> 

        </dependency> 

### Usage Guidelines:

- Create a utility class for token operations

- Store the secrets securely (e.g., in environment variables or secrets manager).

- Never hardcode secrets in source code or configuration files under version control.

- Rotate JWT secret keys periodically

## Spring Security

### Background:

To secure our web applications and APIs, we use Spring Security as the foundational framework for authentication, authorization, and protection against common attacks (CSRF, XSS, etc).

### Integration Guidelines:

Maven Dependency

        <dependency> 

            <groupId>org.springframework.boot</groupId> 

            <artifactId>spring-boot-starter-security</artifactId> 

        </dependency> 



### Usage Guidelines: 

 

 