package lk.fat2fit.Fat2Fit.DTO.Manage;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.Data;

/**
 * Request body for recording client body measurements.
 */
@Data
public class ClientMetricsRequest {

    private BigDecimal heightCm;
    private BigDecimal weightKg;
    private BigDecimal waistCm;
    private BigDecimal hipCm;
    private BigDecimal armCm;
    private BigDecimal shoulderCm;
    private BigDecimal breastCm;
    private BigDecimal buttocksCm;
    private LocalDate measurementDate;
}
