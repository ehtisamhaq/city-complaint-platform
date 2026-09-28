package com.city.complaints.common.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Startup guard for settings that are fine in development and dangerous in
 * production.
 *
 * The JWT signing key has a placeholder default in application.yml so the app
 * boots with no configuration. That is convenient locally, but a deployed
 * instance running on the placeholder can be given a token forged by anyone,
 * because the key is published in the repository. So in a production profile
 * the app refuses to start instead of serving with a guessable key.
 */
@Component
@Slf4j
public class ProductionConfigValidator {

    private static final String PLACEHOLDER_SECRET =
            "change-me-in-production-must-be-at-least-32-characters-long";

    private final String activeProfile;
    private final String jwtSecret;

    public ProductionConfigValidator(
            @Value("${spring.profiles.active:default}") String activeProfile,
            @Value("${jwt.secret}")                        String jwtSecret) {
        this.activeProfile = activeProfile;
        this.jwtSecret     = jwtSecret;
    }

    @PostConstruct
    public void validate() {
        boolean production = "prod".equalsIgnoreCase(activeProfile)
                || "production".equalsIgnoreCase(activeProfile);

        if (PLACEHOLDER_SECRET.equals(jwtSecret) || jwtSecret.isBlank()) {
            String message =
                    "JWT_SECRET is unset or still the placeholder value. Set the "
                    + "JWT_SECRET environment variable to a random string of at least "
                    + "32 characters before starting with the 'prod' profile.";

            if (production) {
                throw new IllegalStateException(message);
            }
            log.warn("Running with the placeholder JWT signing key. {}", message);
        } else if (jwtSecret.length() < 32) {
            log.warn(
                    "JWT_SECRET is only {} characters; 32 or more is required for a "
                    + "strong HMAC key.",
                    jwtSecret.length());
        }
    }
}
