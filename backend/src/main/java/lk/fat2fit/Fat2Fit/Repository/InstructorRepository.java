package lk.fat2fit.Fat2Fit.Repository;

import lk.fat2fit.Fat2Fit.Entity.Instructor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstructorRepository extends JpaRepository<Instructor, Integer> {
    boolean existsByEmail(String email);
    boolean existByPhoneNumber(String phoneNumber);

    boolean existsByEmailOrPhoneNumber(String email, String phoneNumber);

    Optional<Instructor> findByEmail(String email);
    Optional<Instructor> findByPhoneNumber(String phoneNumber);

    List<Instructor> findByStatus(Instructor.ProfileStatus status);
    List<Instructor> findByIsActiveTrue();
    List<Instructor> findByIsActiveFalse();
}
