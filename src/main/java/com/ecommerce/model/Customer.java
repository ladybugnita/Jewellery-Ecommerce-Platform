package com.ecommerce.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "customers")
public class Customer extends User {
    private String fullName;
    private String address;
    private String idProof;
    private String idProofNumber;
    private String occupation;
    private Double annualIncome;
    private String signature;
    private LocalDateTime signatureUpdatedAt;
}
