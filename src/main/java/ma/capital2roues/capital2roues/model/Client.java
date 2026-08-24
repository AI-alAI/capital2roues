package ma.capital2roues.capital2roues.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "clients")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Client {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 50) private String nom;
    @Column(nullable = false, length = 50) private String prenom;
    @Column(length = 20) private String telephone;
    @Column(unique = true, length = 100) private String email;
    @Column(columnDefinition = "TEXT") private String adresse;
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}