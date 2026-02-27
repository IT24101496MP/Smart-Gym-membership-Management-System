package lk.fat2fit.Fat2Fit.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Entity
@Table(name = "Client")
@PrimaryKeyJoinColumn(name = "id")
public class Client extends User {
    @Lob
    @Column(name = "digital_signature", columnDefinition = "LONGBLOB")
    private byte[] digitalSignature;


}