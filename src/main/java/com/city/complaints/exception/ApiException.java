package com.city.complaints.exception;

import org.springframework.http.HttpStatus;

/**
 * Base application exception carrying an HTTP status code.
 * All custom exceptions extend this so the global handler can map them generically.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
