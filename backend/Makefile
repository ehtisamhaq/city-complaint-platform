# Explicitly set Java 21 for Homebrew on macOS
JAVA_HOME := /opt/homebrew/opt/openjdk@21
MVNW      := JAVA_HOME=$(JAVA_HOME) ./mvnw
PORT      := 8080

.PHONY: dev build start stop restart test clean help

## dev: Start the Spring Boot development server
dev:
	$(MVNW) spring-boot:run

## build: Build runnable JAR package (skips unit tests for speed)
build:
	$(MVNW) clean package -DskipTests

## start: Build and run production JAR
start: build
	java -jar target/*.jar

## stop: Free up port 8080 by killing any running process on it
stop:
	@echo "Checking for processes on port $(PORT)..."
	@lsof -ti :$(PORT) | xargs kill -9 2>/dev/null || echo "Port $(PORT) is clear."

## restart: Kill any hung process on port 8080 and restart the dev server
restart: stop dev

## test: Run unit and integration tests
test:
	$(MVNW) test

## clean: Remove build directory (target/)
clean:
	$(MVNW) clean

## help: Print target descriptions
help:
	@echo "Usage: make [target]"
	@echo ""
	@sed -n 's/^##//p' $(MAKEFILE_LIST)