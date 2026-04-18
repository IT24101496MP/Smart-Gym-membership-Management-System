package lk.fat2fit.Fat2Fit.Service;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import lk.fat2fit.Fat2Fit.DTO.Manage.HealthScreeningRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.HealthScreeningResponse;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.ClientHealthScreening;
import lk.fat2fit.Fat2Fit.Repository.ClientHealthScreeningRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientMeasurementRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.MembershipPlanRepository;
import lk.fat2fit.Fat2Fit.Repository.UserRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ManageServiceHealthScreeningTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ClientHealthScreeningRepository healthScreeningRepository;

    @Mock
    private ClientMeasurementRepository measurementRepository;

    @Mock
    private MembershipPlanRepository membershipPlanRepository;

    @InjectMocks
    private ManageService manageService;

    @Test
    void shouldMarkMemberHighRiskWhenAnyAnswerIsYes() {
        Client client = client(101);
        HealthScreeningRequest request = fullyAnsweredRequest(false);
        request.setCardiacConditions(true);

        when(clientRepository.findById(101L)).thenReturn(Optional.of(client));
        when(healthScreeningRepository.save(any(ClientHealthScreening.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(clientRepository.save(any(Client.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<?> response = manageService.saveClientHealthScreening(101L, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertInstanceOf(HealthScreeningResponse.class, response.getBody());

        HealthScreeningResponse payload = (HealthScreeningResponse) response.getBody();
        assertEquals(true, payload.isHighRisk());
        assertEquals(true, payload.isMemberHighRisk());

        ArgumentCaptor<ClientHealthScreening> screeningCaptor = ArgumentCaptor.forClass(ClientHealthScreening.class);
        verify(healthScreeningRepository).save(screeningCaptor.capture());
        assertEquals(true, screeningCaptor.getValue().isHighRisk());

        ArgumentCaptor<Client> clientCaptor = ArgumentCaptor.forClass(Client.class);
        verify(clientRepository).save(clientCaptor.capture());
        assertEquals(true, clientCaptor.getValue().getHighRiskMember());
    }

    @Test
    void shouldKeepMemberNormalWhenAllAnswersAreNo() {
        Client client = client(102);
        HealthScreeningRequest request = fullyAnsweredRequest(false);

        when(clientRepository.findById(102L)).thenReturn(Optional.of(client));
        when(healthScreeningRepository.save(any(ClientHealthScreening.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(clientRepository.save(any(Client.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<?> response = manageService.saveClientHealthScreening(102L, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertInstanceOf(HealthScreeningResponse.class, response.getBody());

        HealthScreeningResponse payload = (HealthScreeningResponse) response.getBody();
        assertEquals(false, payload.isHighRisk());
        assertEquals(false, payload.isMemberHighRisk());
    }

    @Test
    void shouldRejectSubmissionWhenAnyResponseIsMissing() {
        Client client = client(103);
        HealthScreeningRequest request = fullyAnsweredRequest(false);
        request.setCurrentMedications(null);

        when(clientRepository.findById(103L)).thenReturn(Optional.of(client));

        ResponseEntity<?> response = manageService.saveClientHealthScreening(103L, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("All required questionnaire responses must be provided.", response.getBody());
        verify(healthScreeningRepository, never()).save(any(ClientHealthScreening.class));
        verify(clientRepository, never()).save(any(Client.class));
    }

    private Client client(int id) {
        Client client = Client.builder().highRiskMember(false).build();
        client.setId(id);
        return client;
    }

    private HealthScreeningRequest fullyAnsweredRequest(boolean answer) {
        return HealthScreeningRequest.builder()
                .cardiacConditions(answer)
                .respiratoryIssues(answer)
                .faintingOrBalanceProblems(answer)
                .jointOrMuscleDisorders(answer)
                .highBloodPressure(answer)
                .cholesterolLevels(answer)
                .currentMedications(answer)
                .disabilitiesOrPhysicalLimitations(answer)
                .additionalNotes("test")
                .build();
    }
}