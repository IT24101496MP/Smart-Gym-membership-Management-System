package lk.fat2fit.Fat2Fit.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientRegister {

    private String firstName;
    private String lastName;
    private int age;
    private String gender;
    private String mobileNumber;
    private String landPhone;
    private String address;

    private String emergencyContactName;
    private String emergencyContactRelationship;
    private String emergencyContactNumber;

    private String bloodGroup;
    private byte[] profilePicture;
    private byte[] digitalSignature;
}
