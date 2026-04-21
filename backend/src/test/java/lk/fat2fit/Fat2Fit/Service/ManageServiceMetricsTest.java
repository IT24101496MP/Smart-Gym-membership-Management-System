package lk.fat2fit.Fat2Fit.Service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import lk.fat2fit.Fat2Fit.DTO.Manage.ClientMetricsRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.ClientMetricsResponse;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.ClientMeasurement;
import lk.fat2fit.Fat2Fit.Entity.Enum.Role;
import lk.fat2fit.Fat2Fit.Entity.MembershipPlan;
import lk.fat2fit.Fat2Fit.Entity.User;
import lk.fat2fit.Fat2Fit.Repository.ClientMeasurementRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.MembershipPlanRepository;
import lk.fat2fit.Fat2Fit.Repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class ManageServiceMetricsTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ClientMeasurementRepository measurementRepository;

    @Mock
    private MembershipPlanRepository membershipPlanRepository;

    @InjectMocks
    private ManageService manageService;

    @BeforeEach
    void setUp() {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken("admin@fat2fit.lk", "pw"));
        SecurityContextHolder.setContext(context);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getClientMetricsHistory_shouldReturnNotFoundWhenClientMissing() {
        when(clientRepository.existsById(999L)).thenReturn(false);

        ResponseEntity<?> response = manageService.getClientMetricsHistory(999L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isEqualTo("Client not found.");
    }

    @Test
    void getClientMetricsHistory_shouldReturnMappedHistory() {
        Client client = Client.builder().id(12).email("member@fat2fit.lk").build();

        ClientMeasurement m1 = ClientMeasurement.builder()
                .id(1L)
                .client(client)
                .heightCm(new BigDecimal("170.00"))
                .weightKg(new BigDecimal("75.00"))
                .waistCm(new BigDecimal("90.00"))
                .hipCm(new BigDecimal("98.00"))
                .armCm(new BigDecimal("31.00"))
                .shoulderCm(new BigDecimal("44.00"))
                .breastCm(new BigDecimal("95.00"))
                .buttocksCm(new BigDecimal("101.00"))
                .measurementDate(LocalDate.of(2026, 2, 1))
                .bmi(new BigDecimal("25.95"))
                .recordedAt(LocalDateTime.of(2026, 2, 1, 8, 0))
                .build();

        when(clientRepository.existsById(12L)).thenReturn(true);
        when(measurementRepository.findByClientIdOrderByMeasurementDateDescRecordedAtDescIdDesc(12L))
                .thenReturn(List.of(m1));

        ResponseEntity<?> response = manageService.getClientMetricsHistory(12L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isInstanceOf(List.class);
        @SuppressWarnings("unchecked")
        List<ClientMetricsResponse> rows = (List<ClientMetricsResponse>) response.getBody();
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).getClientId()).isEqualTo(12L);
        assertThat(rows.get(0).getBmi()).isEqualByComparingTo("25.95");
    }

    @Test
    void saveClientMetrics_shouldRejectInvalidRequest() {
        when(clientRepository.findById(5L)).thenReturn(Optional.of(Client.builder().id(5).email("x@x.com").build()));

        ClientMetricsRequest req = new ClientMetricsRequest();
        req.setHeightCm(new BigDecimal("170"));

        ResponseEntity<?> response = manageService.saveClientMetrics(5L, req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isEqualTo("All measurement fields are required.");
    }

    @Test
    void saveClientMetrics_shouldCalculateBmiAndPersistMeasurement() {
        Client client = Client.builder().id(5).email("member@fat2fit.lk").build();
        when(clientRepository.findById(5L)).thenReturn(Optional.of(client));

        when(measurementRepository.save(any(ClientMeasurement.class))).thenAnswer(invocation -> {
            ClientMeasurement m = invocation.getArgument(0);
            m.setId(77L);
            m.setRecordedAt(LocalDateTime.of(2026, 4, 18, 10, 0));
            return m;
        });

        ClientMetricsRequest req = new ClientMetricsRequest();
        req.setHeightCm(new BigDecimal("170"));
        req.setWeightKg(new BigDecimal("74"));
        req.setWaistCm(new BigDecimal("88"));
        req.setHipCm(new BigDecimal("98"));
        req.setArmCm(new BigDecimal("30"));
        req.setShoulderCm(new BigDecimal("43"));
        req.setBreastCm(new BigDecimal("94"));
        req.setButtocksCm(new BigDecimal("100"));
        req.setMeasurementDate(LocalDate.of(2026, 4, 1));

        ResponseEntity<?> response = manageService.saveClientMetrics(5L, req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        ClientMetricsResponse body = (ClientMetricsResponse) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getMeasurementId()).isEqualTo(77L);
        assertThat(body.getBmi()).isEqualByComparingTo("25.61");

        ArgumentCaptor<ClientMeasurement> captor = ArgumentCaptor.forClass(ClientMeasurement.class);
        verify(measurementRepository).save(captor.capture());
        assertThat(captor.getValue().getBmi()).isEqualByComparingTo("25.61");
    }

    @Test
    void getMyMetricsHistory_shouldForbidNonClientUsers() {
        User admin = User.builder()
                .id(1)
                .email("admin@fat2fit.lk")
                .role(Role.ADMIN)
                .build();

        when(userRepository.findByEmail("admin@fat2fit.lk")).thenReturn(Optional.of(admin));

        ResponseEntity<?> response = manageService.getMyMetricsHistory();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isEqualTo("Only clients can view their own measurement history.");
    }

    @Test
    void getMyMetricsHistory_shouldReturnClientHistory() {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken("member@fat2fit.lk", "pw"));
        SecurityContextHolder.setContext(context);

        Client client = Client.builder()
                .id(22)
                .email("member@fat2fit.lk")
                .role(Role.CLIENT)
                .build();

        ClientMeasurement m = ClientMeasurement.builder()
                .id(90L)
                .client(client)
                .heightCm(new BigDecimal("170"))
                .weightKg(new BigDecimal("70"))
                .waistCm(new BigDecimal("86"))
                .hipCm(new BigDecimal("96"))
                .armCm(new BigDecimal("29"))
                .shoulderCm(new BigDecimal("42"))
                .breastCm(new BigDecimal("92"))
                .buttocksCm(new BigDecimal("98"))
                .measurementDate(LocalDate.of(2026, 4, 1))
                .bmi(new BigDecimal("24.22"))
                .recordedAt(LocalDateTime.of(2026, 4, 1, 8, 0))
                .build();

        when(userRepository.findByEmail("member@fat2fit.lk")).thenReturn(Optional.of(client));
        when(measurementRepository.findByClientIdOrderByMeasurementDateDescRecordedAtDescIdDesc(22L))
                .thenReturn(List.of(m));

        ResponseEntity<?> response = manageService.getMyMetricsHistory();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isInstanceOf(List.class);
        @SuppressWarnings("unchecked")
        List<ClientMetricsResponse> rows = (List<ClientMetricsResponse>) response.getBody();
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).getMeasurementId()).isEqualTo(90L);
        assertThat(rows.get(0).getBmi()).isEqualByComparingTo("24.22");
    }
}