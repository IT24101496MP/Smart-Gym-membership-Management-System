package lk.fat2fit.Fat2Fit.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import lk.fat2fit.Fat2Fit.Entity.ClientMeasurement;

public interface ClientMeasurementRepository extends JpaRepository<ClientMeasurement, Long> {

    Optional<ClientMeasurement> findTopByClientIdOrderByMeasurementDateDescRecordedAtDescIdDesc(Long clientId);

    List<ClientMeasurement> findByClientIdOrderByMeasurementDateDescRecordedAtDescIdDesc(Long clientId);
}
