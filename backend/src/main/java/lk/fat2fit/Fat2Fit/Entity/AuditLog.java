package lk.fat2fit.Fat2Fit.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "Audit_Logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    @Column(name = "profile_id", nullable = false)
    private int profileId;

    @Column(name = "profile_type", nullable = false)
    private String profileType;

    // allow null in case no user id is available (front‑end was not able to send one)
    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "field_name", nullable = false)
    private String fieldName;

    // use LONGTEXT so very large values (e.g. stringified blobs) don't overflow
    @Column(name = "old_value", columnDefinition = "LONGTEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "LONGTEXT")
    private String newValue;

    @CreationTimestamp
    @Column(name = "updated_at", updatable = false, columnDefinition = "DATETIME")
    private LocalDateTime updatedAt;
}
