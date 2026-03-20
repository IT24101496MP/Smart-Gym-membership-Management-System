package lk.fat2fit.Fat2Fit.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDTO {

    private Long logId;
    private int profileId;
    private String profileType;
    private Long updatedBy;
    private String fieldName;
    private String oldValue;
    private String newValue;
    private LocalDateTime updatedAt;
}
