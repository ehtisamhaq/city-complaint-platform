package com.city.complaints.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Handles JWT generation, validation, and claims extraction.
 *
 * <p>Uses JJWT 0.12.x API: {@code Jwts.parser()} instead of the deprecated
 * {@code Jwts.parserBuilder()} from 0.11.x.
 *
 * <p>The subject stored in the token is the user's <b>email</b> prefixed by their
 * type: {@code "CITIZEN:<email>"} or {@code "STAFF:<email>"}. This lets us load
 * the correct entity in {@link CustomUserDetailsService} without an extra DB field.
 */
@Component
@Slf4j
public class JwtProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    // ─── Token generation ─────────────────────────────────────────────────────

    public String generateToken(String subject) {
        SecretKey key = buildKey();
        return Jwts.builder()
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(key)
                .compact();
    }

    // ─── Validation ───────────────────────────────────────────────────────────

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(buildKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    // ─── Claims extraction ────────────────────────────────────────────────────

    public String getSubjectFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public long getExpirationMs() {
        return jwtExpirationMs;
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(buildKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey buildKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
}
