package ma.capital2roues.capital2roues.service;

import ma.capital2roues.capital2roues.dto.ReclamationDTO;
import ma.capital2roues.capital2roues.dto.TraitementReclamationDTO;
import ma.capital2roues.capital2roues.model.Client;
import ma.capital2roues.capital2roues.model.Reclamation;
import ma.capital2roues.capital2roues.model.Utilisateur;
import ma.capital2roues.capital2roues.model.Vente;
import ma.capital2roues.capital2roues.model.enums.PrioriteReclamation;
import ma.capital2roues.capital2roues.model.enums.StatutReclamation;
import ma.capital2roues.capital2roues.model.enums.TypeReclamation;
import ma.capital2roues.capital2roues.repository.ClientRepository;
import ma.capital2roues.capital2roues.repository.ReclamationRepository;
import ma.capital2roues.capital2roues.repository.UtilisateurRepository;
import ma.capital2roues.capital2roues.repository.VenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReclamationService {

    @Autowired
    private ReclamationRepository reclamationRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private VenteRepository venteRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    // Récupérer toutes les réclamations (Admin)
    public Page<Reclamation> findAll(Pageable pageable) {
        return reclamationRepository.findAll(pageable);
    }

    // Récupérer les réclamations d'un client
    public List<ReclamationDTO> findByClient(Long clientId) {
        List<Reclamation> reclamations = reclamationRepository.findByClientIdOrderByDateCreationDesc(clientId);
        return reclamations.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Récupérer une réclamation par ID
    public Reclamation findById(Long id) {
        return reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation non trouvée"));
    }

    // Créer une réclamation (Client)
    @Transactional
    public Reclamation create(Reclamation reclamation) {
        // Vérifier que le client existe
        Client client = clientRepository.findById(reclamation.getClient().getId())
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));
        reclamation.setClient(client);

        // Vérifier la vente si spécifiée
        if (reclamation.getVente() != null && reclamation.getVente().getId() != null) {
            Vente vente = venteRepository.findById(reclamation.getVente().getId())
                    .orElseThrow(() -> new RuntimeException("Vente non trouvée"));
            reclamation.setVente(vente);
        }

        // Définir la priorité par défaut
        if (reclamation.getPriorite() == null) {
            reclamation.setPriorite(PrioriteReclamation.MOYENNE);
        }

        reclamation.setStatut(StatutReclamation.EN_ATTENTE);
        reclamation.setDateCreation(LocalDateTime.now());

        return reclamationRepository.save(reclamation);
    }

    // Traiter une réclamation (Admin)
    @Transactional
    public Reclamation traiter(Long id, TraitementReclamationDTO dto) {
        Reclamation reclamation = findById(id);

        if (dto.getReponse() != null && !dto.getReponse().isEmpty()) {
            reclamation.setReponse(dto.getReponse());
        }

        if (dto.getStatut() != null) {
            reclamation.setStatut(StatutReclamation.valueOf(dto.getStatut()));
            reclamation.setDateTraitement(LocalDateTime.now());  // CORRIGÉ: setDateTraitement (T majuscule)
        }

        if (dto.getSatisfaction() != null) {
            reclamation.setSatisfaction(dto.getSatisfaction());
        }

        return reclamationRepository.save(reclamation);
    }

    // Modifier le statut d'une réclamation
    @Transactional
    public Reclamation changerStatut(Long id, String statut) {
        Reclamation reclamation = findById(id);
        reclamation.setStatut(StatutReclamation.valueOf(statut));
        
        if (statut.equals("RESOLUE") || statut.equals("FERMEE")) {
            reclamation.setDateTraitement(LocalDateTime.now());  // CORRIGÉ: setDateTraitement (T majuscule)
        }
        
        return reclamationRepository.save(reclamation);
    }

    // Assigner un traitement à un utilisateur
    @Transactional
    public Reclamation assignerTraitant(Long id, Long utilisateurId) {
        Reclamation reclamation = findById(id);
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        reclamation.setTraitePar(utilisateur);
        reclamation.setStatut(StatutReclamation.EN_COURS);
        return reclamationRepository.save(reclamation);
    }

    // Statistiques
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        
        stats.put("total", reclamationRepository.count());
        stats.put("enAttente", reclamationRepository.countByStatut(StatutReclamation.EN_ATTENTE));
        stats.put("enCours", reclamationRepository.countByStatut(StatutReclamation.EN_COURS));
        stats.put("resolues", reclamationRepository.countByStatut(StatutReclamation.RESOLUE));
        stats.put("fermees", reclamationRepository.countByStatut(StatutReclamation.FERMEE));
        
        return stats;
    }

    // Recherche
    public Page<Reclamation> search(String keyword, Pageable pageable) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return reclamationRepository.findAll(pageable);
        }
        return reclamationRepository.search(keyword.trim(), pageable);
    }

    // Convertir en DTO
    public ReclamationDTO toDTO(Reclamation reclamation) {
        ReclamationDTO dto = new ReclamationDTO();
        dto.setId(reclamation.getId());
        dto.setClientId(reclamation.getClient().getId());
        dto.setClientNom(reclamation.getClient().getNom());
        dto.setClientPrenom(reclamation.getClient().getPrenom());
        dto.setVenteId(reclamation.getVente() != null ? reclamation.getVente().getId() : null);
        dto.setSujet(reclamation.getSujet());
        dto.setDescription(reclamation.getDescription());
        dto.setType(reclamation.getType() != null ? reclamation.getType().toString() : null);
        dto.setPriorite(reclamation.getPriorite() != null ? reclamation.getPriorite().toString() : null);
        dto.setStatut(reclamation.getStatut() != null ? reclamation.getStatut().toString() : null);
        dto.setDateCreation(reclamation.getDateCreation());
        dto.setDateTraitement(reclamation.getDateTraitement());
        dto.setReponse(reclamation.getReponse());
        
        if (reclamation.getTraitePar() != null) {
            dto.setTraitePar(reclamation.getTraitePar().getId());
            dto.setTraiteParNom(reclamation.getTraitePar().getNom() + " " + reclamation.getTraitePar().getPrenom());
        }
        
        dto.setSatisfaction(reclamation.getSatisfaction());
        
        return dto;
    }
}