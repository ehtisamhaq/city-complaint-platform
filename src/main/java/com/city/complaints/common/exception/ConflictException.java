package com.city.complaints.common.exception;

public class ConflictException extends ApiException {
    public ConflictException(String message) {
        super(409, message);
    }
}
