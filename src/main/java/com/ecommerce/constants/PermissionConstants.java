package com.ecommerce.constants;

public class PermissionConstants {

    public static final String VIEW_CUSTOMERS = "VIEW_CUSTOMERS";
    public static final String CREATE_CUSTOMERS = "CREATE_CUSTOMERS";
    public static final String EDIT_CUSTOMERS = "EDIT_CUSTOMERS";
    public static final String DELETE_CUSTOMERS = "DELETE_CUSTOMERS";

    public static final String VIEW_LOANS = "VIEW_LOANS";
    public static final String CREATE_LOANS = "CREATE_LOANS";
    public static final String APPROVE_LOANS = "APPROVE_LOANS";
    public static final String PROCESS_PAYMENTS = "PROCESS_PAYMENTS";

    public static final String VIEW_GOLD_ITEMS = "VIEW_GOLD_ITEMS";
    public static final String ADD_GOLD_ITEMS = "ADD_GOLD_ITEMS";
    public static final String EDIT_GOLD_ITEMS = "EDIT_GOLD_ITEMS";

    public static final String VIEW_REPORTS = "VIEW_REPORTS";
    public static final String EXPORT_REPORTS = "EXPORT_REPORTS";

    public static final String VIEW_USERS = "VIEW_USERS";
    public static final String CREATE_USERS = "CREATE_USERS";
    public static final String EDIT_USERS = "EDIT_USERS";
    public static final String DELETE_USERS = "DELETE_USERS";

    public static final String VIEW_DASHBOARD = "VIEW_DASHBOARD";

    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_STAFF = "STAFF";
    public static final String ROLE_USER = "USER";

    public static final String[] ADMIN_PERMISSIONS = {
            VIEW_CUSTOMERS, CREATE_CUSTOMERS, EDIT_CUSTOMERS, DELETE_CUSTOMERS,
            VIEW_LOANS, CREATE_LOANS, APPROVE_LOANS, PROCESS_PAYMENTS,
            VIEW_GOLD_ITEMS, ADD_GOLD_ITEMS, EDIT_GOLD_ITEMS,
            VIEW_REPORTS, EXPORT_REPORTS,
            VIEW_USERS, CREATE_USERS, EDIT_USERS, DELETE_USERS,
            VIEW_DASHBOARD
    };

    public static final String[] STAFF_PERMISSIONS = {
            VIEW_CUSTOMERS, CREATE_CUSTOMERS, EDIT_CUSTOMERS,
            VIEW_LOANS, CREATE_LOANS, PROCESS_PAYMENTS,
            VIEW_GOLD_ITEMS, ADD_GOLD_ITEMS,
            VIEW_REPORTS,
            VIEW_DASHBOARD
    };

    public static final String[] USER_PERMISSIONS = {
            VIEW_CUSTOMERS,
            VIEW_LOANS,
            VIEW_GOLD_ITEMS,
            VIEW_DASHBOARD
    };
}