package ma.capital2roues.capital2roues.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDTO {
    // Statistiques générales
    private BigDecimal chiffreAffairesTotal;
    private Long nombreVentes;
    private Long nombreProduits;
    private Long nombreClients;
    private Long stockFaible;
    
    // Détails
    private List<VenteRecenteDTO> ventesRecentes;
    private List<ProduitTopDTO> topProduits;
    private Map<String, BigDecimal> ventesParMois;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VenteRecenteDTO {
        private Long id;
        private String clientNom;
        private String clientPrenom;
        private BigDecimal total;
        private String date;
        private String statut;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProduitTopDTO {
        private Long id;
        private String nom;
        private Long quantiteVendue;
        private BigDecimal totalVentes;
    }
}