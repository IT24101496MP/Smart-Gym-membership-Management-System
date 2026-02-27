package lk.fat2fit.Fat2Fit.Entity;

import java.time.LocalDate;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lk.fat2fit.Fat2Fit.Entity.Enum.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Date;

import jakarta.validation.constraints.Pattern;

import lk.fat2fit.Fat2Fit.Entity.Enum.Gender;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "user")
@Inheritance(strategy = InheritanceType.JOINED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "Age", nullable = false)
    private int age;

    @Column(name = "Date_of_birth", nullable = false)
    private Date dateOfBirth;

    @Column(name = "Gender", nullable = false)
    private Gender gender;

    @Column(name = "email", nullable = false, unique = true)
    @Email
    private String email;

    @Column(name = "Phone_number", nullable = false, unique = true)
    @Pattern(regexp = "0\\d{9}")
    private String phoneNumber;

    @Column(name = "Land_phone")
    @Pattern(regexp = "0\\d{9}")
    private String landPhone;

    @Column(name = "Emergency_contact_name")
    private String emergencyContactName;

    @Column(name = "Emergency_contact_relationship")
    private String emergencyContactRelationship;

    @Column(name = "Emergency_contact_number")
    @Pattern(regexp = "0\\d{9}")
    private String emergencyContactNumber;
    
    @Column(name = "Blood_group")
    private String bloodGroup;

    @Lob
    @Column(name = "profile_picture", columnDefinition = "LONGBLOB")
    private byte[] profilePicture;

    @Column(name = "address", nullable = false)
    private String address;

    @Column(name = "password")
    private String password;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "role")
    @Builder.Default
    private Role role = Role.CLIENT;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, columnDefinition = "DATETIME")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", columnDefinition = "DATETIME")
    private LocalDateTime updatedAt;
}
