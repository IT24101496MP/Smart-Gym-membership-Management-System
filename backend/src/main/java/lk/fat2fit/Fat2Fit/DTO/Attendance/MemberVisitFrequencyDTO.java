package lk.fat2fit.Fat2Fit.DTO.Attendance;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MemberVisitFrequencyDTO {

    private Long clientId;
    private String memberName;
    private long weeklyVisits;
    private long monthlyVisits;
}