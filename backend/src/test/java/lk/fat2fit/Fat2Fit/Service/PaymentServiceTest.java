package lk.fat2fit.Fat2Fit.Service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import lk.fat2fit.Fat2Fit.DTO.Payment.MockPaymentConfirmRequest;
import lk.fat2fit.Fat2Fit.DTO.Payment.RecordMembershipPaymentRequest;
import lk.fat2fit.Fat2Fit.DTO.Payment.RecordMembershipPaymentResponse;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.ClientMembership;
import lk.fat2fit.Fat2Fit.Entity.Enum.PaymentMethod;
import lk.fat2fit.Fat2Fit.Entity.MembershipPlan;
import lk.fat2fit.Fat2Fit.Entity.PaymentRecord;
import lk.fat2fit.Fat2Fit.Repository.ClientMembershipRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.MembershipPlanRepository;
import lk.fat2fit.Fat2Fit.Repository.PaymentRecordRepository;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private MembershipPlanRepository membershipPlanRepository;

    @Mock
    private ClientMembershipRepository clientMembershipRepository;

    @Mock
    private PaymentRecordRepository paymentRecordRepository;

    @Mock
    private JavaMailSender javaMailSender;

    @InjectMocks
    private PaymentService paymentService;

    private Client client;
    private MembershipPlan plan;

    @BeforeEach
    void setUp() {
        plan = MembershipPlan.builder()
                .id(5)
                .planName("Premium")
                .durationDays(30)
                .monthlyPrice(BigDecimal.valueOf(4500.00))
                .build();

        client = Client.builder()
                .id(10)
                .firstName("John")
                .lastName("Doe")
                .membershipPlan(plan)
                .membershipEndDate(LocalDate.now().plusDays(10))
                .membershipSuspended(false)
                .isActive(true)
                .build();
    }

    @Test
        void shouldRecordPaymentWhenUserAccountIsActiveEvenIfMembershipExpired() {
        RecordMembershipPaymentRequest request = new RecordMembershipPaymentRequest(
                10L,
                5,
                BigDecimal.valueOf(4500.00),
                LocalDate.of(2026, 3, 30),
                PaymentMethod.CASH,
                null);

                client.setMembershipEndDate(LocalDate.now().minusDays(5));
        when(clientRepository.findById(10L)).thenReturn(Optional.of(client));
        when(paymentRecordRepository.save(any(PaymentRecord.class))).thenAnswer(invocation -> {
            PaymentRecord toSave = invocation.getArgument(0);
            toSave.setId(99L);
            return toSave;
        });

        RecordMembershipPaymentResponse response = paymentService.recordMembershipPayment(request);

        assertEquals(99L, response.getPaymentId());
        assertEquals(10L, response.getClientId());
        assertEquals("John Doe", response.getMemberName());
        assertEquals(5, response.getMembershipPlanId());
        assertEquals(BigDecimal.valueOf(4500.00), response.getPaymentAmount());
        assertEquals(PaymentMethod.CASH, response.getPaymentMethod());
        verify(paymentRecordRepository).save(any(PaymentRecord.class));
    }

    @Test
        void shouldRejectWhenUserAccountIsInactive() {
        RecordMembershipPaymentRequest request = new RecordMembershipPaymentRequest(
                10L,
                5,
                BigDecimal.valueOf(4500.00),
                LocalDate.of(2026, 3, 30),
                PaymentMethod.CASH,
                null);

                client.setIsActive(false);
        when(clientRepository.findById(10L)).thenReturn(Optional.of(client));

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> paymentService.recordMembershipPayment(request));

                assertEquals("Cannot record payment for inactive user account.", exception.getMessage());
    }

    @Test
    void shouldRejectWhenAmountIsInvalid() {
        RecordMembershipPaymentRequest request = new RecordMembershipPaymentRequest(
                10L,
                5,
                BigDecimal.ZERO,
                LocalDate.of(2026, 3, 30),
                PaymentMethod.CASH,
                null);

        when(clientRepository.findById(10L)).thenReturn(Optional.of(client));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> paymentService.recordMembershipPayment(request));

        assertEquals("Payment amount must be greater than zero.", exception.getMessage());
    }

        @Test
        void shouldPersistPaymentRecordWhenMockPaymentIsConfirmed() {
                MockPaymentConfirmRequest request = new MockPaymentConfirmRequest(10, 5, "LOCALPAY-XYZ");

                when(clientRepository.findById(10)).thenReturn(Optional.of(client));
                when(membershipPlanRepository.findById(5)).thenReturn(Optional.of(plan));
                when(clientMembershipRepository.findFirstByClientIdAndPaymentIntentId(10L, "LOCALPAY-XYZ"))
                                .thenReturn(Optional.empty());
                when(clientMembershipRepository.save(any(ClientMembership.class))).thenAnswer(invocation -> invocation.getArgument(0));
                when(clientRepository.save(any(Client.class))).thenAnswer(invocation -> invocation.getArgument(0));
                when(paymentRecordRepository.save(any(PaymentRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

                Map<String, Object> result = paymentService.confirmMockPayment(request);

                assertEquals("SUCCESS", result.get("status"));
                verify(paymentRecordRepository).save(any(PaymentRecord.class));
        }
}
