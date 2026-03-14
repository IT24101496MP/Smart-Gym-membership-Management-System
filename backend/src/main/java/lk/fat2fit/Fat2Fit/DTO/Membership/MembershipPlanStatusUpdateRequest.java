package lk.fat2fit.Fat2Fit.DTO.Membership;

import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipPlanStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembershipPlanStatusUpdateRequest {
    private MembershipPlanStatus status;
}
