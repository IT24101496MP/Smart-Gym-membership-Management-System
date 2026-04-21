package lk.fat2fit.Fat2Fit.DTO.Manage;

import lk.fat2fit.Fat2Fit.Entity.Enum.FitnessGoalStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateMyFitnessGoalRequest {

    private FitnessGoalStatus status;
    private BigDecimal targetWeightKg;
    private String targetParameters;
    private LocalDate targetCompletionDate;
    private Integer progressPercent;
    private String progressNotes;
}