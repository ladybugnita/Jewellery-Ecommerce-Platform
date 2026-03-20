package com.ecommerce.utils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;

public class DateUtil {

    public static String convertToNepaliDate(LocalDateTime date) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(java.sql.Timestamp.valueOf(date));

        int year = cal.get(Calendar.YEAR);
        int month = cal.get(Calendar.MONTH) + 1;
        int day = cal.get(Calendar.DAY_OF_MONTH);

        int nepaliYear = year + 57;

        return String.format("%d/%02d/%02d (BS)", nepaliYear, month, day);
    }

    public static Map<String, String> getFormattedDates(LocalDateTime date) {
        Map<String, String> dates = new HashMap<>();

        DateTimeFormatter englishFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        dates.put("english", date.format(englishFormatter) + " (AD)");

        dates.put("nepali", convertToNepaliDate(date));

        return dates;
    }

    public static long getDaysBetween(LocalDateTime start, LocalDateTime end) {
        return java.time.Duration.between(start, end).toDays();
    }

    public static long getMonthsBetween(LocalDateTime start, LocalDateTime end) {
        return java.time.temporal.ChronoUnit.MONTHS.between(start, end);
    }
}