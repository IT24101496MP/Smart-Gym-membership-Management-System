package lk.fat2fit.Fat2Fit.DTO.Instructor;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class InstructorEmploymentAssignment {

    private String employmentType;
    private Integer workingHoursPerWeek;
    private BigDecimal salary;
    private Boolean isActive;
}
