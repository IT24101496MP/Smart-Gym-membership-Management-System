package lk.fat2fit.Fat2Fit.DTO.Payment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MockPaymentConfirmRequest {
    private Integer clientId;
    private Integer planId;
    private String paymentReference;
}
