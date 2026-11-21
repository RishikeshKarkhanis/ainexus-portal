# ============================
# Stage 1: Build Spring Boot
# ============================
FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY . .

RUN chmod +x ./mvnw && \
    ./mvnw -B clean package -DskipTests


# ============================
# Stage 2: Production Runtime
# ============================
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# Optimize JVM for Render's 512 MB RAM
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65.0 -XX:+UseSerialGC"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "exec java -jar app.jar --server.port=${PORT:-8080}"]