package ma.capital2roues.capital2roues.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UtilisateurRequestDTO {
    private String nom;
    private String prenom;
    private String email;
    private String motDePasse;
    private String role;
}