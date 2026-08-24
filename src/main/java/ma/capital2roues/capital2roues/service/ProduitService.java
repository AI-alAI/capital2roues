package ma.capital2roues.capital2roues.service;

import ma.capital2roues.capital2roues.dto.ProduitDTO;
import ma.capital2roues.capital2roues.model.Categorie;
import ma.capital2roues.capital2roues.model.Produit;
import ma.capital2roues.capital2roues.repository.CategorieRepository;
import ma.capital2roues.capital2roues.repository.ProduitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProduitService {

    @Autowired
    private ProduitRepository produitRepository;

    @Autowired
    private CategorieRepository categorieRepository;

    // Récupérer tous les produits avec pagination
    public Page<Produit> findAll(Pageable pageable) {
        return produitRepository.findAll(pageable);
    }

    // Récupérer un produit par son ID
    public Produit findById(Long id) {
        return produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'id: " + id));
    }

    // Rechercher des produits par mot-clé (nom ou référence)
    public Page<Produit> search(String keyword, Pageable pageable) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return produitRepository.findAll(pageable);
        }
        return produitRepository.findByNomContainingIgnoreCase(keyword, pageable);
    }

    // Créer un nouveau produit
    @Transactional
    public Produit create(ProduitDTO dto) {
        Produit produit = new Produit();
        produit.setNom(dto.getNom());
        produit.setReference(dto.getReference());
        produit.setVin(dto.getVin());
        produit.setAnnee(dto.getAnnee());
        produit.setCouleur(dto.getCouleur());
        produit.setPrixAchat(dto.getPrixAchat());
        produit.setPrixVente(dto.getPrixVente());
        produit.setQuantiteStock(dto.getQuantiteStock() != null ? dto.getQuantiteStock() : 0);
        produit.setGarantie(dto.getGarantie());

        // Associer la catégorie si elle existe
        if (dto.getCategorieId() != null) {
            Categorie categorie = categorieRepository.findById(dto.getCategorieId())
                    .orElseThrow(() -> new RuntimeException("Catégorie non trouvée"));
            produit.setCategorie(categorie);
        }

        return produitRepository.save(produit);
    }

    // Mettre à jour un produit existant
    @Transactional
    public Produit update(Long id, ProduitDTO dto) {
        Produit produit = findById(id);
        
        produit.setNom(dto.getNom());
        produit.setReference(dto.getReference());
        produit.setVin(dto.getVin());
        produit.setAnnee(dto.getAnnee());
        produit.setCouleur(dto.getCouleur());
        produit.setPrixAchat(dto.getPrixAchat());
        produit.setPrixVente(dto.getPrixVente());
        produit.setQuantiteStock(dto.getQuantiteStock() != null ? dto.getQuantiteStock() : 0);
        produit.setGarantie(dto.getGarantie());

        // Mettre à jour la catégorie
        if (dto.getCategorieId() != null) {
            Categorie categorie = categorieRepository.findById(dto.getCategorieId())
                    .orElseThrow(() -> new RuntimeException("Catégorie non trouvée"));
            produit.setCategorie(categorie);
        } else {
            produit.setCategorie(null);
        }

        return produitRepository.save(produit);
    }

    // Supprimer un produit
    @Transactional
    public void delete(Long id) {
        Produit produit = findById(id);
        produitRepository.delete(produit);
    }

    // Récupérer les produits en stock faible
    public List<Produit> getLowStockProducts(int threshold) {
        return produitRepository.findByQuantiteStockLessThan(threshold);
    }

    // Convertir un Produit en DTO (pour la réponse)
    public ProduitDTO toDTO(Produit produit) {
        ProduitDTO dto = new ProduitDTO();
        dto.setId(produit.getId());
        dto.setNom(produit.getNom());
        dto.setReference(produit.getReference());
        dto.setVin(produit.getVin());
        dto.setAnnee(produit.getAnnee());
        dto.setCouleur(produit.getCouleur());
        dto.setPrixAchat(produit.getPrixAchat());
        dto.setPrixVente(produit.getPrixVente());
        dto.setQuantiteStock(produit.getQuantiteStock());
        dto.setGarantie(produit.getGarantie());
        
        if (produit.getCategorie() != null) {
            dto.setCategorieId(produit.getCategorie().getId());
            dto.setCategorieNom(produit.getCategorie().getNom());
        }
        
        return dto;
    }
}