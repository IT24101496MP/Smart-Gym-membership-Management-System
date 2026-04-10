package lk.fat2fit.Fat2Fit.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "client_measurements",
        indexes = {
                @Index(name = "idx_client_measurements_client_date", columnList = "client_id,measurement_date")
        }
)
public class ClientMeasurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "height_cm", nullable = false, precision = 5, scale = 2)
    private BigDecimal heightCm;

    @Column(name = "weight_kg", nullable = false, precision = 5, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "waist_cm", nullable = false, precision = 5, scale = 2)
    private BigDecimal waistCm;

    @Column(name = "hip_cm", nullable = false, precision = 5, scale = 2)
    private BigDecimal hipCm;

    @Column(name = "arm_cm", nullable = false, precision = 5, scale = 2)
    private BigDecimal armCm;

    @Column(name = "shoulder_cm", nullable = false, precision = 5, scale = 2)
    private BigDecimal shoulderCm;

    @Column(name = "breast_cm", nullable = false, precision = 5, scale = 2)
    private BigDecimal breastCm;

    @Column(name = "buttocks_cm", nullable = false, precision = 5, scale = 2)
    private BigDecimal buttocksCm;

    @Column(name = "measurement_date", nullable = false)
    private LocalDate measurementDate;

    @Column(name = "bmi", nullable = false, precision = 5, scale = 2)
    private BigDecimal bmi;

    @CreationTimestamp
    @Column(name = "recorded_at", nullable = false, updatable = false, columnDefinition = "DATETIME")
    private LocalDateTime recordedAt;
}
