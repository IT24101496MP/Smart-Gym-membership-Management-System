package lk.fat2fit.Fat2Fit.DTO.Manage;

import lk.fat2fit.Fat2Fit.Entity.Enum.FitnessGoal;
import lk.fat2fit.Fat2Fit.Entity.Enum.FitnessGoalStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class FitnessGoalResponse {

    private Long id;
    private Long clientId;

    private FitnessGoal goal;
    private String otherGoalSpecification;

    private String instructorRequirements;
    private boolean allowTargetWeightUpdate;
    private boolean allowTargetParametersUpdate;
    private boolean allowTargetDateUpdate;

    private BigDecimal targetWeightKg;
    private String targetParameters;
    private LocalDate targetCompletionDate;
    private Integer progressPercent;
    private String progressNotes;

    private FitnessGoalStatus status;
    private Boolean approvedByInstructor;

    private Integer assignedByUserId;
    private String assignedByRole;
    private LocalDateTime assignedAt;
    private LocalDateTime updatedAt;
}