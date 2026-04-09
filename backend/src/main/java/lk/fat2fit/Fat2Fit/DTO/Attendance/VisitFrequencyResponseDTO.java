package lk.fat2fit.Fat2Fit.DTO.Attendance;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VisitFrequencyResponseDTO {

    private long weeklyVisits;
    private long monthlyVisits;
}