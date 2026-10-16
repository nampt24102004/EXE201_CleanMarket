package com.app.features.feedback.enums;

/**
 * REQUESTED: refund approved by staff, waiting for the customer's bank account.
 * BANK_INFO_SUBMITTED: customer sent an account, waiting for staff to check it (a rejection sends it back to REQUESTED).
 * APPROVED: account checked, waiting for the transfer. MANUAL_COMPLETED: money sent, reference recorded.
 */
public enum RefundStatus {
    REQUESTED, BANK_INFO_SUBMITTED, APPROVED, MANUAL_COMPLETED
}
