package lk.fat2fit.Fat2Fit.DTO.Client;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClientRegister {

    private String firstName;
    private String lastName;
    private int age;
    private String gender;
    private String mobileNumber;
    private String landPhone;
    private String email;
    private String address;

    private String emergencyContactName;
    private String emergencyContactRelationship;
    private String emergencyContactNumber;

    private String bloodGroup;
    private byte[] image;
    private byte[] digitalSignature;
}
