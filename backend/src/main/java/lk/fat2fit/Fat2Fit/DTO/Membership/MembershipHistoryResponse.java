package lk.fat2fit.Fat2Fit.DTO.Membership;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MembershipHistoryResponse {
    private Long id;
    private String planName;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private String status;
}