package lk.fat2fit.Fat2Fit.Repository;

import lk.fat2fit.Fat2Fit.Entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByClientIdAndCheckInTimeBetween(
            Long clientId,
            LocalDateTime start,
            LocalDateTime end
    );

    List<Attendance> findByCheckInTimeBetween(
            LocalDateTime start,
            LocalDateTime end
    );
}