package com.city.complaints.common.config;

import com.city.complaints.common.security.JwtAuthenticationFilter;
import com.city.complaints.common.security.CustomUserDetailsService;
import com.city.complaints.common.security.RestAccessDeniedHandler;
import com.city.complaints.common.security.RestAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration using the modern lambda DSL (Spring Security 6.x).
 *
 * <p>Session creation is STATELESS — auth state lives entirely in JWT tokens.
 * CSRF is disabled because we don't use browser-session cookies.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter  jwtFilter;
    private final CustomUserDetailsService userDetailsService;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler       restAccessDeniedHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // ── Disable CSRF (stateless JWT, no browser cookies) ──────────────
            .csrf(AbstractHttpConfigurer::disable)

            // ── Stateless sessions ────────────────────────────────────────────
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // ── Authorisation rules ───────────────────────────────────────────
            .authorizeHttpRequests(auth -> auth
                // Public: auth, documentation, public stats, and RAG knowledge assistant
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/public/**").permitAll()
                .requestMatchers("/rag/**").permitAll()
                .requestMatchers("/docs", "/docs/**", "/v3/api-docs", "/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Authenticated / Role-based complaint endpoints
                .requestMatchers(HttpMethod.GET, "/complaints/my").authenticated()
                .requestMatchers(HttpMethod.POST, "/complaints/upload").authenticated()
                .requestMatchers(HttpMethod.POST, "/complaints").hasRole("CITIZEN")
                .requestMatchers(HttpMethod.PATCH, "/complaints/**").hasRole("STAFF")

                // Public complaint reading (landing page map & recent complaints feed)
                .requestMatchers(HttpMethod.GET, "/complaints", "/complaints/**").permitAll()

                // "Endorse this fix" from the public board. Anonymous on purpose,
                // and matched before the catch-all below.
                .requestMatchers(HttpMethod.POST, "/complaints/*/endorse").permitAll()

                // Dashboard and feedback
                .requestMatchers("/dashboard/citizen").hasRole("CITIZEN")
                .requestMatchers("/dashboard/staff").hasRole("STAFF")
                .requestMatchers("/feedback/**").hasRole("CITIZEN")
                .requestMatchers("/dashboard/**").authenticated()

                .anyRequest().authenticated()
            )

            // ── Distinct failure modes ─────────────────────────────────────────
            // 401 when there is no valid session, 403 when there is a session
            // but the role is not permitted. Without this split, Spring answers
            // 403 for both and a client cannot detect an expired token.
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(restAuthenticationEntryPoint)
                .accessDeniedHandler(restAccessDeniedHandler)
            )

            // ── Wire authentication provider ──────────────────────────────────
            .authenticationProvider(authenticationProvider())

            // ── JWT filter before username/password filter ────────────────────
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
