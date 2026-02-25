package com.ecommerce.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class SmsService {
    public void sendSms(String phoneNumber, String message, String type, String referenceId) {
        log.info("SMS sent to: {}, Type: {}, Message: {}", phoneNumber, type, message);

        System.out.println(" SMS NOTIFICATION");
        System.out.println("To: " + phoneNumber);
        System.out.println("Type: " + type);
        System.out.println("Message: " + message);
        System.out.println("Reference ID: " + referenceId);
        System.out.println("  ");
    }
}
