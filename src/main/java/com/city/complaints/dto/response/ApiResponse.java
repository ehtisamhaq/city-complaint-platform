package com.city.complaints.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Generic API response wrapper.
 *
 * @param <T> type of the response data payload
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        String  message,
        T       data
) {
    /** Success with data. */
    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    /** Success without data body. */
    public static <T> ApiResponse<T> ok(String message) {
        return new ApiResponse<>(true, message, null);
    }

    /** Error (for cases where we don't throw). */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
