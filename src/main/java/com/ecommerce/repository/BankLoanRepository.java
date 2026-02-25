package com.ecommerce.repository;

import com.ecommerce.model.BankLoan;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BankLoanRepository extends MongoRepository<BankLoan, String> {
    List<BankLoan> findByStatus(String status);

    @Query(value = "{ 'status': 'ACTIVE' }", fields = "{ 'outstandingAmount': 1 }")
    List<BankLoan> findAllActiveOutstandingAmounts();
}
