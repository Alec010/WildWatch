# Use an official OpenJDK 17 image
FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Download dependencies (this step is cached unless pom.xml changes)
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline

# Copy the rest of the application code
COPY . .

# Make sure mvnw is executable after copying everything
RUN chmod +x mvnw

# Build the application
RUN ./mvnw clean package -DskipTests

EXPOSE 8080

CMD ["java", "-jar", "target/WildWatch-0.0.1-SNAPSHOT.jar"]