package ma.capital2roues.capital2roues.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProduitDTO {
    private Long id;
    private String nom;
    private String reference;
    private String vin;
    private Integer annee;
    private String couleur;
    private BigDecimal prixAchat;
    private BigDecimal prixVente;
    private Integer quantiteStock;
    private String garantie;
    private Long categorieId;
    private String categorieNom;
}