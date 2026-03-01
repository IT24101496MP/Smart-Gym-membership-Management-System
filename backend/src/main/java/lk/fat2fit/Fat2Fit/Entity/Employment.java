package lk.fat2fit.Fat2Fit.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lk.fat2fit.Fat2Fit.Entity.Enum.EmploymentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "employment")
public class Employment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "instructor_id", nullable = false, unique = true)
    private Instructor instructor;

    @Column(name = "employment_type")
    private EmploymentType employmentType;

    @Column(name = "working_hours_per_week")
    private Integer workingHoursPerWeek;

    @Column(name = "salary", precision = 10, scale = 2)
    private BigDecimal salary;
}
