package com.ecommerce.repository;

import com.ecommerce.model.GoldItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.util.List;
import java.util.Optional;

public interface GoldItemRepository extends MongoRepository<GoldItem, String> {
    List<GoldItem> findByCustomerId(String customerId);
    List<GoldItem> findByStatus(String status);
    List<GoldItem> findByCustomerIdAndStatus(String customerId, String status);

    Optional<GoldItem> findBySerialNumber(String serialNumber);
    List<GoldItem> findByCustomerLoanId(String customerLoanId);
    List<GoldItem> findByBankLoanId(String bankLoanId);
    @Query("{ 'customerId': ?0, 'status': 'AVAILABLE' }")
    List<GoldItem> findAvailableByCustomerId(String customerId);

    @Query("{ $and:  [ "+
           "{ 'customerId': ?0 }," +
           "{ 'status':  { $in: ['PLEDGED', 'PLEDGED_TO_BANK'] } } ] }")
    List<GoldItem> findPledgedItemsByCustomerId(String customerId);
}
