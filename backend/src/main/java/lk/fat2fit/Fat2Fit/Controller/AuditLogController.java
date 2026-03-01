package lk.fat2fit.Fat2Fit.Controller;

import lk.fat2fit.Fat2Fit.Entity.AuditLog;
import lk.fat2fit.Fat2Fit.Repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAll();
    }

    @GetMapping("/type/{profileType}")
    public List<AuditLog> getLogsByProfileType(@PathVariable String profileType) {
        return auditLogRepository.findByProfileType(profileType.toUpperCase());
    }

    @GetMapping("/profile/{profileType}/{profileId}")
    public List<AuditLog> getLogsByProfile(
            @PathVariable String profileType,
            @PathVariable int profileId
    ) {
        return auditLogRepository.findByProfileIdAndProfileType(profileId, profileType.toUpperCase());
    }
}
