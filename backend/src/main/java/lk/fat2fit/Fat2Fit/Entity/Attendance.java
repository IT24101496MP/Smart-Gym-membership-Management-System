package lk.fat2fit.Fat2Fit.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "attendance")
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "client_name", nullable = false)
    private String clientName;

    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @Column(name = "check_in_time", nullable = false, updatable = false)
    private LocalDateTime checkInTime;
}