package com.campusbazaar.service;

import com.campusbazaar.exception.BadRequestException;
import java.math.BigDecimal;
import java.math.RoundingMode;

public final class StudentDiscountPricing {

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2);
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private StudentDiscountPricing() {}

    public static BigDecimal discountPercentage(BigDecimal originalPrice, BigDecimal discountedPrice) {
        validate(originalPrice, discountedPrice);
        return originalPrice.subtract(discountedPrice)
                .multiply(HUNDRED)
                .divide(originalPrice, 2, RoundingMode.HALF_UP);
    }

    public static BigDecimal amountSaved(BigDecimal originalPrice, BigDecimal discountedPrice) {
        validate(originalPrice, discountedPrice);
        return originalPrice.subtract(discountedPrice).setScale(2, RoundingMode.UNNECESSARY);
    }

    public static void validate(BigDecimal originalPrice, BigDecimal discountedPrice) {
        if (originalPrice == null || originalPrice.compareTo(ZERO) <= 0) {
            throw new BadRequestException("A student discount requires an original price greater than zero.");
        }
        if (discountedPrice == null || discountedPrice.compareTo(ZERO) <= 0) {
            throw new BadRequestException("Student discounted price must be greater than zero.");
        }
        if (discountedPrice.compareTo(originalPrice) >= 0) {
            throw new BadRequestException("Student discounted price must be lower than the original price.");
        }
        if (originalPrice.scale() > 2 || discountedPrice.scale() > 2
                || originalPrice.precision() - originalPrice.scale() > 8
                || discountedPrice.precision() - discountedPrice.scale() > 8) {
            throw new BadRequestException("Prices must use up to 8 whole digits and 2 decimal places.");
        }
    }
}
