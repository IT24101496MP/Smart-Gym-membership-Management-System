package lk.fat2fit.Fat2Fit.DTO.Manage;

import lombok.Data;

@Data
public class WorkoutScheduleRequest {

    private String trainingType;
    private String fitnessGoal;
    private String exercises;
    private Integer durationMinutes;
    private Integer frequencyPerWeek;
    private String specialInstructions;
}
