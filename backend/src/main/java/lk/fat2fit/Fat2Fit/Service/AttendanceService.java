package lk.fat2fit.Fat2Fit.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import lk.fat2fit.Fat2Fit.DTO.Attendance.AttendanceRequestDTO;
import lk.fat2fit.Fat2Fit.Entity.Attendance;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Repository.AttendanceRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final ClientRepository clientRepository;

    public ResponseEntity<?> recordAttendance(AttendanceRequestDTO dto) {

        // Validation
        if (dto.getClientId() == null) {
            return ResponseEntity.badRequest().body("Client ID is required");
        }

        //  Find Client
        Client client = clientRepository.findById(dto.getClientId().intValue())
                .orElse(null);

        if (client == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Client not found");
        }

        // Prevent duplicate check-in (same day)
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        boolean alreadyCheckedIn = attendanceRepository
                .findByClientIdAndCheckInTimeBetween(
                        dto.getClientId(),
                        startOfDay,
                        endOfDay
                ).isPresent();

        if (alreadyCheckedIn) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Client already checked in today");
        }

        String fullName = client.getFirstName() + " " + client.getLastName();

        Attendance attendance = Attendance.builder()
                .client(client)
                .clientName(fullName)
                .phoneNumber(client.getPhoneNumber())
                .checkInTime(LocalDateTime.now())
                .build();

        attendanceRepository.save(attendance);

        return ResponseEntity.ok("Attendance recorded successfully");
    }

    public ResponseEntity<?> getTodayAttendance() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        List<Attendance> todayAttendance = attendanceRepository.findByCheckInTimeBetween(startOfDay, endOfDay);
        return ResponseEntity.ok(todayAttendance);
    }
}