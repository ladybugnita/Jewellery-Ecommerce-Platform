package com.ecommerce.repository;

import com.ecommerce.model.GoldItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface GoldItemRepository extends MongoRepository<GoldItem, String> {
    List<GoldItem> findByCustomerId(String customerId);
    List<GoldItem> findByStatus(String status);
    List<GoldItem> findByCustomerIdAndStatus(String customerId, String status);
}
