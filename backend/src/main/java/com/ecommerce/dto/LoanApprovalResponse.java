package com.ecommerce.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class LoanApprovalResponse {
    private String loanId;
    private String loanNumber;
    private String status;
    private String approvedBy;
    private LocalDateTime approvalDate;
    private String rejectionReason;
    private Map<String, Object> loanDetails;
}