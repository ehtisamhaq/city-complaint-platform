package com.city.complaints.domain.complaint.entity;

/**
 * Allowed complaint status values.
 * Using an enum instead of bare Strings prevents typos and enables type-safe comparisons.
 */
public enum ComplaintStatus {
    PENDING,
    ASSIGNED,
    IN_PROGRESS,
    RESOLVED,
    CLOSED
}
