package com.ecommerce.dto;

import lombok.Data;

@Data
public class UserProfileUpdateRequest {
    private String fullName;
    private String phoneNumber;
    private String address;
    private String occupation;
    private Double annualIncome;
    private String idProof;
    private String idProofNumber;
    private String profileImage;
}