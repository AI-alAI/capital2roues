package ma.capital2roues.capital2roues.model;

import ma.capital2roues.capital2roues.model.enums.TypeMouvement;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mouvements_stock")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MouvementStock {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne @JoinColumn(name = "produit_id", nullable = false) private Produit produit;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private TypeMouvement type;
    @Column(nullable = false) private Integer quantite;
    @Column(name = "date_mouvement", updatable = false) private LocalDateTime dateMouvement;
    @Column(length = 255) private String commentaire;
    @PrePersist protected void onCreate() { dateMouvement = LocalDateTime.now(); }
}