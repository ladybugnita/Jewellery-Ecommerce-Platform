package com.ecommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String type;
    private String title;
    private String message;
    private String userId;
    private String role;
    private String referenceId;
    private Map<String, Object> data;
    private Boolean isRead = false;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}