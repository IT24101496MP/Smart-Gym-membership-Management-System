package lk.fat2fit.Fat2Fit.DTO.Manage;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthScreeningResponse {
    private Long screeningId;
    private Long clientId;

    private boolean cardiacConditions;
    private boolean respiratoryIssues;
    private boolean faintingOrBalanceProblems;
    private boolean jointOrMuscleDisorders;
    private boolean highBloodPressure;
    private boolean cholesterolLevels;
    private boolean currentMedications;
    private boolean disabilitiesOrPhysicalLimitations;

    private String additionalNotes;
    private boolean highRisk;
    private boolean memberHighRisk;
    private LocalDateTime recordedAt;
}
