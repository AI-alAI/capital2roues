package ma.capital2roues.capital2roues.model;

import com.fasterxml.jackson.annotation.JsonIgnore;  // <-- AJOUTER CET IMPORT
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "produits")
public class Produit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 100) private String nom;
    @Column(unique = true, nullable = false, length = 50) private String reference;
    @Column(unique = true, length = 50) private String vin;
    private Integer annee;
    private String couleur;
    @Column(name = "prix_achat", precision = 10, scale = 2, nullable = false) private BigDecimal prixAchat;
    @Column(name = "prix_vente", precision = 10, scale = 2, nullable = false) private BigDecimal prixVente;
    @Column(name = "quantite_stock", nullable = false) private Integer quantiteStock = 0;
    private String garantie;
    
    @ManyToOne
    @JoinColumn(name = "categorie_id")
    @JsonIgnore  // <-- AJOUTER CECI POUR ÉVITER LA RÉCURSION
    private Categorie categorie;
    
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    // Getters et Setters...
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public String getVin() { return vin; }
    public void setVin(String vin) { this.vin = vin; }
    public Integer getAnnee() { return annee; }
    public void setAnnee(Integer annee) { this.annee = annee; }
    public String getCouleur() { return couleur; }
    public void setCouleur(String couleur) { this.couleur = couleur; }
    public BigDecimal getPrixAchat() { return prixAchat; }
    public void setPrixAchat(BigDecimal prixAchat) { this.prixAchat = prixAchat; }
    public BigDecimal getPrixVente() { return prixVente; }
    public void setPrixVente(BigDecimal prixVente) { this.prixVente = prixVente; }
    public Integer getQuantiteStock() { return quantiteStock; }
    public void setQuantiteStock(Integer quantiteStock) { this.quantiteStock = quantiteStock; }
    public String getGarantie() { return garantie; }
    public void setGarantie(String garantie) { this.garantie = garantie; }
    public Categorie getCategorie() { return categorie; }
    public void setCategorie(Categorie categorie) { this.categorie = categorie; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}