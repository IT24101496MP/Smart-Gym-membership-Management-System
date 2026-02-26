package lk.fat2fit.Fat2Fit.DTO.Instructor;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InstructorRegister {
        private String firstName;
        private String lastName;
        private String phoneNumber;
        private String email;
        private String address;
        private String qualification;
        private Integer yearsOfExperience;
        private String areasOfSpecialization;
        private String password;
}
