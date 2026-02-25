package com.ecommerce.repository;

import com.ecommerce.model.Customer;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends MongoRepository<Customer, String> {
    Optional<Customer> findByEmail(String email);
    List<Customer> findByActiveTrue();
    Customer findByPhoneNumber(String phoneNumber);
}
