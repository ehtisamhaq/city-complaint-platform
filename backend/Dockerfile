# Build Stage
# The project targets Java 21 (see <java.version> in pom.xml), so the build
# image must ship a 21 JDK. Pinning 17 here fails with
# "error: release version 21 not supported".
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run Stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]