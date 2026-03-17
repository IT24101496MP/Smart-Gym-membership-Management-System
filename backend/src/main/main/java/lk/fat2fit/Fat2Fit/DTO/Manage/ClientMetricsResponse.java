package lk.fat2fit.Fat2Fit.DTO.Manage;

import lk.fat2fit.Fat2Fit.Entity.Enum.FitnessGoal;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * Response body for a client's body metrics.
 */
@Data
@Builder
public class ClientMetricsResponse {

    private int clientId;

    private BigDecimal weightKg;
    private BigDecimal heightCm;
    private BigDecimal hipSizeCm;
    private BigDecimal breastSizeCm;
    private BigDecimal waistSizeCm;
    private BigDecimal armSizeCm;
    private BigDecimal shoulderSizeCm;
    private BigDecimal buttSizeCm;

    private Set<FitnessGoal> fitnessGoals;
    private String otherGoalSpecification;

    private LocalDateTime updatedAt;
}
