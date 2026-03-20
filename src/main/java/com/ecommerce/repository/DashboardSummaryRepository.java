package com.ecommerce.repository;

import com.ecommerce.model.DashboardSummary;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDateTime;
import java.util.Optional;

public interface DashboardSummaryRepository extends MongoRepository<DashboardSummary, String> {
    Optional<DashboardSummary> findFirstByOrderBySummaryDateDesc();
    Optional<DashboardSummary> findBySummaryDate(LocalDateTime date);
}
