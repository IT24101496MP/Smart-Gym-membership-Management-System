package lk.fat2fit.Fat2Fit.Service;

import lk.fat2fit.Fat2Fit.DTO.Membership.MembershipRenewalRequest;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.ClientMembership;
import lk.fat2fit.Fat2Fit.Entity.MembershipPlan;
import lk.fat2fit.Fat2Fit.Entity.User;
import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipPlanStatus;
import lk.fat2fit.Fat2Fit.Repository.ClientMembershipRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.MembershipPlanRepository;
import lk.fat2fit.Fat2Fit.Repository.UserRepository;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClientMembershipServiceTest {

    @Mock
    private ClientMembershipRepository clientMembershipRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private MembershipPlanRepository membershipPlanRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ClientMembershipService clientMembershipService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldRejectOverlappingRenewalForInstructor() {
        setAuthentication("instructor@fat2fit.lk", "ROLE_INSTRUCTOR");

        Client client = clientWithActiveMembership(10);
        MembershipPlan plan = activePlan(1, 30);
        ClientMembership current = activeMembership(client, plan, LocalDate.now().minusDays(2), LocalDate.now().plusDays(8));

        when(userRepository.findByEmail("instructor@fat2fit.lk")).thenReturn(Optional.of(actor(200, "instructor@fat2fit.lk")));
        when(clientRepository.findById(10)).thenReturn(Optional.of(client));
        when(clientMembershipRepository.findByClientIdOrderByIdDesc(10L)).thenReturn(List.of(current));
        when(clientMembershipRepository.findFirstByClientIdAndStatusInOrderByExpiryDateDescIdDesc(any(), any())).thenReturn(Optional.of(current));
        when(membershipPlanRepository.findById(1)).thenReturn(Optional.of(plan));

        MembershipRenewalRequest request = new MembershipRenewalRequest();
        request.setClientId(10L);
        request.setPlanId(1);
        request.setRenewalDate(LocalDate.now());

        ResponseEntity<?> response = clientMembershipService.renewMembership(request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertInstanceOf(Map.class, response.getBody());
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) response.getBody();
        assertEquals(true, payload.get("overlapDetected"));
        assertEquals(false, payload.get("overrideAllowed"));
        verify(auditLogService, never()).logChange(anyInt(), any(String.class), any(Long.class), any(String.class), any(String.class), any(String.class));
    }

    @Test
    void shouldAllowAdminOverrideAndLogOverlapRenewal() {
        setAuthentication("admin@fat2fit.lk", "ROLE_ADMIN");

        Client client = clientWithActiveMembership(15);
        MembershipPlan plan = activePlan(2, 30);
        ClientMembership current = activeMembership(client, plan, LocalDate.now().minusDays(1), LocalDate.now().plusDays(15));

        when(userRepository.findByEmail("admin@fat2fit.lk")).thenReturn(Optional.of(actor(1, "admin@fat2fit.lk")));
        when(clientRepository.findById(15)).thenReturn(Optional.of(client));
        when(clientMembershipRepository.findByClientIdOrderByIdDesc(15L)).thenReturn(List.of(current));
        when(clientMembershipRepository.findFirstByClientIdAndStatusInOrderByExpiryDateDescIdDesc(any(), any())).thenReturn(Optional.of(current));
        when(membershipPlanRepository.findById(2)).thenReturn(Optional.of(plan));
        when(clientMembershipRepository.save(any(ClientMembership.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MembershipRenewalRequest request = new MembershipRenewalRequest();
        request.setClientId(15L);
        request.setPlanId(2);
        request.setRenewalDate(LocalDate.now());
        request.setOverrideOverlap(true);

        ResponseEntity<?> response = clientMembershipService.renewMembership(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(auditLogService, times(1)).logChange(anyInt(), any(String.class), any(Long.class), any(String.class), any(String.class), any(String.class));
        verify(clientRepository, times(1)).save(client);
    }

    private void setAuthentication(String email, String role) {
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                email,
                null,
                List.of(new SimpleGrantedAuthority(role)));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private User actor(int id, String email) {
        User user = User.builder().email(email).build();
        user.setId(id);
        return user;
    }

    private Client clientWithActiveMembership(int id) {
        MembershipPlan currentPlan = activePlan(9, 30);
        Client client = Client.builder()
                .membershipPlan(currentPlan)
                .membershipStartDate(LocalDate.now().minusDays(3))
                .membershipEndDate(LocalDate.now().plusDays(20))
                .membershipSuspended(false)
                .build();
        client.setId(id);
        client.setEmail("client" + id + "@fat2fit.lk");
        return client;
    }

    private MembershipPlan activePlan(int id, int durationDays) {
        return MembershipPlan.builder()
                .id(id)
                .planName("Plan-" + id)
                .durationDays(durationDays)
                .monthlyPrice(BigDecimal.valueOf(7500))
                .admissionFee(BigDecimal.valueOf(1500))
                .maximumMembers(200)
                .status(MembershipPlanStatus.ACTIVE)
                .build();
    }

    private ClientMembership activeMembership(Client client, MembershipPlan plan, LocalDate startDate, LocalDate expiryDate) {
        ClientMembership membership = new ClientMembership();
        membership.setClient(client);
        membership.setMembershipPlan(plan);
        membership.setStartDate(startDate);
        membership.setExpiryDate(expiryDate);
        membership.setStatus(MembershipPlanStatus.ACTIVE);
        return membership;
    }
}
