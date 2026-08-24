package ma.capital2roues.capital2roues.service;

import ma.capital2roues.capital2roues.dto.DashboardDTO;
import ma.capital2roues.capital2roues.model.LigneVente;
import ma.capital2roues.capital2roues.model.Produit;
import ma.capital2roues.capital2roues.model.Vente;
import ma.capital2roues.capital2roues.model.enums.StatutVente;
import ma.capital2roues.capital2roues.repository.ClientRepository;
import ma.capital2roues.capital2roues.repository.ProduitRepository;
import ma.capital2roues.capital2roues.repository.VenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatistiqueService {

    @Autowired
    private VenteRepository venteRepository;

    @Autowired
    private ProduitRepository produitRepository;

    @Autowired
    private ClientRepository clientRepository;

    // Récupérer toutes les statistiques pour le dashboard
    public DashboardDTO getDashboardStats() {
        DashboardDTO dto = new DashboardDTO();
        
        // 1. Récupérer toutes les ventes payées
        List<Vente> ventes = venteRepository.findAll().stream()
                .filter(v -> v.getStatut() == StatutVente.PAYEE)
                .collect(Collectors.toList());
        
        // 2. Chiffre d'affaires total
        BigDecimal caTotal = ventes.stream()
                .map(Vente::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setChiffreAffairesTotal(caTotal);
        
        // 3. Nombre de ventes
        dto.setNombreVentes((long) ventes.size());
        
        // 4. Nombre de produits
        dto.setNombreProduits(produitRepository.count());
        
        // 5. Nombre de clients
        dto.setNombreClients(clientRepository.count());
        
        // 6. Stock faible (produits avec stock < 5)
        dto.setStockFaible((long) produitRepository.findByQuantiteStockLessThan(5).size());
        
        // 7. Dernières ventes (10 dernières)
        List<DashboardDTO.VenteRecenteDTO> ventesRecentes = ventes.stream()
                .sorted((v1, v2) -> v2.getDateVente().compareTo(v1.getDateVente()))
                .limit(10)
                .map(v -> {
                    DashboardDTO.VenteRecenteDTO venteDTO = new DashboardDTO.VenteRecenteDTO();
                    venteDTO.setId(v.getId());
                    venteDTO.setClientNom(v.getClient().getNom());
                    venteDTO.setClientPrenom(v.getClient().getPrenom());
                    venteDTO.setTotal(v.getTotal());
                    venteDTO.setDate(v.getDateVente().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
                    venteDTO.setStatut(v.getStatut().toString());
                    return venteDTO;
                })
                .collect(Collectors.toList());
        dto.setVentesRecentes(ventesRecentes);
        
        // 8. Top 5 produits les plus vendus
        Map<Long, Long> produitVentes = new HashMap<>();
        Map<Long, BigDecimal> produitCA = new HashMap<>();
        
        for (Vente vente : ventes) {
            for (LigneVente ligne : vente.getLignes()) {
                Long produitId = ligne.getProduit().getId();
                produitVentes.put(produitId, produitVentes.getOrDefault(produitId, 0L) + ligne.getQuantite());
                produitCA.put(produitId, produitCA.getOrDefault(produitId, BigDecimal.ZERO).add(ligne.getTotalLigne()));
            }
        }
        
        List<DashboardDTO.ProduitTopDTO> topProduits = new ArrayList<>();
        for (Map.Entry<Long, Long> entry : produitVentes.entrySet()) {
            Long produitId = entry.getKey();
            Produit produit = produitRepository.findById(produitId).orElse(null);
            if (produit != null) {
                DashboardDTO.ProduitTopDTO top = new DashboardDTO.ProduitTopDTO();
                top.setId(produitId);
                top.setNom(produit.getNom());
                top.setQuantiteVendue(entry.getValue());
                top.setTotalVentes(produitCA.getOrDefault(produitId, BigDecimal.ZERO));
                topProduits.add(top);
            }
        }
        
        topProduits.sort((p1, p2) -> p2.getQuantiteVendue().compareTo(p1.getQuantiteVendue()));
        dto.setTopProduits(topProduits.stream().limit(5).collect(Collectors.toList()));
        
        // 9. Ventes par mois (pour le graphique)
        Map<String, BigDecimal> ventesParMois = new LinkedHashMap<>();
        ventes.stream()
                .collect(Collectors.groupingBy(
                        v -> v.getDateVente().format(DateTimeFormatter.ofPattern("MMM yyyy")),
                        Collectors.reducing(BigDecimal.ZERO, Vente::getTotal, BigDecimal::add)
                ))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEachOrdered(entry -> ventesParMois.put(entry.getKey(), entry.getValue()));
        dto.setVentesParMois(ventesParMois);
        
        return dto;
    }
}