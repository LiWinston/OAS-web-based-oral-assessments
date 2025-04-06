# Backend

## Java 8

### Introduction:

Java is a widely used object-oriented programming language. Java 8, a significant long-term support (LTS) version, introduced modern language features such as Lambda expressions, the Stream API, and default methods, greatly enhancing code conciseness and functional programming capabilities.

### Why we choose:

Lots of open-source frameworks and enterprise systems still rely on Java 8, ensuring excellent compatibility.

The project team is highly familiar with Java 8, leading to efficient development.

New features in later Java versions are unnecessary for our use.

### Alternatives:

Python, Node.js, C++, Go: The main reasons for not choosing these backend languages are twofold. First, although each language has its own frameworks, they are generally less mature and less well-supported by the community compared to Spring Boot. Second, our backend team is primarily proficient in Java, with only limited familiarity with other programming languages.

## SpringBoot 2

### Introduction:

Spring Boot is a rapid development framework based on Spring. It provides auto-configuration, embedded servers, and a convention-over-configuration approach, simplifying the setup process for backend services.

### Why we choose:

Offers a rich set of starters and auto-configuration, significantly reducing development effort.

Seamlessly integrates with the Spring ecosystem (Security, Data, etc.), ensuring easy extensibility.

Boasts a mature community and comprehensive documentation, making it ideal for stable development and long-term maintenance.

Every backend developer in our team familiar with

Java 8 can only integrate with Spring Boot 2

### Alternatives:

Native Spring: configuration is complex and reduces development efficiency.

Microservice frameworks like Spring Cloud: have a steep learning curve and are unnecessary for this project.

## MySQL 8

### Introduction:

MySQL is a popular open-source relational database management system. Version 8.0 introduces modern features such as window functions, enhanced JSON support, and utf8mb4 as the default character set.

### Why we choose:

Active community, easy to deploy and maintain

Supports transactions, foreign keys, and a variety of indexing optimization strategies

Works well with MyBatis-Plus, making it suitable for small to medium-sized projects

### Alternatives:

PostgreSQL: While it offers strong standards compliance and advanced features, it may have a steeper learning curve and slightly more complex tuning compared to MySQL, especially for our team who are already familiar with MySQL.

MongoDB / Other NoSQL Databases: These are great for unstructured or semi-structured data, but for applications that require strong relational data integrity, complex joins, and transactional consistency, a relational database like MySQL is often a better fit.

## Mybatis-Plus

### Introduction:

MyBatis-Plus is an enhancement tool built on top of MyBatis. It offers a wide range of automated CRUD operations, code generators, pagination plugins, and more.

### Why we choose:

Retains the flexibility of MyBatis while significantly reducing boilerplate code

Easy to learn, supports writing query statements using lambda expressions to avoid hardcoding

Well-developed plugin system with support for pagination queries

### Alternatives:

Spring Data JPA: Although convenient, it may limit SQL flexibility and make it harder to write complex or optimized queries compared to MyBatis or MyBatis-Plus.

MyBatis : Offers full control over SQL, but requires writing a large amount of repetitive boilerplate code for CRUD operations.

## Swagger

### Introduction:

Swagger is an open-source toolkit for generating, describing, invoking, and visualizing RESTful APIs. It allows developers to quickly generate API documentation using annotations.

### Why we choose:

Automatically generates API documentation, improving collaboration between frontend and backend teams

Supports online debugging and request simulation

Seamlessly integrates with Spring Boot and can be used with simple annotations

### Alternatives:

Spring REST Docs: Generates documentation from actual test cases, ensuring high accuracy, but setup is more complex and less intuitive, especially for rapid development and frequent API changes.

OpenAPI Generator / Redoc: These are powerful for generating static docs or client SDKs, but typically rely on pre-written OpenAPI specs rather than auto-generating from code annotations.

## Maven

### Introduction:

Maven is a build tool based on the Project Object Model (POM), widely used in Java projects for managing dependencies, build processes, and project lifecycles.

### Why we choose:

Natively supported by Spring Boot with extensive community resources

Clear dependency management and consistent build and deployment processes

Works smoothly with IntelliJ IDEA and supports a wide range of plugins for extension

### Alternatives:

Gradle: Offers more flexibility and faster incremental builds, but has a steeper learning curve due to its Groovy/Kotlin DSL and less straightforward configuration compared to Maven's declarative XML approach.

## Postman

### Introduction:

Postman is a widely used API debugging tool for sending HTTP requests, testing API responses, saving call history, and more.

### Why we choose:

User-friendly interface, making it easy to quickly construct and debug requests

Supports environment variables, scripting, and sharing of API collections

Can serve as a lightweight solution for API testing

### Alternatives:

cURL: Powerful and scriptable, but purely command-line based, which can be less intuitive and slower for constructing and testing complex requests, especially for beginners or visual learners.

HTTPie: Offers a more user-friendly command-line experience than cURL, but still lacks the rich UI, request history, and collaboration features provided by Postman.

## Junit

### Introduction:

JUnit is one of the most widely used unit testing frameworks in the Java ecosystem. It supports annotations, assertions, and test lifecycle management features.

### Why we choose:

Tightly integrated with Spring Boot, making it well-suited for automated testing and continuous integration

Supports advanced features such as parameterized tests and integration with mocking frameworks

Abundant tutorials and real-world usage examples make it easy to learn and adopt

### Alternatives:

TestNG: While powerful and flexible, its syntax and configuration can be more complex. JUnit has become the de facto standard in the Spring Boot ecosystem, with better integration and community support.

Spock: Provides a highly expressive syntax and great support for Groovy-based testing, but requires learning Groovy, which may not be familiar to Java-only teams.

## IntelliJ IDEA / VS Code / Cursor

### Introduction:

These are the primary code editors used by our development team. Each tool supports efficient Java development:

IntelliJ IDEA: A powerful and full-featured IDE widely used for Java development. It provides excellent code completion, debugging, and Spring Boot integration.

VS Code: A lightweight and extensible editor with strong plugin support. Suitable for quick development, frontend tasks, and script editing.

Cursor: A modern AI-powered code editor, similar to VS Code, that enhances productivity through integrated code suggestions and navigation features.

## Redis (Optional)

### Introduction:

### Why we choose:

### Alternatives:

# Frontend

## React 19

### Introduction:

React is a JavaScript library for building user interfaces, particularly single-page applications. React 19 introduces significant improvements including compiler optimizations, new hooks, and enhanced concurrent rendering capabilities.

### Why we choose:

- Component-based architecture promotes reusability and maintainability
- Virtual DOM ensures efficient rendering and optimal performance
- Extensive ecosystem with robust community support
- Backward compatibility with existing React codebases

### Alternatives:

Vue.js: While offering similar component-based architecture, it has a smaller ecosystem and community compared to React.

Angular: Provides a full-featured framework but has a steeper learning curve and more opinionated structure, potentially limiting flexibility for our specific needs.

## TailwindCSS 4

### Introduction:

Tailwind CSS is a utility-first CSS framework that provides low-level utility classes to build custom designs without leaving HTML. Version 4 introduces performance improvements, simplified configuration, and enhanced responsive design capabilities.

### Why we choose:

- Enables rapid UI development through utility classes
- Highly customizable to match design requirements
- Reduces the need for custom CSS, resulting in smaller bundle sizes
- Excellent integration with React components

### Alternatives:

CSS Modules: Offers scoped styling but requires more custom CSS writing and maintenance.

Styled Components: Provides component-level styling but may increase bundle size and add complexity with its CSS-in-JS approach.

## Zustand

### Introduction:

Zustand is a small, fast state management solution using simplified flux principles. It offers a minimal API that reduces boilerplate while maintaining flexibility.

### Why we choose:

- Lightweight with minimal boilerplate compared to Redux
- Simple, hook-based API that integrates well with React
- Supports middleware for additional functionality
- Allows for partial state updates without unnecessary re-renders

### Alternatives:

Redux: More structured but requires significant boilerplate code and has a steeper learning curve.

Context API: Built into React but becomes unwieldy for complex state management and lacks some performance optimizations.

## Shadcn UI / Radix UI

### Introduction:

Shadcn UI provides accessible, customizable component primitives built on Radix UI. Together they offer a comprehensive solution for building robust user interfaces.

### Why we choose:

- Highly accessible components adhering to WAI-ARIA standards
- Unstyled primitives allowing for complete design control with Tailwind
- Strong TypeScript support ensuring type safety
- Excellent keyboard navigation and screen reader compatibility

### Alternatives:

Material UI: Comprehensive but comes with a specific design language that may not align with custom design requirements.

Chakra UI: Offers accessibility and customization but has a larger bundle size and its own styling system that may conflict with Tailwind.

## React Hook Form

### Introduction:

React Hook Form is a performant, flexible form validation library for React. It leverages uncontrolled components and native form validation for better performance.

### Why we choose:

- Minimizes re-renders by using uncontrolled components
- Reduces bundle size compared to alternatives (Formik, Redux Form)
- Seamless integration with Zod for schema validation
- Intuitive API that aligns with React's functional paradigm

### Alternatives:

Formik: Popular but causes more re-renders and has a larger bundle size.

Redux Form: Powerful but tightly coupled with Redux and adds significant complexity.

## ESLint / Prettier

### Introduction:

ESLint is a static code analysis tool for identifying problematic patterns in JavaScript code. Prettier is an opinionated code formatter that ensures consistent code style.

### Why we choose:

- Enforces code quality standards and best practices
- Improves maintainability through consistent code style
- Integrates with development environments for real-time feedback
- Reduces code reviews focused on styling issues

### Alternatives:

TSLint: Deprecated in favor of ESLint with TypeScript support.

Standard.js: Simpler but less configurable than the ESLint/Prettier combination.

## Vitest

### Introduction:

Vitest is a Vite-native unit test framework designed for JavaScript applications. It offers a Jest-compatible API with significantly faster performance.

### Why we choose:

- Leverages Vite's transformation pipeline for extremely fast testing
- Compatible with Jest's API, reducing the learning curve
- Native TypeScript support without additional configuration
- Excellent watch mode and HMR for test-driven development

### Alternatives:

Jest: Widely used but slower and requires more configuration with modern frameworks.

Testing Library: Complementary to Vitest, used together for component testing rather than an alternative.
