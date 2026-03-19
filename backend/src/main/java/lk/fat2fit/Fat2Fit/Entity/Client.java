package lk.fat2fit.Fat2Fit.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Entity
@PrimaryKeyJoinColumn(name = "id")
@Table(name = "Client")
public class Client extends User {
    @Lob
    @Column(name = "digital_signature", columnDefinition = "LONGBLOB")
    private byte[] digitalSignature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_membership_id")
    private ClientMembership currentMembership;
}