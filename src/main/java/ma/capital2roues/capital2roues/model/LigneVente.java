package ma.capital2roues.capital2roues.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "lignes_vente")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LigneVente {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne @JoinColumn(name = "vente_id", nullable = false) @JsonIgnore private Vente vente;
    @ManyToOne @JoinColumn(name = "produit_id", nullable = false) private Produit produit;
    @Column(nullable = false) private Integer quantite;
    @Column(name = "prix_unitaire", nullable = false, precision = 10, scale = 2) private BigDecimal prixUnitaire;
    @Column(name = "total_ligne", nullable = false, precision = 10, scale = 2) private BigDecimal totalLigne;
}