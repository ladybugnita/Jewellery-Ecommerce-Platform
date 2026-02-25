package com.ecommerce.repository;

import com.ecommerce.model.smsNotification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface SmsNotificationRepository extends MongoRepository<smsNotification, String> {
    List<smsNotification> findByStatus(String status);

    @Query("{ 'scheduledTime': { $lte: ?0 }, 'status': 'PENDING' }")
    List<smsNotification> findPendingSmsToSend(LocalDateTime currentTime);

    List<smsNotification> findByPhoneNumberAndTypeOrderByScheduledTimeDesc(String phoneNumber, String type);
}
