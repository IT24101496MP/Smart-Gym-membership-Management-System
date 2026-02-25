package lk.fat2fit.Fat2Fit.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "Clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Client_id")
    private int clientId;

    @Column(name = "First_name", nullable = false)
    @NotBlank(message = "First name is required")
    private String firstName;

    @Column(name = "Last_name", nullable = false)
    @NotBlank(message = "Last name is required")
    private String lastName;

    @Column(name = "Age", nullable = false)
    @Min(value = 0, message = "Age cannot be negative")
    private int age;

    @Column(name = "Gender", nullable = false)
    @Pattern(
            regexp = "Male|Female|Prefer not to say",
            message = "Gender must be Male, Female, or Prefer not to say"
    )
    private String gender;

    @Column(name = "Mobile_number", nullable = false, unique = true)
    @Pattern(
            regexp = "0\\d{9}",
            message = "Mobile number must be a valid number"
    )
    private String mobileNumber;

    @Column(name = "Land_phone")
    @Pattern(
            regexp = "0\\d{9}",
            message = "Land phone must be a valid number",
            flags = Pattern.Flag.CASE_INSENSITIVE
    )
    private String landPhone;

    @Column(name = "Email", nullable = false, unique = true)
    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    private String email;

    @Column(name = "Address", nullable = false)
    @NotBlank(message = "Address is required")
    private String address;

    @Column(name = "Emergency_contact_name")
    private String emergencyContactName;

    @Column(name = "Emergency_contact_relationship")
    private String emergencyContactRelationship;

    @Column(name = "Emergency_contact_number")
    @Pattern(
            regexp = "0\\d{9}",
            message = "Emergency contact number must be a valid number"
    )
    private String emergencyContactNumber;

    @Column(name = "Blood_group")
    private String bloodGroup;

    @Lob
    @Column(name = "Profile_picture")
    private byte[] profilePicture;

    @Lob
    @Column(name = "Digital_signature")
    private byte[] digitalSignature;

    @Column(name = "Created_at")
    private LocalDateTime createdAt;

    @Column(name = "Updated_at")
    private LocalDateTime updatedAt;
}