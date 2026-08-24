package ma.capital2roues.capital2roues.model;

import com.fasterxml.jackson.annotation.JsonIgnore;  // <-- AJOUTER CET IMPORT
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "categories")
public class Categorie {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true, length = 50) private String nom;
    private String description;
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "categorie")
    @JsonIgnore  // <-- AJOUTER CECI POUR ÉVITER LA RÉCURSION
    private List<Produit> produits;
    
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    // Getters et Setters...
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<Produit> getProduits() { return produits; }
    public void setProduits(List<Produit> produits) { this.produits = produits; }
}