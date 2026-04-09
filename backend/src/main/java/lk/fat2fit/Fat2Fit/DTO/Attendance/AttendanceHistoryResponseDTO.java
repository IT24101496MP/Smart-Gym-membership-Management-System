package lk.fat2fit.Fat2Fit.DTO.Attendance;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
public class AttendanceHistoryResponseDTO {

    private Integer id;
    private String firstName;
    private String lastName;
    private String memberName;
    private LocalDate date;
    private LocalTime time;
    private String profilePictureBase64;
}