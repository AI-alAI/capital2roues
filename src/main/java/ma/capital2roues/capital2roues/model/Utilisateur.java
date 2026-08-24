package ma.capital2roues.capital2roues.model;

import ma.capital2roues.capital2roues.model.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "utilisateurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Utilisateur {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 50) private String nom;
    @Column(nullable = false, length = 50) private String prenom;
    @Column(unique = true, nullable = false, length = 100) private String email;
    @Column(name = "mot_de_passe", nullable = false) private String motDePasse;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Role role;
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}