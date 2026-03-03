package com.ecommerce.controller;

import com.ecommerce.dto.*;
import com.ecommerce.model.*;
import com.ecommerce.repository.CustomerRepository;
import com.ecommerce.repository.GoldItemRepository;
import com.ecommerce.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.ecommerce.service.GoldItemService;
import com.ecommerce.dto.UserRoleResponse;

import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final DashboardService dashboardService;
    private final CustomerLoanService customerLoanService;
    private final BankLoanService bankLoanService;
    private final UserService userService;
    private final CustomerRepository customerRepository;
    private final GoldItemRepository goldItemRepository;
    private final GoldItemService goldItemService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        DashboardResponse metrics = dashboardService.getDashboardMetrics();
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }
    @PostMapping("/dashboard/snapshot")
    public ResponseEntity<ApiResponse<DashboardSummary>> saveDashboardSnapshot() {
        DashboardSummary summary = dashboardService.saveDashboardSnapshot();
        return ResponseEntity.ok(ApiResponse.success("Dashboard snapshot saved", summary));
    }

    @PostMapping("/customer-loans")
    public ResponseEntity<ApiResponse<CustomerLoan>> createCustomerLoan(
            @Valid @RequestBody CustomerLoanRequest request){
        CustomerLoan loan = customerLoanService.createLoan(request);
        return new ResponseEntity<>(ApiResponse.success("Loan created successfully", loan), HttpStatus.CREATED);
    }

    @GetMapping("/customer-loans")
    public ResponseEntity<ApiResponse<List<CustomerLoan>>> getAllCustomerLoans() {
        List<CustomerLoan> loans = customerLoanService.getAllActiveLoans();
        return ResponseEntity.ok(ApiResponse.success(loans));
    }
    @GetMapping("/customer-loans/{id}")
    public ResponseEntity<ApiResponse<CustomerLoan>> getCustomerLoanById(@PathVariable String id) {
        CustomerLoan loan = customerLoanService.getLoanById(id);
        return ResponseEntity.ok(ApiResponse.success(loan));
    }
    @GetMapping("/customer-loans/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<CustomerLoan>>> getLoansByCustomer(
            @PathVariable String customerId) {
        List<CustomerLoan> loans = customerLoanService.getCustomerLoans(customerId);
        return ResponseEntity.ok(ApiResponse.success(loans));
    }
    @PostMapping("/customer-loans/{id}/repayment")
    public ResponseEntity<ApiResponse<CustomerLoan>> processCustomerRepayment(
            @PathVariable String id, @RequestParam Double amount){
        CustomerLoan loan = customerLoanService.processRepayment(id, amount);
        return ResponseEntity.ok(ApiResponse.success("Repayment processed successfully", loan));
    }
    @GetMapping("/customer-loans/expired")
    public ResponseEntity<ApiResponse<List<CustomerLoan>>> getExpiredLoans() {
        List<CustomerLoan> expiredLoans = customerLoanService.getExpiredLoans();
        return ResponseEntity.ok(ApiResponse.success(expiredLoans));
    }
    @PostMapping("/bank-loans")
    public ResponseEntity<ApiResponse<BankLoan>> createBankLoan(
            @Valid @RequestBody BankLoanRequest request) {
        BankLoan loan = bankLoanService.createBankLoan(request);
        return new ResponseEntity<>(ApiResponse.success("Bank loan created successfully", loan), HttpStatus.CREATED);
    }

    @GetMapping("/bank-loans")
    public ResponseEntity<ApiResponse<List<BankLoan>>> getAllBankLoans() {
        List<BankLoan> loans = bankLoanService.getAllActiveBankLoans();
        return ResponseEntity.ok(ApiResponse.success(loans));
    }
    @GetMapping("/bank-loans/{id}")
    public ResponseEntity<ApiResponse<BankLoan>> getBankLoanById(@PathVariable String id) {
        BankLoan loan = bankLoanService.getBankLoanById(id);
        return ResponseEntity.ok(ApiResponse.success(loan));
    }

    @PostMapping("/bank-loans/{id}/payment")
    public ResponseEntity<ApiResponse<BankLoan>> processBankPayment(
            @PathVariable String id, @RequestParam Double amount){
        BankLoan loan = bankLoanService.processBankPayment(id, amount);
        return ResponseEntity.ok(ApiResponse.success("Bank payment processed successfully", loan));
    }
    @GetMapping("/customers")
    public ResponseEntity<ApiResponse<List<Customer>>> getAllCustomers(){
        List<Customer> customers = customerRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(customers));
    }
    @GetMapping("/customers/{id}")
    public ResponseEntity<ApiResponse<Customer>> getCustomerById(@PathVariable String id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return ResponseEntity.ok(ApiResponse.success(customer));
    }
    @PostMapping("/customers")
    public ResponseEntity<ApiResponse<Customer>> createCustomer(@Valid @RequestBody Customer customer){
        customer.setRole("CUSTOMER");
        Customer savedCustomer = userService.createCustomer(customer);
        return new ResponseEntity<>(ApiResponse.success("Customer created successfully", savedCustomer), HttpStatus.CREATED);
    }
    @PutMapping("/customers/{id}")
    public ResponseEntity<ApiResponse<Customer>> updateCustomer(
            @PathVariable String id, @Valid @RequestBody Customer customer) {
        Customer updatedCustomer = customerRepository.findById(id)
                .map(existing -> {
                    existing.setFullName(customer.getFullName());
                    existing.setEmail(customer.getEmail());
                    existing.setPhoneNumber(customer.getPhoneNumber());
                    existing.setAddress(customer.getAddress());
                    existing.setOccupation(customer.getOccupation());
                    existing.setAnnualIncome(customer.getAnnualIncome());
                    return customerRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return ResponseEntity.ok(ApiResponse.success("Customer updated successfully", updatedCustomer));
    }
    @GetMapping("/gold-items")
    public ResponseEntity<ApiResponse<List<GoldItem>>> getAllGoldItems() {
        List<GoldItem> items = goldItemRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(items));
    }
    @GetMapping("/gold-items/available")
    public ResponseEntity<ApiResponse<List<GoldItem>>> getAvailableGoldItems() {
        List<GoldItem> items = goldItemRepository.findByStatus("AVAILABLE");
        return ResponseEntity.ok(ApiResponse.success(items));
    }
    @GetMapping("/gold-items/pledged")
    public ResponseEntity<ApiResponse<List<GoldItem>>> getPledgedGoldItems() {
        List<GoldItem> items = goldItemRepository.findByStatus("PLEDGED");
        return ResponseEntity.ok(ApiResponse.success(items));
    }
    @PostMapping("/gold-items")
    public ResponseEntity<ApiResponse<GoldItem>> addGoldItem(@Valid @RequestBody GoldItem goldItem) {
        goldItem.setStatus("AVAILABLE");
        goldItem.setCreatedAt(LocalDateTime.now());
        GoldItem savedItem = goldItemRepository.save(goldItem);
        return new ResponseEntity<>(ApiResponse.success("Gold item added successfully", savedItem), HttpStatus.CREATED);
    }
    @PutMapping("/gold-items/{id}")
    public ResponseEntity<ApiResponse<GoldItem>> updateGoldItem(
            @PathVariable String id, @Valid @RequestBody GoldItem goldItem) {
        GoldItem updatedItem = goldItemRepository.findById(id)
                .map(existing -> {
                    existing.setItemType(goldItem.getItemType());
                    existing.setWeightInGrams(goldItem.getWeightInGrams());
                    existing.setPurity(goldItem.getPurity());
                    existing.setDescription(goldItem.getDescription());
                    existing.setEstimatedValue(goldItem.getEstimatedValue());
                    return goldItemRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Gold item not found"));
        return ResponseEntity.ok(ApiResponse.success("Gold item updated successfully", updatedItem));
    }
    @GetMapping("/customer-loans/search")
    public ResponseEntity<ApiResponse<List<CustomerLoan>>> searchCustomerLoans(
            @RequestParam(required = false) String serialNumber,
            @RequestParam(required = false) String searchTerm) {

        List<CustomerLoan> loans;
        if (serialNumber != null && !serialNumber.isEmpty()) {
            loans = customerLoanService.searchLoansBySerialNumber(serialNumber);
        } else if (searchTerm != null && !searchTerm.isEmpty()) {
            loans = customerLoanService.searchLoans(searchTerm);
        } else {
            loans = customerLoanService.getAllActiveLoans();
        }

        return ResponseEntity.ok(ApiResponse.success(loans));
    }

    @GetMapping("/customer-loans/serial/{serialNumber}")
    public ResponseEntity<ApiResponse<CustomerLoan>> getCustomerLoanBySerialNumber(
            @PathVariable String serialNumber) {
        CustomerLoan loan = customerLoanService.getLoanByCustomerSerialNumber(serialNumber);
        return ResponseEntity.ok(ApiResponse.success(loan));
    }

    @GetMapping("/bank-loans/search")
    public ResponseEntity<ApiResponse<List<BankLoan>>> searchBankLoans(
            @RequestParam(required = false) String serialNumber,
            @RequestParam(required = false) String searchTerm) {

        List<BankLoan> loans;
        if (serialNumber != null && !serialNumber.isEmpty()) {
            loans = bankLoanService.searchBankLoansBySerialNumber(serialNumber);
        } else if (searchTerm != null && !searchTerm.isEmpty()) {
            loans = bankLoanService.searchBankLoans(searchTerm);
        } else {
            loans = bankLoanService.getAllActiveBankLoans();
        }

        return ResponseEntity.ok(ApiResponse.success(loans));
    }

    @GetMapping("/bank-loans/serial/{serialNumber}")
    public ResponseEntity<ApiResponse<BankLoan>> getBankLoanBySerialNumber(
            @PathVariable String serialNumber) {
        BankLoan loan = bankLoanService.getBankLoanBySerialNumber(serialNumber);
        return ResponseEntity.ok(ApiResponse.success(loan));
    }

    @GetMapping("/gold-items/{id}/details")
    public ResponseEntity<ApiResponse<GoldItemDetailResponse>> getGoldItemDetails(
            @PathVariable String id) {
        GoldItemDetailResponse details = goldItemService.getGoldItemDetails(id);
        return ResponseEntity.ok(ApiResponse.success(details));
    }

    @GetMapping("/gold-items/customer/{customerId}/available")
    public ResponseEntity<ApiResponse<List<GoldItem>>> getAvailableGoldItemsByCustomer(
            @PathVariable String customerId) {
        List<GoldItem> items = goldItemService.getAvailableGoldItemsByCustomer(customerId);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/gold-items/customer/{customerId}/pledged")
    public ResponseEntity<ApiResponse<List<GoldItem>>> getPledgedGoldItemsByCustomer(
            @PathVariable String customerId) {
        List<GoldItem> items = goldItemService.getPledgedItemsByCustomer(customerId);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/bank-loans/customer-loan/{customerLoanId}")
    public ResponseEntity<ApiResponse<List<BankLoan>>> getBankLoansByCustomerLoan(
            @PathVariable String customerLoanId) {
        List<BankLoan> loans = bankLoanService.getBankLoansByCustomerLoanId(customerLoanId);
        return ResponseEntity.ok(ApiResponse.success(loans));
    }

    @PostMapping("/customer-loans/bulk")
    public ResponseEntity<ApiResponse<List<CustomerLoan>>> createBulkCustomerLoans(
            @Valid @RequestBody List<CustomerLoanRequest> requests) {
        List<CustomerLoan> loans = new ArrayList<>();
        for (CustomerLoanRequest request : requests) {
            request.setIsBulkLoan(true);
            loans.add(customerLoanService.createLoan(request));
        }
        return new ResponseEntity<>(ApiResponse.success("Bulk loans created successfully", loans),
                HttpStatus.CREATED);
    }
    @GetMapping("/gold-items/available-for-bank")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAvailableGoldItemsForBank() {
        List<Map<String, Object>> items = goldItemService.getAvailableGoldItemsForBank();
        return ResponseEntity.ok(ApiResponse.success(items));
    }
}
