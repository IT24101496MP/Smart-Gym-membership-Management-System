package lk.fat2fit.Fat2Fit.DTO.Manage;

import java.time.LocalDate;

import lk.fat2fit.Fat2Fit.Entity.Enum.Gender;
import lombok.Data;

@Data
public class UserEditRequest {
    private String firstName;
    private String lastName;
    private Integer age;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String email;
    private String phoneNumber;
    private String landPhone;
    private String emergencyContactName;
    private String emergencyContactRelationship;
    private String emergencyContactNumber;
    private String bloodGroup;
    private String address;
    private Boolean isActive;
    private Integer membershipPlanId;
    private LocalDate membershipStartDate;
}
