package lk.fat2fit.Fat2Fit.DTO.Instructor;

import lk.fat2fit.Fat2Fit.Entity.Enum.Gender;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InstructorRegister {
    private String firstName;
    private String lastName;
    private int age;
    private Date dateOfBirth;
    private Gender gender;
    private String phoneNumber;
    private String landPhone;
    private String email;
    private String address;
    private String password;
    private String qualification;
    private Integer yearsOfExperience;
    private String areasOfSpecialization;
}
