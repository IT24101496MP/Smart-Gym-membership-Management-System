package lk.fat2fit.Fat2Fit.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import lk.fat2fit.Fat2Fit.Entity.ClientHealthScreening;

public interface ClientHealthScreeningRepository extends JpaRepository<ClientHealthScreening, Long> {

    Optional<ClientHealthScreening> findTopByClientIdOrderByRecordedAtDescIdDesc(Long clientId);
}
