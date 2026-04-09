package lk.fat2fit.Fat2Fit.DTO;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClientSearchResponseDTO {
    private Long id;
    private String fullName;
    private String phoneNumber;
}