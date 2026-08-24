package ma.capital2roues.capital2roues.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VenteRequestDTO {
    private Long clientId;
    private Long utilisateurId;
    private List<LigneVenteDTO> lignes;
}