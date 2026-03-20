package lk.fat2fit.Fat2Fit.DTO;

import lk.fat2fit.Fat2Fit.Entity.Enum.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientRegister {

    private String firstName;
    private String lastName;
    private int age;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String email;
    private String phoneNumber;
    private String landPhone;
    private String address;
    private String password;

    private String emergencyContactName;
    private String emergencyContactRelationship;
    private String emergencyContactNumber;

    private String bloodGroup;
    private byte[] profilePicture;
    private byte[] digitalSignature;
}
