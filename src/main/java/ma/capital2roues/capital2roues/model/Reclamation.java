package ma.capital2roues.capital2roues.model;

import ma.capital2roues.capital2roues.model.enums.PrioriteReclamation;
import ma.capital2roues.capital2roues.model.enums.StatutReclamation;
import ma.capital2roues.capital2roues.model.enums.TypeReclamation;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "reclamations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reclamation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne
    @JoinColumn(name = "vente_id")
    private Vente vente;

    @Column(nullable = false, length = 100)
    private String sujet;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeReclamation type;

    @Enumerated(EnumType.STRING)
    private PrioriteReclamation priorite = PrioriteReclamation.MOYENNE;

    @Enumerated(EnumType.STRING)
    private StatutReclamation statut = StatutReclamation.EN_ATTENTE;

    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_traitement")
    private LocalDateTime dateTraitement;

    @Column(columnDefinition = "TEXT")
    private String reponse;

    @ManyToOne
    @JoinColumn(name = "traite_par")
    private Utilisateur traitePar;

 private Integer satisfaction;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }
}