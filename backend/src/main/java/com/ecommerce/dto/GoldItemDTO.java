package com.ecommerce.dto;

import lombok.Data;
import java.util.List;

@Data
public class GoldItemDTO {
    private String itemType;
    private Double weightInGrams;
    private String purity;
    private String description;
    private Double estimatedValue;
    private String serialNumber;
    private String imageUrl;
    private List<String> billAttachments;
    private String customerSerialNumber;
}
