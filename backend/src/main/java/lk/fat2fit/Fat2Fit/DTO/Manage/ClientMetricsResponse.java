package lk.fat2fit.Fat2Fit.DTO.Manage;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response body for a recorded client body measurement.
 */
@Data
@Builder
public class ClientMetricsResponse {

    private Long measurementId;
    private Long clientId;

    private BigDecimal heightCm;
    private BigDecimal weightKg;
    private BigDecimal waistCm;
    private BigDecimal hipCm;
    private BigDecimal armCm;
    private BigDecimal shoulderCm;
    private BigDecimal breastCm;
    private BigDecimal buttocksCm;

    private LocalDate measurementDate;
    private BigDecimal bmi;
    private LocalDateTime recordedAt;
}
