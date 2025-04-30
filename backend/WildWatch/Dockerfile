# Use an official OpenJDK 17 image
FROM eclipse-temurin:17-jdk

# Set the working directory
WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Download dependencies (this step is cached unless pom.xml changes)
RUN ./mvnw dependency:go-offline

# Copy the rest of the application code
COPY . .

# Build the application
RUN ./mvnw clean package -DskipTests

# Expose port 8080 (Spring Boot default)
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "target/WildWatch-0.0.1-SNAPSHOT.jar"] 