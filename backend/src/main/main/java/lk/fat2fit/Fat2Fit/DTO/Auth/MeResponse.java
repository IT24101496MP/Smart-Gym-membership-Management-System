package lk.fat2fit.Fat2Fit.DTO.Auth;

import lk.fat2fit.Fat2Fit.Entity.Enum.MemberMembershipStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class MeResponse {
    private int id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private MemberMembershipStatus membershipStatus;
    private LocalDate membershipStartDate;
    private LocalDate membershipEndDate;
    private Boolean membershipSuspended;
    private Integer membershipPlanId;
    private String membershipPlanName;
}
