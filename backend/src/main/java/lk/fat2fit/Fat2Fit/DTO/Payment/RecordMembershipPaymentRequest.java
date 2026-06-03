package lk.fat2fit.Fat2Fit.DTO.Payment;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lk.fat2fit.Fat2Fit.Entity.Enum.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecordMembershipPaymentRequest {

    @NotNull(message = "Client ID is required.")
    private Long clientId;

    @NotNull(message = "Membership plan ID is required.")
    private Integer membershipPlanId;

    @NotNull(message = "Payment amount is required.")
    @DecimalMin(value = "0.01", message = "Payment amount must be greater than zero.")
    private BigDecimal paymentAmount;

    @NotNull(message = "Payment date is required.")
    private LocalDate paymentDate;

    @NotNull(message = "Payment method is required.")
    private PaymentMethod paymentMethod;

    private String referenceNumber;
}
