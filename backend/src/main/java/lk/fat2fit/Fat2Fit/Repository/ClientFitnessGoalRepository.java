package lk.fat2fit.Fat2Fit.Repository;

import lk.fat2fit.Fat2Fit.Entity.ClientFitnessGoal;
import lk.fat2fit.Fat2Fit.Entity.Enum.FitnessGoalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClientFitnessGoalRepository extends JpaRepository<ClientFitnessGoal, Long> {

    List<ClientFitnessGoal> findByClientIdOrderByAssignedAtDescIdDesc(Long clientId);

    Optional<ClientFitnessGoal> findByIdAndClientId(Long id, Long clientId);

    List<ClientFitnessGoal> findByClientIdAndStatus(Long clientId, FitnessGoalStatus status);
}