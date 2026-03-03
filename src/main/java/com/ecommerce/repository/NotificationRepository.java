package com.ecommerce.repository;

import com.ecommerce.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Notification> findByRoleAndIsReadFalseOrderByCreatedAtDesc(String role);
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(String userId);
    Long countByUserIdAndIsReadFalse(String userId);
    Long countByRoleAndIsReadFalse(String role);

    @Query("{ 'referenceId': ?0, 'type': ?1 }")
    List<Notification> findByReferenceIdAndType(String referenceId, String type);
}