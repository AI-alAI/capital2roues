package ma.capital2roues.capital2roues.controller;

import ma.capital2roues.capital2roues.dto.UtilisateurDTO;
import ma.capital2roues.capital2roues.dto.UtilisateurRequestDTO;
import ma.capital2roues.capital2roues.model.Utilisateur;
import ma.capital2roues.capital2roues.model.enums.Role;
import ma.capital2roues.capital2roues.service.UtilisateurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class UtilisateurController {

    @Autowired
    private UtilisateurService utilisateurService;

    // =============================================
    // 1. ENDPOINTS EXISTANTS (modifiés)
    // =============================================

    @GetMapping("/utilisateurs")
    public ResponseEntity<Map<String, Object>> getAllUtilisateurs(
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<Utilisateur> utilisateursPage = utilisateurService.findAll(pageable);
        
        List<UtilisateurDTO> utilisateursDTO = utilisateursPage.getContent()
                .stream()
                .map(utilisateurService::toDTO)
                .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", utilisateursDTO);
        response.put("currentPage", utilisateursPage.getNumber());
        response.put("totalItems", utilisateursPage.getTotalElements());
        response.put("totalPages", utilisateursPage.getTotalPages());
        response.put("size", utilisateursPage.getSize());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/utilisateurs/{id}")
    public ResponseEntity<UtilisateurDTO> getUtilisateurById(@PathVariable Long id) {
        Utilisateur utilisateur = utilisateurService.findById(id);
        return ResponseEntity.ok(utilisateurService.toDTO(utilisateur));
    }

    @PostMapping("/utilisateurs")
    public ResponseEntity<?> createUtilisateur(@RequestBody UtilisateurRequestDTO dto) {
        try {
            Utilisateur utilisateur = utilisateurService.create(dto);
            return new ResponseEntity<>(utilisateurService.toDTO(utilisateur), HttpStatus.CREATED);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PutMapping("/utilisateurs/{id}")
    public ResponseEntity<UtilisateurDTO> updateUtilisateur(@PathVariable Long id, @RequestBody UtilisateurRequestDTO dto) {
        Utilisateur utilisateur = utilisateurService.update(id, dto);
        return ResponseEntity.ok(utilisateurService.toDTO(utilisateur));
    }

    @DeleteMapping("/utilisateurs/{id}")
    public ResponseEntity<Void> deleteUtilisateur(@PathVariable Long id) {
        utilisateurService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // =============================================
    // 2. NOUVEAUX ENDPOINTS POUR LA PARTIE CLIENT
    // =============================================

    /**
     * Connexion client
     * POST /api/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        try {
            String email = loginRequest.get("email");
            String motDePasse = loginRequest.get("motDePasse");

            // Validation
            if (email == null || email.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "L'email est requis");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            if (motDePasse == null || motDePasse.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Le mot de passe est requis");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            // Rechercher l'utilisateur
            Utilisateur utilisateur = utilisateurService.findByEmail(email.trim());

            if (utilisateur == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Email ou mot de passe incorrect");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }

            // Vérifier le mot de passe
            if (!motDePasse.equals(utilisateur.getMotDePasse())) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Email ou mot de passe incorrect");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }

            // Vérifier que c'est un CLIENT
            if (utilisateur.getRole() != Role.CLIENT) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Ce compte n'est pas un compte client");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            // Succès
            UtilisateurDTO userDTO = utilisateurService.toDTO(utilisateur);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Connexion réussie");
            response.put("user", userDTO);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur lors de la connexion: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Inscription client
     * POST /api/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> registerRequest) {
        try {
            String nom = registerRequest.get("nom");
            String prenom = registerRequest.get("prenom");
            String email = registerRequest.get("email");
            String telephone = registerRequest.get("telephone");
            String adresse = registerRequest.get("adresse");
            String password = registerRequest.get("password");
            String confirmPassword = registerRequest.get("confirmPassword");

            // Validations
            if (nom == null || nom.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Le nom est requis");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            if (prenom == null || prenom.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Le prénom est requis");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            if (email == null || email.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "L'email est requis");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            if (password == null || password.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Le mot de passe est requis");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            if (password.length() < 6) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Le mot de passe doit contenir au moins 6 caractères");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            if (!password.equals(confirmPassword)) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Les mots de passe ne correspondent pas");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            // Vérifier si l'email existe déjà
            if (utilisateurService.findByEmail(email.trim()) != null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Cet email est déjà utilisé");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            // Créer l'utilisateur
            UtilisateurRequestDTO dto = new UtilisateurRequestDTO();
            dto.setNom(nom.trim());
            dto.setPrenom(prenom.trim());
            dto.setEmail(email.trim());
            dto.setMotDePasse(password);
            dto.setRole(Role.CLIENT.toString());

            Utilisateur nouvelUtilisateur = utilisateurService.create(dto);

            // Succès
            UtilisateurDTO userDTO = utilisateurService.toDTO(nouvelUtilisateur);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Compte créé avec succès !");
            response.put("user", userDTO);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur lors de l'inscription: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}