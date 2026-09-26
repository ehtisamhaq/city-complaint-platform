package com.city.complaints.exception;

import org.springframework.http.HttpStatus;

/** Thrown when a business rule is violated (e.g., duplicate email, invalid state). Maps to HTTP 409. */
public class ConflictException extends ApiException {

    public ConflictException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
