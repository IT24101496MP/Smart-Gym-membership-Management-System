package lk.fat2fit.Fat2Fit.Service;

import lk.fat2fit.Fat2Fit.Entity.AuditLog;
import lk.fat2fit.Fat2Fit.Repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;

    /**
     * Record a single change in the audit log.  If the caller cannot provide a user id we
     * simply skip the entry rather than blowing up the update flow.  All errors are logged
     * so they are visible in the application log (the previous version swallowed them).  In
     * most cases profileType is uppercase but we normalise here to avoid mismatches when
     * querying later.
     */
    private static final int MAX_LOG_VALUE_LENGTH = 10000;

    public void logChange(int profileId,
                          String profileType,
                          Long updatedBy,
                          String fieldName,
                          String oldValue,
                          String newValue) {

        if (updatedBy == null) {
            logger.warn("Skipping audit log for profileId={} profileType={} because updatedBy is null", profileId, profileType);
            return;
        }

        // truncate any extremely long text to avoid DB issues
        oldValue = truncate(oldValue);
        newValue = truncate(newValue);

        AuditLog log = AuditLog.builder()
                .profileId(profileId)
                .profileType(profileType == null ? null : profileType.toUpperCase())
                .updatedBy(updatedBy)
                .fieldName(fieldName)
                .oldValue(oldValue)
                .newValue(newValue)
                .build();

        try {
            auditLogRepository.save(log);
        } catch (Exception e) {
            logger.error("Failed to persist audit log entry: {}", e.getMessage(), e);
            // rethrow so caller becomes aware and can handle if necessary
            throw e;
        }
    }

    private String truncate(String s) {
        if (s == null) return null;
        if (s.length() <= MAX_LOG_VALUE_LENGTH) return s;
        return s.substring(0, MAX_LOG_VALUE_LENGTH) + "...(truncated)";
    }
}
