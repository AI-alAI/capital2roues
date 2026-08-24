package ma.capital2roues.capital2roues.dto;

public class CategorieDTO {
    private Long id;
    private String nom;
    private String description;

    // Constructeurs
    public CategorieDTO() {}
    
    public CategorieDTO(Long id, String nom, String description) {
        this.id = id;
        this.nom = nom;
        this.description = description;
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}