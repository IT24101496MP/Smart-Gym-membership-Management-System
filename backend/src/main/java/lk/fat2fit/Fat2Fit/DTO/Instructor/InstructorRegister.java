package lk.fat2fit.Fat2Fit.DTO.Instructor;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InstructorRegister {
        private String firstName;
        private String lastName;
        private String phoneNumber;
        private String email;
        private String address;
        private String qualification;
        private int yearsOfExperience;
        private String areasOfSpecialization;
}
