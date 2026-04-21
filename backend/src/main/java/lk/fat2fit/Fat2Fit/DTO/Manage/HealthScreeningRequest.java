package lk.fat2fit.Fat2Fit.DTO.Manage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthScreeningRequest {
    private Boolean cardiacConditions;
    private Boolean respiratoryIssues;
    private Boolean faintingOrBalanceProblems;
    private Boolean jointOrMuscleDisorders;
    private Boolean highBloodPressure;
    private Boolean cholesterolLevels;
    private Boolean currentMedications;
    private Boolean disabilitiesOrPhysicalLimitations;
    private String additionalNotes;
}
