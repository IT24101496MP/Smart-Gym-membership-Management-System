package lk.fat2fit.Fat2Fit.Service;

import lk.fat2fit.Fat2Fit.Entity.AuditLog;
import lk.fat2fit.Fat2Fit.Repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void logChange(int profileId,
                          String profileType,
                          Long updatedBy,
                          String fieldName,
                          String oldValue,
                          String newValue) {

        try {
            AuditLog log = AuditLog.builder()
                    .profileId(profileId)
                    .profileType(profileType)
                    .updatedBy(updatedBy)
                    .fieldName(fieldName)
                    .oldValue(oldValue)
                    .newValue(newValue)
                    .build();

            auditLogRepository.save(log);
        } catch (Exception e) {
            System.out.println("Audit log saving failed: " + e.getMessage());
        }
    }
}
