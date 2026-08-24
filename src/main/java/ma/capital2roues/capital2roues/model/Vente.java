package ma.capital2roues.capital2roues.model;

import ma.capital2roues.capital2roues.model.enums.StatutVente;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "ventes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vente {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne @JoinColumn(name = "client_id", nullable = false) private Client client;
    @Column(name = "date_vente", updatable = false) private LocalDateTime dateVente;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal total;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private StatutVente statut = StatutVente.PAYEE;
    @ManyToOne @JoinColumn(name = "utilisateur_id", nullable = false) private Utilisateur utilisateur;
    @OneToMany(mappedBy = "vente", cascade = CascadeType.ALL, orphanRemoval = true) private List<LigneVente> lignes;
    @PrePersist protected void onCreate() { dateVente = LocalDateTime.now(); }
}