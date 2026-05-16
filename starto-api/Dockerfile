FROM maven:3.9.6-eclipse-temurin-21-alpine
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B
RUN cp target/*.jar app.jar
# force-rebuild-v3
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
