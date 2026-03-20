package com.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private String username;
    private String role;
    private String id;

    public AuthResponse(String token, String username, String role, String id) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.id = id;
    }
}