package com.city.complaints;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@SpringBootApplication
public class ComplaintPlatformApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(ComplaintPlatformApplication.class, args);
    }

    /**
     * Automatically loads .env file if present in working directory or project root.
     * Normalizes postgresql:// URL to jdbc:postgresql:// if needed.
     */
    private static void loadDotEnv() {
        Path envPath = Path.of(".env");
        if (!Files.exists(envPath)) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(envPath);
            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                    continue;
                }

                int eqIdx = line.indexOf('=');
                String key = line.substring(0, eqIdx).trim();
                String value = line.substring(eqIdx + 1).trim();

                // Strip quotes if present
                if ((value.startsWith("\"") && value.endsWith("\"")) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length() - 1);
                }

                // If user entered a PostgreSQL URL starting with postgresql://, normalize to jdbc:postgresql://
                if ("DATABASE_URL".equalsIgnoreCase(key) && value.startsWith("postgresql://")) {
                    value = "jdbc:" + value;
                }

                if (System.getProperty(key) == null && System.getenv(key) == null) {
                    System.setProperty(key, value);
                }
            }
        } catch (IOException ignored) {
            // Silently proceed with standard Spring Boot environment config
        }
    }
}
