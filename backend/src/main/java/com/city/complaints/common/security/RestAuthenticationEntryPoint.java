package com.city.complaints.common.security;

import com.city.complaints.common.model.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Returns <strong>401 Unauthorized</strong> when a request reaches a protected
 * endpoint without a valid session.
 *
 * <p>Spring Security's default entry point answers 403 for anonymous requests,
 * which is indistinguishable from a genuine role failure on the client. That
 * ambiguity is why an expired token used to strand the dashboard on a
 * "permission denied" message instead of prompting a re-login.
 *
 * <p>{@link RestAccessDeniedHandler} covers the genuine 403 case: an
 * authenticated caller whose role is not permitted.
 */
@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(
            HttpServletRequest  request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException {

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        objectMapper.writeValue(
                response.getWriter(),
                ApiResponse.error(401, "Authentication required. Please sign in again.")
        );
    }
}
