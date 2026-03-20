package lk.fat2fit.Fat2Fit.DTO.Manage;

import java.time.LocalDate;

import lombok.Data;

@Data
public class ClientMembershipRenewRequest {
    private Integer membershipPlanId;
    private LocalDate startDate;
}
