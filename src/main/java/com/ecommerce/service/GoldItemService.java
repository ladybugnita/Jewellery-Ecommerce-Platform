package com.ecommerce.service;

import com.ecommerce.dto.GoldItemDetailResponse;
import com.ecommerce.model.GoldItem;
import com.ecommerce.repository.BankLoanRepository;
import com.ecommerce.repository.CustomerLoanRepository;
import com.ecommerce.repository.CustomerRepository;
import com.ecommerce.repository.GoldItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoldItemService {

    private final GoldItemRepository goldItemRepository;
    private final CustomerRepository customerRepository;
    private final CustomerLoanRepository customerLoanRepository;
    private final BankLoanRepository bankLoanRepository;

    public GoldItemDetailResponse getGoldItemDetails(String goldItemId) {
        GoldItem goldItem = goldItemRepository.findById(goldItemId)
                .orElseThrow(() -> new RuntimeException("Gold item not found"));

        GoldItemDetailResponse.GoldItemDetailResponseBuilder builder = GoldItemDetailResponse.builder()
                .id(goldItem.getId())
                .itemType(goldItem.getItemType())
                .weightInGrams(goldItem.getWeightInGrams())
                .purity(goldItem.getPurity())
                .description(goldItem.getDescription())
                .estimatedValue(goldItem.getEstimatedValue())
                .status(goldItem.getStatus())
                .imageUrl(goldItem.getImageUrl())
                .serialNumber(goldItem.getSerialNumber())
                .customerId(goldItem.getCustomerId());

        if (goldItem.getBillAttachments() != null) {
            builder.billAttachments(goldItem.getBillAttachments());
        }

        customerRepository.findById(goldItem.getCustomerId()).ifPresent(customer -> {
            builder.customerName(customer.getFullName());
        });

        if (goldItem.getCustomerLoanId() != null) {
            customerLoanRepository.findById(goldItem.getCustomerLoanId()).ifPresent(loan -> {
                builder.customerLoanId(loan.getId());
                builder.customerSerialNumber(loan.getCustomerSerialNumber());
            });
        }

        if (goldItem.getBankLoanId() != null) {
            bankLoanRepository.findById(goldItem.getBankLoanId()).ifPresent(loan -> {
                builder.bankLoanId(loan.getId());
                builder.bankSerialNumber(loan.getBankSerialNumber());
            });
        }

        return builder.build();
    }

    public List<GoldItemDetailResponse> getGoldItemsByCustomer(String customerId) {
        return goldItemRepository.findByCustomerId(customerId).stream()
                .map(item -> getGoldItemDetails(item.getId()))
                .collect(Collectors.toList());
    }

    public List<GoldItem> getAvailableGoldItemsByCustomer(String customerId) {
        return goldItemRepository.findAvailableByCustomerId(customerId);
    }

    public List<GoldItem> getPledgedItemsByCustomer(String customerId) {
        return goldItemRepository.findPledgedItemsByCustomerId(customerId);
    }

    public List<GoldItem> getGoldItemsByCustomerId(String customerId) {
        return goldItemRepository.findByCustomerId(customerId);
    }

    public GoldItem getGoldItemById(String itemId) {
        return goldItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Gold item not found with id: " + itemId));
    }
    public List<Map<String, Object>> getAvailableGoldItemsForBank() {
        List<GoldItem> pledgedItems = goldItemRepository.findByStatus("PLEDGED");

        return pledgedItems.stream()
                .map(item -> {
                    Map<String, Object> itemMap = new HashMap<>();
                    itemMap.put("id", item.getId());
                    itemMap.put("itemType", item.getItemType());
                    itemMap.put("weightInGrams", item.getWeightInGrams());
                    itemMap.put("purity", item.getPurity());
                    itemMap.put("estimatedValue", item.getEstimatedValue());
                    itemMap.put("serialNumber", item.getSerialNumber());
                    itemMap.put("customerId", item.getCustomerId());
                    itemMap.put("customerLoanId", item.getCustomerLoanId());
                    itemMap.put("imageUrl", item.getImageUrl());

                    customerRepository.findById(item.getCustomerId()).ifPresent(customer -> {
                        itemMap.put("customerName", customer.getFullName());
                    });

                    if (item.getCustomerLoanId() != null) {
                        customerLoanRepository.findById(item.getCustomerLoanId()).ifPresent(loan -> {
                            itemMap.put("customerSerialNumber", loan.getCustomerSerialNumber());
                            itemMap.put("customerLoanNumber", loan.getLoanNumber());
                        });
                    }

                    return itemMap;
                })
                .collect(Collectors.toList());
    }
}