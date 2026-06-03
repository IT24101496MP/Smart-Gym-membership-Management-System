package lk.fat2fit.Fat2Fit.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import lk.fat2fit.Fat2Fit.DTO.Manage.AssignFitnessGoalRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.FitnessGoalResponse;
import lk.fat2fit.Fat2Fit.DTO.Manage.UpdateMyFitnessGoalRequest;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.ClientFitnessGoal;
import lk.fat2fit.Fat2Fit.Entity.Enum.FitnessGoal;
import lk.fat2fit.Fat2Fit.Entity.Enum.FitnessGoalStatus;
import lk.fat2fit.Fat2Fit.Entity.Enum.Role;
import lk.fat2fit.Fat2Fit.Entity.MembershipPlan;
import lk.fat2fit.Fat2Fit.Entity.User;
import lk.fat2fit.Fat2Fit.Repository.ClientFitnessGoalRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientHealthScreeningRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientMeasurementRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.MembershipPlanRepository;
import lk.fat2fit.Fat2Fit.Repository.UserRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ManageServiceFitnessGoalsTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ClientFitnessGoalRepository clientFitnessGoalRepository;

    @Mock
    private ClientHealthScreeningRepository healthScreeningRepository;

    @Mock
    private ClientMeasurementRepository measurementRepository;

    @Mock
    private MembershipPlanRepository membershipPlanRepository;

    @InjectMocks
    private ManageService manageService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldAssignFitnessGoalWhenInstructorSubmitsValidRequest() {
        setAuthentication("instructor@fat2fit.lk", "ROLE_INSTRUCTOR");

        User instructor = userWithRole(900, "instructor@fat2fit.lk", Role.INSTRUCTOR);
        Client client = client(101, "client101@fat2fit.lk");
        AssignFitnessGoalRequest request = validAssignmentRequest(FitnessGoal.ENDURANCE_DEVELOPING);

        when(userRepository.findByEmail("instructor@fat2fit.lk")).thenReturn(Optional.of(instructor));
        when(clientRepository.findById(101L)).thenReturn(Optional.of(client));
        when(clientFitnessGoalRepository.findByClientIdAndStatus(101L, FitnessGoalStatus.ACTIVE)).thenReturn(List.of());
        when(clientFitnessGoalRepository.save(any(ClientFitnessGoal.class))).thenAnswer(invocation -> {
            ClientFitnessGoal goal = invocation.getArgument(0);
            goal.setId(1L);
            return goal;
        });

        ResponseEntity<?> response = manageService.assignClientFitnessGoal(101L, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertInstanceOf(FitnessGoalResponse.class, response.getBody());
        FitnessGoalResponse payload = (FitnessGoalResponse) response.getBody();
        assertEquals(FitnessGoal.ENDURANCE_DEVELOPING, payload.getGoal());
        assertEquals(FitnessGoalStatus.ACTIVE, payload.getStatus());
        assertEquals(true, payload.getApprovedByInstructor());
    }

    @Test
    void shouldRejectInstructorAssignmentWhenGoalConflictsWithActiveGoal() {
        setAuthentication("instructor@fat2fit.lk", "ROLE_INSTRUCTOR");

        User instructor = userWithRole(901, "instructor@fat2fit.lk", Role.INSTRUCTOR);
        Client client = client(102, "client102@fat2fit.lk");
        AssignFitnessGoalRequest request = validAssignmentRequest(FitnessGoal.FAT_BURNING);

        ClientFitnessGoal activeConflictingGoal = ClientFitnessGoal.builder()
                .id(77L)
                .client(client)
                .goal(FitnessGoal.MUSCLE_GAIN)
                .instructorRequirements("Existing active goal")
                .status(FitnessGoalStatus.ACTIVE)
                .assignedBy(instructor)
                .approvedByInstructor(true)
                .build();

        when(userRepository.findByEmail("instructor@fat2fit.lk")).thenReturn(Optional.of(instructor));
        when(clientRepository.findById(102L)).thenReturn(Optional.of(client));
        when(clientFitnessGoalRepository.findByClientIdAndStatus(102L, FitnessGoalStatus.ACTIVE))
                .thenReturn(List.of(activeConflictingGoal));

        ResponseEntity<?> response = manageService.assignClientFitnessGoal(102L, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertTrue(String.valueOf(response.getBody()).contains("conflicts"));
        verify(clientFitnessGoalRepository, never()).save(any(ClientFitnessGoal.class));
    }

    @Test
    void shouldRejectClientActivationWhenGoalNotAssignedByInstructor() {
        setAuthentication("client@fat2fit.lk", "ROLE_CLIENT");

        Client self = client(103, "client@fat2fit.lk");
        User nonInstructorAssigner = userWithRole(902, "client-assigner@fat2fit.lk", Role.CLIENT);
        ClientFitnessGoal goal = ClientFitnessGoal.builder()
                .id(501L)
                .client(self)
                .goal(FitnessGoal.CARDIO_TRAINING)
                .instructorRequirements("Do cardio consistently")
                .status(FitnessGoalStatus.ABANDONED)
                .assignedBy(nonInstructorAssigner)
                .approvedByInstructor(true)
                .build();

        UpdateMyFitnessGoalRequest request = new UpdateMyFitnessGoalRequest();
        request.setStatus(FitnessGoalStatus.ACTIVE);

        when(userRepository.findByEmail("client@fat2fit.lk")).thenReturn(Optional.of(self));
        when(clientFitnessGoalRepository.findByIdAndClientId(501L, 103L)).thenReturn(Optional.of(goal));

        ResponseEntity<?> response = manageService.updateMyFitnessGoal(501L, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Goal activation is allowed only for instructor-assigned goals.", response.getBody());
        verify(clientFitnessGoalRepository, never()).save(any(ClientFitnessGoal.class));
    }

    @Test
    void shouldAllowClientToMarkGoalAsAchieved() {
        setAuthentication("client-achieved@fat2fit.lk", "ROLE_CLIENT");

        Client self = client(104, "client-achieved@fat2fit.lk");
        User instructor = userWithRole(903, "coach@fat2fit.lk", Role.INSTRUCTOR);
        ClientFitnessGoal goal = ClientFitnessGoal.builder()
                .id(601L)
                .client(self)
                .goal(FitnessGoal.PHYSICAL_FITNESS)
                .instructorRequirements("Complete the weekly routine")
                .status(FitnessGoalStatus.ACTIVE)
                .assignedBy(instructor)
                .approvedByInstructor(true)
                .build();

        UpdateMyFitnessGoalRequest request = new UpdateMyFitnessGoalRequest();
        request.setStatus(FitnessGoalStatus.ACHIEVED);
        request.setProgressPercent(100);
        request.setProgressNotes("Completed all required sessions");

        when(userRepository.findByEmail("client-achieved@fat2fit.lk")).thenReturn(Optional.of(self));
        when(clientFitnessGoalRepository.findByIdAndClientId(601L, 104L)).thenReturn(Optional.of(goal));
        when(clientFitnessGoalRepository.save(any(ClientFitnessGoal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<?> response = manageService.updateMyFitnessGoal(601L, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertInstanceOf(FitnessGoalResponse.class, response.getBody());
        FitnessGoalResponse payload = (FitnessGoalResponse) response.getBody();
        assertEquals(FitnessGoalStatus.ACHIEVED, payload.getStatus());
        assertEquals(100, payload.getProgressPercent());
        verify(clientFitnessGoalRepository, times(1)).save(any(ClientFitnessGoal.class));
    }

    private AssignFitnessGoalRequest validAssignmentRequest(FitnessGoal goal) {
        AssignFitnessGoalRequest request = new AssignFitnessGoalRequest();
        request.setGoal(goal);
        request.setInstructorRequirements("Structured weekly training plan");
        request.setAllowTargetWeightUpdate(true);
        request.setAllowTargetParametersUpdate(true);
        request.setAllowTargetDateUpdate(true);
        request.setTargetWeightKg(BigDecimal.valueOf(72.5));
        request.setTargetParameters("4 sessions/week");
        request.setTargetCompletionDate(LocalDate.now().plusDays(30));
        request.setProgressPercent(10);
        request.setStatus(FitnessGoalStatus.ACTIVE);
        return request;
    }

    private Client client(int id, String email) {
        Client client = Client.builder().membershipPlan((MembershipPlan) null).build();
        client.setId(id);
        client.setRole(Role.CLIENT);
        client.setEmail(email);
        return client;
    }

    private User userWithRole(int id, String email, Role role) {
        User user = User.builder().email(email).role(role).build();
        user.setId(id);
        return user;
    }

    private void setAuthentication(String email, String role) {
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                email,
                null,
                List.of(new SimpleGrantedAuthority(role)));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}