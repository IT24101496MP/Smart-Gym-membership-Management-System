package lk.fat2fit.Fat2Fit.Repository;

import lk.fat2fit.Fat2Fit.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByUsername(String username);
    Optional<User> findByUsername(String username);
}
