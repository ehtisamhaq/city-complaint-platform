package com.city.complaints.common.exception;

public class ResourceNotFoundException extends ApiException {
    public ResourceNotFoundException(String message) {
        super(404, message);
    }

    public ResourceNotFoundException(String resourceName, Object identifier) {
        super(404, resourceName + " not found with id: " + identifier);
    }
}
