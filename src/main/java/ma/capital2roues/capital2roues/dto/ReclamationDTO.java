package ma.capital2roues.capital2roues.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReclamationDTO {
    private Long id;
    private Long clientId;
    private String clientNom;
    private String clientPrenom;
    private Long venteId;
    private String sujet;
    private String description;
    private String type;
    private String priorite;
    private String statut;
    private LocalDateTime dateCreation;
    private LocalDateTime dateTraitement;
    private String reponse;
    private Long traitePar;
    private String traiteParNom;
    private Integer satisfaction;
}