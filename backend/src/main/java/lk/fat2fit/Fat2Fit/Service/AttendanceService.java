package lk.fat2fit.Fat2Fit.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import lk.fat2fit.Fat2Fit.DTO.Attendance.*;
import lk.fat2fit.Fat2Fit.Entity.Attendance;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Repository.AttendanceRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final ClientRepository clientRepository;

    public ResponseEntity<?> recordAttendance(AttendanceRequestDTO dto) {

        if (dto.getClientId() == null) {
            return ResponseEntity.badRequest().body("Client ID is required");
        }

        Client client = clientRepository.findById(dto.getClientId().intValue())
                .orElse(null);

        if (client == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Client not found");
        }

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

        List<Attendance> todayAttendance =
                attendanceRepository.findByCheckInTimeBetween(startOfDay, endOfDay);

        return ResponseEntity.ok(todayAttendance);
    }

    public ResponseEntity<?> getAttendanceByDateRange(
            LocalDateTime startDate,
            LocalDateTime endDate,
            String sort
    ) {

        if (startDate == null || endDate == null) {
            return ResponseEntity.badRequest()
                    .body("Start date and End date are required");
        }

        if (endDate.isBefore(startDate)) {
            return ResponseEntity.badRequest()
                    .body("End date cannot be before start date");
        }

        List<Attendance> records;
        if ("oldest".equalsIgnoreCase(sort)) {
            records = attendanceRepository
                    .findByCheckInTimeBetweenOrderByCheckInTimeAsc(startDate, endDate);
        } else {
            records = attendanceRepository
                    .findByCheckInTimeBetweenOrderByCheckInTimeDesc(startDate, endDate);
        }

        List<AttendanceHistoryResponseDTO> response = records.stream()
                .map(a -> {
                    String profilePictureBase64 = null;
                    if (a.getClient() != null && a.getClient().getProfilePicture() != null) {
                        profilePictureBase64 = Base64.getEncoder()
                                .encodeToString(a.getClient().getProfilePicture());
                    }

                    return AttendanceHistoryResponseDTO.builder()
                            .id(a.getClient() != null ? a.getClient().getId() : null)
                            .firstName(a.getClient() != null ? a.getClient().getFirstName() : "")
                            .lastName(a.getClient() != null ? a.getClient().getLastName() : "")
                            .memberName(a.getClientName())
                            .date(a.getCheckInTime().toLocalDate())
                            .time(a.getCheckInTime().toLocalTime())
                            .profilePictureBase64(profilePictureBase64)
                            .build();
                })
                .toList();

        return ResponseEntity.ok(response);
    }

    // Overall Visit Frequency
    public ResponseEntity<?> getVisitFrequency() {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastWeek = now.minusDays(7);
        LocalDateTime lastMonth = now.minusDays(30);

        List<Attendance> weeklyRecords =
                attendanceRepository.findByCheckInTimeBetween(lastWeek, now);

        List<Attendance> monthlyRecords =
                attendanceRepository.findByCheckInTimeBetween(lastMonth, now);

        VisitFrequencyResponseDTO response = VisitFrequencyResponseDTO.builder()
                .weeklyVisits(weeklyRecords.size())
                .monthlyVisits(monthlyRecords.size())
                .build();

        return ResponseEntity.ok(response);
    }

    // Per-member Visit Frequency
    public ResponseEntity<?> getVisitFrequencyPerMember() {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastWeek = now.minusDays(7);
        LocalDateTime lastMonth = now.minusDays(30);

        List<Attendance> records =
                attendanceRepository.findByCheckInTimeBetween(lastMonth, now);

        Map<Integer, List<Attendance>> groupedByClient = records.stream()
                .filter(a -> a.getClient() != null)
                .collect(Collectors.groupingBy(a -> a.getClient().getId()));

        List<MemberVisitFrequencyDTO> response = groupedByClient.entrySet()
                .stream()
                .map(entry -> {

                    Integer clientId = entry.getKey();
                    List<Attendance> attendances = entry.getValue();

                    String name = attendances.get(0).getClientName();

                    long monthlyCount = attendances.size();

                    long weeklyCount = attendances.stream()
                            .filter(a -> a.getCheckInTime().isAfter(lastWeek))
                            .count();

                    return MemberVisitFrequencyDTO.builder()
                            .clientId(clientId.longValue())
                            .memberName(name)
                            .weeklyVisits(weeklyCount)
                            .monthlyVisits(monthlyCount)
                            .build();
                })
                .toList();

        return ResponseEntity.ok(response);
    }
}