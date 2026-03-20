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
    private String userId;
    private String title;
    private String message;
    private String type;
    private String referenceId;
    private boolean isRead = false;
    private LocalDateTime createdAt = LocalDateTime.now();
    private Map<String, Object> data;
}
