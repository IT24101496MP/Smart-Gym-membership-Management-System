package lk.fat2fit.Fat2Fit.Entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "client_health_screening")
public class ClientHealthScreening {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "cardiac_conditions", nullable = false)
    private boolean cardiacConditions;

    @Column(name = "respiratory_issues", nullable = false)
    private boolean respiratoryIssues;

    @Column(name = "fainting_or_balance_problems", nullable = false)
    private boolean faintingOrBalanceProblems;

    @Column(name = "joint_or_muscle_disorders", nullable = false)
    private boolean jointOrMuscleDisorders;

    @Column(name = "high_blood_pressure", nullable = false)
    private boolean highBloodPressure;

    @Column(name = "cholesterol_levels", nullable = false)
    private boolean cholesterolLevels;

    @Column(name = "current_medications", nullable = false)
    private boolean currentMedications;

    @Column(name = "disabilities_or_physical_limitations", nullable = false)
    private boolean disabilitiesOrPhysicalLimitations;

    @Column(name = "additional_notes", columnDefinition = "TEXT")
    private String additionalNotes;

    @Column(name = "high_risk", nullable = false)
    private boolean highRisk;

    @CreationTimestamp
    @Column(name = "recorded_at", nullable = false, updatable = false, columnDefinition = "DATETIME")
    private LocalDateTime recordedAt;
}
