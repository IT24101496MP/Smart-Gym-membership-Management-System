package lk.fat2fit.Fat2Fit.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import lk.fat2fit.Fat2Fit.Entity.WorkoutSchedule;

public interface WorkoutScheduleRepository extends JpaRepository<WorkoutSchedule, Long> {

    Optional<WorkoutSchedule> findByClientId(Long clientId);

    boolean existsByClientId(Long clientId);
}
