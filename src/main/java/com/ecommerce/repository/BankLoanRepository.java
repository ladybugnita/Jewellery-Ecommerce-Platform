package com.ecommerce.repository;

import com.ecommerce.model.BankLoan;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BankLoanRepository extends MongoRepository<BankLoan, String> {
    List<BankLoan> findByStatus(String status);

    Optional<BankLoan> findByBankSerialNumber(String bankSerialNumber);

    @Query("{ 'bankSerialNumber': { $regex: ?0, $options: 'i' } }")
    List<BankLoan> searchByBankSerialNumber(String serialNumber);

    @Query("{ 'pledgedGoldItemIds': ?0 }")
    List<BankLoan> findByPledgedGoldItemId(String goldItemId);

    @Query("{ 'customerLoanIds': ?0 }")
    List<BankLoan> findByCustomerLoanId(String customerLoanId);

    @Query(value = "{ 'status': 'ACTIVE' }", fields = "{ 'outstandingAmount': 1 }")
    List<BankLoan> findAllActiveOutstandingAmounts();

    @Query("{ $or: [ " +
            "{ 'bankSerialNumber': { $regex: ?0, $options: 'i' } }, " +
            "{ 'bankName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'loanNumber': ?0 } ] }")
    List<BankLoan> searchLoans(String searchTerm);
}