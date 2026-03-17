package lk.fat2fit.Fat2Fit.Entity;

import java.math.BigDecimal;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import lk.fat2fit.Fat2Fit.Entity.Enum.ProfileStatus;
import lk.fat2fit.Fat2Fit.Entity.Enum.EmploymentType;

@Data
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Entity
@Table(name= "instructor")
@PrimaryKeyJoinColumn(name = "id")
public class Instructor extends User {

    @Column(name = "qualification")
    private String qualification;

    @Column(name = "years_of_experience")
    private int yearsOfExperience;

    @Column(name = "areas_of_spealization")
    private String areasOfSpecialization;

    @Column(name = "status")
    @Builder.Default
    private ProfileStatus status = ProfileStatus.PENDING;

    @OneToOne(mappedBy = "instructor", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private Employment employment;
}
