package lk.fat2fit.Fat2Fit.DTO.Payment;

import java.math.BigDecimal;
import java.time.LocalDate;

import lk.fat2fit.Fat2Fit.Entity.Enum.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RecordMembershipPaymentResponse {
    private Long paymentId;
    private Long clientId;
    private String memberName;
    private Integer membershipPlanId;
    private String membershipPlanName;
    private BigDecimal paymentAmount;
    private LocalDate paymentDate;
    private PaymentMethod paymentMethod;
    private String referenceNumber;
    private Boolean receiptGenerated;
    private String receiptNumber;
    private Boolean emailSent;
    private String warningMessage;
    private String message;
}
