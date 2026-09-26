package com.city.complaints.exception;

import org.springframework.http.HttpStatus;

/** Thrown when a caller does not have permission to perform an action. Maps to HTTP 403. */
public class ForbiddenException extends ApiException {

    public ForbiddenException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}
