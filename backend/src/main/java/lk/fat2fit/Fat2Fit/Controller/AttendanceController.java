package lk.fat2fit.Fat2Fit.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lk.fat2fit.Fat2Fit.DTO.AttendanceRequestDTO;
import lk.fat2fit.Fat2Fit.Service.AttendanceService;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/check-in")
    public ResponseEntity<?> checkIn(@RequestBody AttendanceRequestDTO dto) {
        return attendanceService.recordAttendance(dto);
    }
}