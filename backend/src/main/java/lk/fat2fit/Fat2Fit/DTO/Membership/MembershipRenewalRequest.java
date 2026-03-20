package lk.fat2fit.Fat2Fit.DTO.Membership;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MembershipRenewalRequest {
    private Long clientId;
    private String planName;
    private Integer durationMonths;
    private Double price;
}