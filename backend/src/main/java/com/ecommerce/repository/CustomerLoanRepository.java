package com.ecommerce.repository;

import com.ecommerce.model.CustomerLoan;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CustomerLoanRepository extends MongoRepository<CustomerLoan, String> {
    List<CustomerLoan> findByStatus(String status);
    List<CustomerLoan> findByCustomerId(String customerId);

    @Query("{ 'maturityDate':  { $lt:  ?0 }, 'status': 'ACTIVE' }")
    List<CustomerLoan> findExpiredLoans(LocalDateTime currentDate);
}
