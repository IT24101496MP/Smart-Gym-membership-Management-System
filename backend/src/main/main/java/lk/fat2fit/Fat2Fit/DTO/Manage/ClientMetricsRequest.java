package lk.fat2fit.Fat2Fit.DTO.Manage;

import lk.fat2fit.Fat2Fit.Entity.Enum.FitnessGoal;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Set;

/**
 * Request body for creating or updating a client's body metrics.
 * Used by ADMIN and INSTRUCTOR.
 */
@Data
public class ClientMetricsRequest {

    private BigDecimal weightKg;
    private BigDecimal heightCm;
    private BigDecimal hipSizeCm;
    private BigDecimal breastSizeCm;
    private BigDecimal waistSizeCm;
    private BigDecimal armSizeCm;
    private BigDecimal shoulderSizeCm;
    private BigDecimal buttSizeCm;

    private Set<FitnessGoal> fitnessGoals;

    /** Required when fitnessGoals contains OTHERS */
    private String otherGoalSpecification;
}
