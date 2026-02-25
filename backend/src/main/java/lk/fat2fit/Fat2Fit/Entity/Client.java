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
@Table(name = "client")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "client_id")
    private int clientId;

    @Column(name = "first_name", nullable = false)
    @NotBlank(message = "First name is required")
    private String firstName;

    @Column(name = "last_name", nullable = false)
    @NotBlank(message = "Last name is required")
    private String lastName;

    @Column(name = "age", nullable = false)
    @Min(value = 0, message = "Age cannot be negative")
    private int age;

    @Column(name = "gender", nullable = false)
    @Pattern(
            regexp = "Male|Female|Prefer not to say",
            message = "Gender must be Male, Female, or Prefer not to say"
    )
    private String gender;

    @Column(name = "mobile_number", nullable = false, unique = true)
    @Pattern(
            regexp = "0\\d{9}",
            message = "Contact number must be a valid number"
    )
    private String mobileNumber;

    @Column(name = "land_phone")
    @Pattern(
            regexp = "0\\d{9}",
            message = "Land phone must be a valid number",
            flags = Pattern.Flag.CASE_INSENSITIVE
    )
    private String landPhone;

    @Column(name = "email", nullable = false, unique = true)
    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    private String email;

    @Column(name = "address", nullable = false)
    @NotBlank(message = "Address is required")
    private String address;

    @Column(name = "emergency_contact_name")
    private String emergencyContactName;

    @Column(name = "emergency_contact_relationship")
    private String emergencyContactRelationship;

    @Column(name = "emergency_contact_number")
    @Pattern(
            regexp = "0\\d{9}",
            message = "Emergency contact phone must be a valid number"
    )
    private String emergencyContactNumber;

    @Column(name = "blood_group")
    private String bloodGroup;

    @Lob
    @Column(name = "image")
    private byte[] image;

    @Lob
    @Column(name = "digital_signature")
    private byte[] digitalSignature;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}