package ma.capital2roues.capital2roues.service;

import ma.capital2roues.capital2roues.dto.LigneVenteDTO;
import ma.capital2roues.capital2roues.dto.VenteRequestDTO;
import ma.capital2roues.capital2roues.dto.VenteResponseDTO;
import ma.capital2roues.capital2roues.model.*;
import ma.capital2roues.capital2roues.model.enums.StatutVente;
import ma.capital2roues.capital2roues.model.enums.TypeMouvement;
import ma.capital2roues.capital2roues.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VenteService {

    @Autowired
    private VenteRepository venteRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private ProduitRepository produitRepository;

    @Autowired
    private MouvementStockRepository mouvementStockRepository;

    // Créer une nouvelle vente
    @Transactional
    public VenteResponseDTO createVente(VenteRequestDTO request) {
        // 1. Vérifier que le client existe
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        // 2. Vérifier que l'utilisateur existe
        Utilisateur utilisateur = utilisateurRepository.findById(request.getUtilisateurId())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // 3. Créer la vente
        Vente vente = new Vente();
        vente.setClient(client);
        vente.setUtilisateur(utilisateur);
        vente.setStatut(StatutVente.PAYEE);
        vente.setDateVente(LocalDateTime.now());

        // 4. Traiter chaque ligne de vente
        BigDecimal total = BigDecimal.ZERO;
        List<LigneVente> lignes = new ArrayList<>();

        for (LigneVenteDTO ligneDTO : request.getLignes()) {
            // Vérifier que le produit existe
            Produit produit = produitRepository.findById(ligneDTO.getProduitId())
                    .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

            // Vérifier le stock
            if (produit.getQuantiteStock() < ligneDTO.getQuantite()) {
                throw new RuntimeException("Stock insuffisant pour le produit: " + produit.getNom());
            }

            // Créer la ligne de vente
            LigneVente ligne = new LigneVente();
            ligne.setVente(vente);
            ligne.setProduit(produit);
            ligne.setQuantite(ligneDTO.getQuantite());
            ligne.setPrixUnitaire(produit.getPrixVente());
            BigDecimal totalLigne = produit.getPrixVente().multiply(BigDecimal.valueOf(ligneDTO.getQuantite()));
            ligne.setTotalLigne(totalLigne);
            lignes.add(ligne);
            total = total.add(totalLigne);

            // Mettre à jour le stock
            produit.setQuantiteStock(produit.getQuantiteStock() - ligneDTO.getQuantite());
            produitRepository.save(produit);

            // Enregistrer le mouvement de stock
            MouvementStock mouvement = new MouvementStock();
            mouvement.setProduit(produit);
            mouvement.setType(TypeMouvement.SORTIE);
            mouvement.setQuantite(ligneDTO.getQuantite());
            mouvement.setCommentaire("Vente en cours - " + produit.getNom());
            mouvementStockRepository.save(mouvement);
        }

        // 5. Sauvegarder la vente
        vente.setTotal(total);
        vente.setLignes(lignes);
        Vente savedVente = venteRepository.save(vente);

        // Mettre à jour les commentaires des mouvements avec l'ID de la vente
        for (LigneVente ligne : lignes) {
            // On pourrait améliorer ici
        }

        return toResponseDTO(savedVente);
    }

    // Récupérer toutes les ventes
    public Page<Vente> findAll(Pageable pageable) {
        return venteRepository.findAll(pageable);
    }

    // Récupérer une vente par ID
    public Vente findById(Long id) {
        return venteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vente non trouvée"));
    }

    // Annuler une vente
    @Transactional
    public VenteResponseDTO annulerVente(Long id) {
        Vente vente = findById(id);

        if (vente.getStatut() == StatutVente.ANNULEE) {
            throw new RuntimeException("Cette vente est déjà annulée");
        }

        // Restituer le stock pour chaque ligne
        for (LigneVente ligne : vente.getLignes()) {
            Produit produit = ligne.getProduit();
            produit.setQuantiteStock(produit.getQuantiteStock() + ligne.getQuantite());
            produitRepository.save(produit);

            // Enregistrer le mouvement de stock
            MouvementStock mouvement = new MouvementStock();
            mouvement.setProduit(produit);
            mouvement.setType(TypeMouvement.ENTREE);
            mouvement.setQuantite(ligne.getQuantite());
            mouvement.setCommentaire("Annulation vente #" + vente.getId());
            mouvementStockRepository.save(mouvement);
        }

        vente.setStatut(StatutVente.ANNULEE);
        Vente updatedVente = venteRepository.save(vente);

        return toResponseDTO(updatedVente);
    }

    // Convertir en DTO
    public VenteResponseDTO toResponseDTO(Vente vente) {
        VenteResponseDTO dto = new VenteResponseDTO();
        dto.setId(vente.getId());
        dto.setClientId(vente.getClient().getId());
        dto.setClientNom(vente.getClient().getNom());
        dto.setClientPrenom(vente.getClient().getPrenom());
        dto.setUtilisateurId(vente.getUtilisateur().getId());
        dto.setUtilisateurNom(vente.getUtilisateur().getNom() + " " + vente.getUtilisateur().getPrenom());
        dto.setDateVente(vente.getDateVente());
        dto.setTotal(vente.getTotal());
        dto.setStatut(vente.getStatut().toString());

        List<LigneVenteDTO> lignesDTO = vente.getLignes().stream()
                .map(ligne -> {
                    LigneVenteDTO ligneDTO = new LigneVenteDTO();
                    ligneDTO.setProduitId(ligne.getProduit().getId());
                    ligneDTO.setProduitNom(ligne.getProduit().getNom());
                    ligneDTO.setQuantite(ligne.getQuantite());
                    ligneDTO.setPrixUnitaire(ligne.getPrixUnitaire());
                    ligneDTO.setTotalLigne(ligne.getTotalLigne());
                    return ligneDTO;
                })
                .collect(Collectors.toList());

        dto.setLignes(lignesDTO);
        return dto;
    }
}