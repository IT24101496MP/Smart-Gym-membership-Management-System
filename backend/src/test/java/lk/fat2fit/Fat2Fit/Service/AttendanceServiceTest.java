package lk.fat2fit.Fat2Fit.Service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;

import lk.fat2fit.Fat2Fit.DTO.Attendance.AttendanceRequestDTO;
import lk.fat2fit.Fat2Fit.Entity.Attendance;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Repository.AttendanceRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;

class AttendanceServiceTest {

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private ClientRepository clientRepository;

    @InjectMocks
    private AttendanceService attendanceService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void shouldSetServerTimeWhenRecordingAttendance() {
        Client client = Client.builder()
                .id(1)
                .firstName("John")
                .lastName("Doe")
                .phoneNumber("1234567890")
                .build();

        when(clientRepository.findById(1)).thenReturn(Optional.of(client));
        when(attendanceRepository.findByClientIdAndCheckInTimeBetween(anyLong(), any(), any())).thenReturn(Optional.empty());
        when(attendanceRepository.save(any(Attendance.class))).thenAnswer(i -> i.getArgument(0));

        AttendanceRequestDTO request = new AttendanceRequestDTO();
        request.setClientId(1L);

        var response = attendanceService.recordAttendance(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());

        ArgumentCaptor<Attendance> attendanceCaptor = ArgumentCaptor.forClass(Attendance.class);
        verify(attendanceRepository).save(attendanceCaptor.capture());

        Attendance saved = attendanceCaptor.getValue();
        assertThat(saved.getClient()).isEqualTo(client);
        assertThat(saved.getClientName()).isEqualTo("John Doe");
        assertThat(saved.getPhoneNumber()).isEqualTo("1234567890");
        assertThat(saved.getCheckInTime()).isNotNull();

        Duration delta = Duration.between(saved.getCheckInTime(), LocalDateTime.now()).abs();
        assertThat(delta.toMinutes()).isLessThanOrEqualTo(1);
    }

    @Test
    void shouldRejectDuplicateCheckInSameDay() {
        Client client = Client.builder().id(1).build();

        Attendance existing = Attendance.builder()
                .id(1L)
                .client(client)
                .clientName("John Doe")
                .phoneNumber("1234567890")
                .checkInTime(LocalDateTime.now())
                .build();

        when(clientRepository.findById(1)).thenReturn(Optional.of(client));
        when(attendanceRepository.findByClientIdAndCheckInTimeBetween(anyLong(), any(), any())).thenReturn(Optional.of(existing));

        AttendanceRequestDTO request = new AttendanceRequestDTO();
        request.setClientId(1L);

        var response = attendanceService.recordAttendance(request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertThat(response.getBody()).isEqualTo("Client already checked in today");
    }
}
