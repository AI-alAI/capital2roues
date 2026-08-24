package ma.capital2roues.capital2roues.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VenteResponseDTO {
    private Long id;
    private Long clientId;
    private String clientNom;
    private String clientPrenom;
    private Long utilisateurId;
    private String utilisateurNom;
    private LocalDateTime dateVente;
    private BigDecimal total;
    private String statut;
    private List<LigneVenteDTO> lignes;
}