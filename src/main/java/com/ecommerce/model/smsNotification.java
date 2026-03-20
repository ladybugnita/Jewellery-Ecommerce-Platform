package com.ecommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "sms_notifications")
public class smsNotification {
    @Id
    private String id;
    private String phoneNumber;
    private String message;
    private String type;
    private String referenceId;
    private String status;
    private LocalDateTime scheduledTime;
    private LocalDateTime sentTime;
    private Integer retryCount = 0;
}
