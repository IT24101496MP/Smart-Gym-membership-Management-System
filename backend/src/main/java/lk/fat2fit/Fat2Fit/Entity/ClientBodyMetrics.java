package lk.fat2fit.Fat2Fit.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lk.fat2fit.Fat2Fit.Entity.Enum.FitnessGoal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "client_body_metrics")
public class ClientBodyMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "client_id", nullable = false, unique = true)
    private Client client;

    // ── Body measurements (in cm / kg) ────────────────────────────────────────

    @Column(name = "weight_kg", precision = 5, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "height_cm", precision = 5, scale = 2)
    private BigDecimal heightCm;

    @Column(name = "hip_size_cm", precision = 5, scale = 2)
    private BigDecimal hipSizeCm;

    @Column(name = "breast_size_cm", precision = 5, scale = 2)
    private BigDecimal breastSizeCm;

    @Column(name = "waist_size_cm", precision = 5, scale = 2)
    private BigDecimal waistSizeCm;

    @Column(name = "arm_size_cm", precision = 5, scale = 2)
    private BigDecimal armSizeCm;

    @Column(name = "shoulder_size_cm", precision = 5, scale = 2)
    private BigDecimal shoulderSizeCm;

    @Column(name = "butt_size_cm", precision = 5, scale = 2)
    private BigDecimal buttSizeCm;

    // ── Fitness goals ─────────────────────────────────────────────────────────

    @ElementCollection(targetClass = FitnessGoal.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "client_fitness_goals",
            joinColumns = @JoinColumn(name = "metrics_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "goal")
    @Builder.Default
    private Set<FitnessGoal> fitnessGoals = new HashSet<>();

    /** Filled when OTHERS is included in fitnessGoals */
    @Column(name = "other_goal_specification", length = 255)
    private String otherGoalSpecification;

    @UpdateTimestamp
    @Column(name = "updated_at", columnDefinition = "DATETIME")
    private LocalDateTime updatedAt;
}
