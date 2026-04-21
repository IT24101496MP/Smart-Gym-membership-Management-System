package lk.fat2fit.Fat2Fit.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lk.fat2fit.Fat2Fit.Entity.Enum.FitnessGoal;
import lk.fat2fit.Fat2Fit.Entity.Enum.FitnessGoalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "client_fitness_goal_assignments",
        indexes = {
                @Index(name = "idx_fitness_goal_client_status", columnList = "client_id,status"),
                @Index(name = "idx_fitness_goal_client_goal", columnList = "client_id,goal")
        }
)
public class ClientFitnessGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Enumerated(EnumType.STRING)
    @Column(name = "goal", nullable = false, length = 64)
    private FitnessGoal goal;

    @Column(name = "other_goal_specification", length = 255)
    private String otherGoalSpecification;

    @Column(name = "instructor_requirements", nullable = false, length = 1000)
    private String instructorRequirements;

    @Column(name = "allow_target_weight_update", nullable = false)
    @Builder.Default
    private Boolean allowTargetWeightUpdate = false;

    @Column(name = "allow_target_parameters_update", nullable = false)
    @Builder.Default
    private Boolean allowTargetParametersUpdate = false;

    @Column(name = "allow_target_date_update", nullable = false)
    @Builder.Default
    private Boolean allowTargetDateUpdate = false;

    @Column(name = "target_weight_kg", precision = 6, scale = 2)
    private BigDecimal targetWeightKg;

    @Column(name = "target_parameters", length = 1000)
    private String targetParameters;

    @Column(name = "target_completion_date")
    private LocalDate targetCompletionDate;

    @Column(name = "progress_percent")
    private Integer progressPercent;

    @Column(name = "progress_notes", length = 1000)
    private String progressNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private FitnessGoalStatus status = FitnessGoalStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_user_id", nullable = false)
    private User assignedBy;

    @Column(name = "approved_by_instructor", nullable = false)
    @Builder.Default
    private Boolean approvedByInstructor = true;

    @CreationTimestamp
    @Column(name = "assigned_at", nullable = false, updatable = false, columnDefinition = "DATETIME")
    private LocalDateTime assignedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false, columnDefinition = "DATETIME")
    private LocalDateTime updatedAt;
}