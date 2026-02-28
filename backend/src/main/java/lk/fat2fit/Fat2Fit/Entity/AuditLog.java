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

    @Column(name = "updated_by", nullable = false)
    private Long updatedBy;

    @Column(name = "field_name", nullable = false)
    private String fieldName;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @CreationTimestamp
    @Column(name = "updated_at", updatable = false, columnDefinition = "DATETIME")
    private LocalDateTime updatedAt;
}
