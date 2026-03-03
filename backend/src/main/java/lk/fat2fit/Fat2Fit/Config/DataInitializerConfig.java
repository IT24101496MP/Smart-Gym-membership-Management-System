package lk.fat2fit.Fat2Fit.Config;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import lk.fat2fit.Fat2Fit.Entity.Enum.Gender;
import lk.fat2fit.Fat2Fit.Entity.Enum.Role;
import lk.fat2fit.Fat2Fit.Entity.User;
import lk.fat2fit.Fat2Fit.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Seeds a default ADMIN user on every startup if none already exists.
 * Credentials are configurable via application.properties / environment variables:
 *   admin.seed.email, admin.seed.password, admin.seed.firstName,
 *   admin.seed.lastName, admin.seed.phone
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializerConfig implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.seed.email}")
    private String adminEmail;

    @Value("${admin.seed.password}")
    private String adminPassword;

    @Value("${admin.seed.firstName}")
    private String adminFirstName;

    @Value("${admin.seed.lastName}")
    private String adminLastName;

    @Value("${admin.seed.phone}")
    private String adminPhone;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(adminEmail)) {
            log.info("Default admin already exists – skipping seed.");
            return;
        }

        User admin = User.builder()
                .firstName(adminFirstName)
                .lastName(adminLastName)
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .phoneNumber(adminPhone)
                .age(0)
                .dateOfBirth(LocalDate.of(2000, 1, 1))
                .gender(Gender.PREFER_NOT_TO_SAY)
                .address("System")
                .isActive(true)
                .build();

        userRepository.save(admin);
        log.info("Default admin seeded → email: {}", adminEmail);
    }
}
