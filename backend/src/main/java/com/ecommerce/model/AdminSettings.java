package com.ecommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "admin_settings")
public class AdminSettings {
    @Id
    private String id = "admin-config";
    private List<String> adminEmails = new ArrayList<>();
    private List<String> adminUsernames = new ArrayList<>();
}
