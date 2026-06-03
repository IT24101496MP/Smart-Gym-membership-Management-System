package lk.fat2fit.Fat2Fit.DTO.Manage;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class WorkoutScheduleResponse {

    private Long id;
    private Long clientId;
    private String clientName;

    private String trainingType;
    private String fitnessGoal;
    private String exercises;
    private Integer durationMinutes;
    private Integer frequencyPerWeek;
    private String specialInstructions;

    private Integer assignedByUserId;
    private String assignedByRole;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
