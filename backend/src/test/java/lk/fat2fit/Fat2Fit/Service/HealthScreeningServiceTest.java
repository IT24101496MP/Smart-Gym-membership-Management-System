package lk.fat2fit.Fat2Fit.Service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import lk.fat2fit.Fat2Fit.DTO.Manage.HealthScreeningRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.HealthScreeningResponse;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.ClientHealthScreening;
import lk.fat2fit.Fat2Fit.Repository.ClientHealthScreeningRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;

public class HealthScreeningServiceTest {

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ClientHealthScreeningRepository healthScreeningRepository;

    @InjectMocks
    private ManageService manageService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void shouldSaveHealthScreeningWithoutHighRisk() {
        Client client = Client.builder()
                .id(1)
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .phoneNumber("1234567890")
                .highRiskMember(false)
                .build();

        HealthScreeningRequest request = HealthScreeningRequest.builder()
                .cardiacConditions(false)
                .respiratoryIssues(false)
                .faintingOrBalanceProblems(false)
                .jointOrMuscleDisorders(false)
                .highBloodPressure(false)
                .cholesterolLevels(false)
                .currentMedications(false)
                .disabilitiesOrPhysicalLimitations(false)
                .additionalNotes("No issues detected")
                .build();

        ClientHealthScreening saved = ClientHealthScreening.builder()
                .id(100L)
                .client(client)
                .cardiacConditions(false)
                .respiratoryIssues(false)
                .faintingOrBalanceProblems(false)
                .jointOrMuscleDisorders(false)
                .highBloodPressure(false)
                .cholesterolLevels(false)
                .currentMedications(false)
                .disabilitiesOrPhysicalLimitations(false)
                .additionalNotes("No issues detected")
                .highRisk(false)
                .build();

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(healthScreeningRepository.save(any(ClientHealthScreening.class))).thenReturn(saved);
        when(clientRepository.save(any(Client.class))).thenReturn(client);

        ResponseEntity<?> response = manageService.saveClientHealthScreening(1L, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertThat(response.getBody()).isInstanceOf(HealthScreeningResponse.class);

        HealthScreeningResponse screeningResp = (HealthScreeningResponse) response.getBody();
        assertThat(screeningResp.isHighRisk()).isFalse();
        assertThat(screeningResp.getAdditionalNotes()).isEqualTo("No issues detected");

        ArgumentCaptor<Client> clientCaptor = ArgumentCaptor.forClass(Client.class);
        verify(clientRepository, times(2)).save(clientCaptor.capture());
        assertThat(clientCaptor.getValue().getHighRiskMember()).isFalse();
    }

    @Test
    void shouldFlagMemberAsHighRiskWhenCardiacConditionExists() {
        Client client = Client.builder()
                .id(2)
                .firstName("Jane")
                .lastName("Smith")
                .email("jane@example.com")
                .phoneNumber("9876543210")
                .highRiskMember(false)
                .build();

        HealthScreeningRequest request = HealthScreeningRequest.builder()
                .cardiacConditions(true)
                .respiratoryIssues(false)
                .faintingOrBalanceProblems(false)
                .jointOrMuscleDisorders(false)
                .highBloodPressure(false)
                .cholesterolLevels(false)
                .currentMedications(false)
                .disabilitiesOrPhysicalLimitations(false)
                .additionalNotes("Cardiac condition detected")
                .build();

        ClientHealthScreening saved = ClientHealthScreening.builder()
                .id(101L)
                .client(client)
                .cardiacConditions(true)
                .respiratoryIssues(false)
                .faintingOrBalanceProblems(false)
                .jointOrMuscleDisorders(false)
                .highBloodPressure(false)
                .cholesterolLevels(false)
                .currentMedications(false)
                .disabilitiesOrPhysicalLimitations(false)
                .additionalNotes("Cardiac condition detected")
                .highRisk(true)
                .build();

        when(clientRepository.findById(2L)).thenReturn(Optional.of(client));
        when(healthScreeningRepository.save(any(ClientHealthScreening.class))).thenReturn(saved);
        when(clientRepository.save(any(Client.class))).thenReturn(client);

        ResponseEntity<?> response = manageService.saveClientHealthScreening(2L, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        HealthScreeningResponse screeningResp = (HealthScreeningResponse) response.getBody();
        assertThat(screeningResp.isHighRisk()).isTrue();
        assertThat(screeningResp.isCardiacConditions()).isTrue();

        ArgumentCaptor<Client> clientCaptor = ArgumentCaptor.forClass(Client.class);
        verify(clientRepository, times(2)).save(clientCaptor.capture());
        assertThat(clientCaptor.getValue().getHighRiskMember()).isTrue();
    }

    @Test
    void shouldFlagMemberAsHighRiskWhenMultipleIndicatorsExist() {
        Client client = Client.builder()
                .id(3)
                .firstName("Bob")
                .lastName("Johnson")
                .email("bob@example.com")
                .phoneNumber("5555555555")
                .highRiskMember(false)
                .build();

        HealthScreeningRequest request = HealthScreeningRequest.builder()
                .cardiacConditions(false)
                .respiratoryIssues(true)
                .faintingOrBalanceProblems(true)
                .jointOrMuscleDisorders(false)
                .highBloodPressure(true)
                .cholesterolLevels(false)
                .currentMedications(true)
                .disabilitiesOrPhysicalLimitations(false)
                .additionalNotes("Multiple health concerns")
                .build();

        ClientHealthScreening saved = ClientHealthScreening.builder()
                .id(102L)
                .client(client)
                .cardiacConditions(false)
                .respiratoryIssues(true)
                .faintingOrBalanceProblems(true)
                .jointOrMuscleDisorders(false)
                .highBloodPressure(true)
                .cholesterolLevels(false)
                .currentMedications(true)
                .disabilitiesOrPhysicalLimitations(false)
                .additionalNotes("Multiple health concerns")
                .highRisk(true)
                .build();

        when(clientRepository.findById(3L)).thenReturn(Optional.of(client));
        when(healthScreeningRepository.save(any(ClientHealthScreening.class))).thenReturn(saved);
        when(clientRepository.save(any(Client.class))).thenReturn(client);

        ResponseEntity<?> response = manageService.saveClientHealthScreening(3L, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        HealthScreeningResponse screeningResp = (HealthScreeningResponse) response.getBody();
        assertThat(screeningResp.isHighRisk()).isTrue();
        assertThat(screeningResp.isRespiratoryIssues()).isTrue();
        assertThat(screeningResp.isFaintingOrBalanceProblems()).isTrue();
        assertThat(screeningResp.isHighBloodPressure()).isTrue();
        assertThat(screeningResp.isCurrentMedications()).isTrue();
    }

    @Test
    void shouldRejectHealthScreeningWhenCardiacConditionsIsMissing() {
        Client client = Client.builder()
                .id(4)
                .firstName("Alice")
                .lastName("Brown")
                .email("alice@example.com")
                .build();

        HealthScreeningRequest request = HealthScreeningRequest.builder()
                .cardiacConditions(null)
                .respiratoryIssues(false)
                .faintingOrBalanceProblems(false)
                .jointOrMuscleDisorders(false)
                .highBloodPressure(false)
                .cholesterolLevels(false)
                .currentMedications(false)
                .disabilitiesOrPhysicalLimitations(false)
                .build();

        when(clientRepository.findById(4L)).thenReturn(Optional.of(client));

        ResponseEntity<?> response = manageService.saveClientHealthScreening(4L, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertThat(response.getBody().toString()).contains("All required questionnaire responses must be provided");
    }

    @Test
    void shouldRejectHealthScreeningWhenMultipleFieldsAreMissing() {
        Client client = Client.builder()
                .id(5)
                .firstName("Charlie")
                .lastName("Davis")
                .email("charlie@example.com")
                .build();

        HealthScreeningRequest request = HealthScreeningRequest.builder()
                .cardiacConditions(null)
                .respiratoryIssues(null)
                .faintingOrBalanceProblems(false)
                .jointOrMuscleDisorders(false)
                .highBloodPressure(null)
                .cholesterolLevels(false)
                .currentMedications(false)
                .disabilitiesOrPhysicalLimitations(false)
                .build();

        when(clientRepository.findById(5L)).thenReturn(Optional.of(client));

        ResponseEntity<?> response = manageService.saveClientHealthScreening(5L, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void shouldReturnNotFoundWhenClientDoesNotExist() {
        HealthScreeningRequest request = HealthScreeningRequest.builder()
                .cardiacConditions(false)
                .respiratoryIssues(false)
                .faintingOrBalanceProblems(false)
                .jointOrMuscleDisorders(false)
                .highBloodPressure(false)
                .cholesterolLevels(false)
                .currentMedications(false)
                .disabilitiesOrPhysicalLimitations(false)
                .build();

        when(clientRepository.findById(999L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = manageService.saveClientHealthScreening(999L, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertThat(response.getBody()).isEqualTo("Client not found.");
    }

    @Test
    void shouldRetrieveLatestHealthScreening() {
        Client client = Client.builder()
                .id(6)
                .firstName("Eve")
                .lastName("Miller")
                .email("eve@example.com")
                .highRiskMember(true)
                .build();

        ClientHealthScreening screening = ClientHealthScreening.builder()
                .id(103L)
                .client(client)
                .cardiacConditions(true)
                .respiratoryIssues(false)
                .faintingOrBalanceProblems(false)
                .jointOrMuscleDisorders(false)
                .highBloodPressure(false)
                .cholesterolLevels(false)
                .currentMedications(false)
                .disabilitiesOrPhysicalLimitations(false)
                .additionalNotes("Cardiac issue requires monitoring")
                .highRisk(true)
                .build();

        when(clientRepository.findById(6L)).thenReturn(Optional.of(client));
        when(healthScreeningRepository.findTopByClientIdOrderByRecordedAtDescIdDesc(6L)).thenReturn(Optional.of(screening));

        ResponseEntity<?> response = manageService.getLatestClientHealthScreening(6L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertThat(response.getBody()).isInstanceOf(HealthScreeningResponse.class);

        HealthScreeningResponse screeningResp = (HealthScreeningResponse) response.getBody();
        assertThat(screeningResp.getScreeningId()).isEqualTo(103L);
        assertThat(screeningResp.isCardiacConditions()).isTrue();
        assertThat(screeningResp.isHighRisk()).isTrue();
        assertThat(screeningResp.isMemberHighRisk()).isTrue();
    }

    @Test
    void shouldReturnNotFoundWhenNoHealthScreeningExists() {
        Client client = Client.builder()
                .id(7)
                .firstName("Frank")
                .lastName("Wilson")
                .email("frank@example.com")
                .build();

        when(clientRepository.findById(7L)).thenReturn(Optional.of(client));
        when(healthScreeningRepository.findTopByClientIdOrderByRecordedAtDescIdDesc(7L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = manageService.getLatestClientHealthScreening(7L);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertThat(response.getBody()).isEqualTo("No health screening records found for this client.");
    }

    @Test
    void shouldReturnNotFoundWhenClientNotFoundForRetrieving() {
        when(clientRepository.findById(999L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = manageService.getLatestClientHealthScreening(999L);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertThat(response.getBody()).isEqualTo("Client not found.");
    }
}
