package lk.fat2fit.Fat2Fit.DTO.Payment;

import jakarta.validation.constraints.NotNull;
import lk.fat2fit.Fat2Fit.Entity.Enum.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecordMembershipPaymentRequest {

    @NotNull
    private Integer clientId;

    @NotNull
    private Integer membershipPlanId;

    @NotNull
    private BigDecimal paymentAmount;

    @NotNull
    private LocalDate paymentDate;

    @NotNull
    private PaymentMethod paymentMethod;

    private String referenceNumber;
}
