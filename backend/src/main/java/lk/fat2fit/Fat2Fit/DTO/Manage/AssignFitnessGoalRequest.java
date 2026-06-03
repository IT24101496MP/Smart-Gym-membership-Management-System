package lk.fat2fit.Fat2Fit.DTO.Manage;

import lk.fat2fit.Fat2Fit.Entity.Enum.FitnessGoal;
import lk.fat2fit.Fat2Fit.Entity.Enum.FitnessGoalStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AssignFitnessGoalRequest {

    private FitnessGoal goal;
    private String otherGoalSpecification;
    private String instructorRequirements;

    private Boolean allowTargetWeightUpdate;
    private Boolean allowTargetParametersUpdate;
    private Boolean allowTargetDateUpdate;

    private BigDecimal targetWeightKg;
    private String targetParameters;
    private LocalDate targetCompletionDate;

    private Integer progressPercent;
    private String progressNotes;

    private FitnessGoalStatus status;
}