package lk.fat2fit.Fat2Fit.DTO.Membership;

import java.math.BigDecimal;

import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipPlanStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembershipPlanRequest {
    private String planName;
    private String description;
    private Integer durationMonths;
    private BigDecimal monthlyPrice;
    private BigDecimal admissionFee;
    private Integer maximumMembers;
    private MembershipPlanStatus status;
}
