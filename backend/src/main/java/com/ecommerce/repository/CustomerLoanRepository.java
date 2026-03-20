package com.ecommerce.repository;

import com.ecommerce.model.CustomerLoan;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerLoanRepository extends MongoRepository<CustomerLoan, String> {
    List<CustomerLoan> findByStatus(String status);
    List<CustomerLoan> findByCustomerId(String customerId);

    Optional<CustomerLoan> findByCustomerSerialNumber(String customerSerialNumber);

    @Query("{ 'customerSerialNumber' :  { $regex:  ?0, $options: 'i' } }")
    List<CustomerLoan> searchByCustomerSerialNumber(String serialNumber);

    @Query("{ 'goldItemIds': ?0 }")
    List<CustomerLoan> findByGoldItemId(String goldItemId);

    List<CustomerLoan> findByIsBulkLoan(Boolean isBulkLoan);

    @Query("{ 'maturityDate':  { $lt:  ?0 }, 'status': 'ACTIVE' }")
    List<CustomerLoan> findExpiredLoans(LocalDateTime currentDate);

    @Query("{ $or: [ " +
           "{ 'customerSerialNumber': { $regex: ?0, $options: 'i' } }," +
           "{ 'customerId': ?0 }, " +
           "{ 'loanNumber': ?0 } ] }")
    List<CustomerLoan> searchLoans(String searchTerm);
    Long countByStatus(String status);
}
