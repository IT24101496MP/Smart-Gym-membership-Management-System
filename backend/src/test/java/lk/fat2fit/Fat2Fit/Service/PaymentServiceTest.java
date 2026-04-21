package lk.fat2fit.Fat2Fit.Service;

import lk.fat2fit.Fat2Fit.DTO.Payment.RecordMembershipPaymentRequest;
import lk.fat2fit.Fat2Fit.DTO.Payment.RecordMembershipPaymentResponse;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.MembershipPlan;
import lk.fat2fit.Fat2Fit.Entity.PaymentRecord;
import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipPlanStatus;
import lk.fat2fit.Fat2Fit.Entity.Enum.PaymentMethod;
import lk.fat2fit.Fat2Fit.Repository.ClientMembershipRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.MembershipPlanRepository;
import lk.fat2fit.Fat2Fit.Repository.PaymentRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mail.javamail.JavaMailSender;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

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

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void shouldPreventDuplicatePaymentByReferenceNumber() {
        MembershipPlan plan = MembershipPlan.builder()
                .id(1)
                .planName("Standard")
                .durationDays(30)
                .monthlyPrice(new BigDecimal("5000.00"))
                .status(MembershipPlanStatus.ACTIVE)
                .build();

        Client client = Client.builder()
                .id(10)
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .isActive(true)
                .membershipPlan(plan)
                .build();

        RecordMembershipPaymentRequest request = new RecordMembershipPaymentRequest();
        request.setClientId(10L);
        request.setMembershipPlanId(1);
        request.setPaymentAmount(new BigDecimal("5000.00"));
        request.setPaymentDate(LocalDate.now());
        request.setPaymentMethod(PaymentMethod.CARD);
        request.setReferenceNumber("TXN-123");

        when(clientRepository.findById(10)).thenReturn(Optional.of(client));
        when(paymentRecordRepository.findFirstByClientIdAndReferenceNumberAndPaymentMethodOrderByIdDesc(
                10L,
                "TXN-123",
                PaymentMethod.CARD)).thenReturn(Optional.of(PaymentRecord.builder().id(99L).build()));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> paymentService.recordMembershipPayment(request));

        assertThat(ex.getMessage()).contains("Duplicate payment submission detected");
    }

    @Test
    void shouldRecordPaymentButFlagWhenEmailIsMissing() {
        MembershipPlan plan = MembershipPlan.builder()
                .id(2)
                .planName("Premium")
                .durationDays(30)
                .monthlyPrice(new BigDecimal("9000.00"))
                .status(MembershipPlanStatus.ACTIVE)
                .build();

        Client client = Client.builder()
                .id(20)
                .firstName("Jane")
                .lastName("Smith")
                .email(null)
                .isActive(true)
                .membershipPlan(plan)
                .build();

        RecordMembershipPaymentRequest request = new RecordMembershipPaymentRequest();
        request.setClientId(20L);
        request.setMembershipPlanId(2);
        request.setPaymentAmount(new BigDecimal("9000.00"));
        request.setPaymentDate(LocalDate.now());
        request.setPaymentMethod(PaymentMethod.CASH);

        AtomicReference<PaymentRecord> savedRef = new AtomicReference<>();

        when(clientRepository.findById(20)).thenReturn(Optional.of(client));
        when(paymentRecordRepository.existsByClientIdAndMembershipPlanIdAndAmountAndPaymentDateAndPaymentMethod(
                20L,
                2,
                new BigDecimal("9000.00"),
                request.getPaymentDate(),
                PaymentMethod.CASH)).thenReturn(false);
        when(paymentRecordRepository.save(any(PaymentRecord.class))).thenAnswer(invocation -> {
            PaymentRecord record = invocation.getArgument(0);
            if (record.getId() == null) {
                record.setId(1L);
            }
            savedRef.set(record);
            return record;
        });
        when(paymentRecordRepository.findById(anyLong())).thenAnswer(invocation -> Optional.ofNullable(savedRef.get()));

        RecordMembershipPaymentResponse response = paymentService.recordMembershipPayment(request);

        assertThat(response.getPaymentId()).isEqualTo(1L);
        assertThat(response.getReceiptGenerated()).isTrue();
        assertThat(response.getEmailSent()).isFalse();
        assertThat(response.getWarningMessage()).contains("missing");
    }
}
