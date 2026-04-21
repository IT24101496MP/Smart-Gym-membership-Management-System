package lk.fat2fit.Fat2Fit.DTO.Manage;

import lk.fat2fit.Fat2Fit.Entity.Enum.EmploymentType;
import lk.fat2fit.Fat2Fit.Entity.Enum.Gender;
import lk.fat2fit.Fat2Fit.Entity.Enum.MemberMembershipStatus;
import lk.fat2fit.Fat2Fit.Entity.Enum.ProfileStatus;
import lk.fat2fit.Fat2Fit.Entity.Enum.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDetailResponse {
    private int id;
    private String firstName;
    private String lastName;
    private int age;
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
    private Role role;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private byte[] profilePicture;

    // ── Client-only fields (null for non-clients) ───────────────────────────
    private Integer membershipPlanId;
    private String membershipPlanName;
    private String membershipStatus;
    private LocalDate membershipStartDate;
    private LocalDate membershipEndDate;
    private Boolean highRiskMember;

    // ── Instructor-only fields (null for non-instructors) ────────────────────
    private ProfileStatus instructorStatus;
    private EmploymentType employmentType;
    private Integer workingHoursPerWeek;
    private BigDecimal salary;
}
