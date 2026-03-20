package com.ecommerce.repository;

import com.ecommerce.model.AdminSettings;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AdminSettingsRepository extends MongoRepository<AdminSettings, String> {
    Optional<AdminSettings> findById(String id);
}
