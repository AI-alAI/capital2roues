package ma.capital2roues.capital2roues.controller;

import ma.capital2roues.capital2roues.dto.ReclamationDTO;
import ma.capital2roues.capital2roues.dto.TraitementReclamationDTO;
import ma.capital2roues.capital2roues.model.Reclamation;
import ma.capital2roues.capital2roues.service.ReclamationService;
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
@RequestMapping("/api/reclamations")
public class ReclamationController {

    @Autowired
    private ReclamationService reclamationService;

    // Admin - Toutes les réclamations avec pagination
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllReclamations(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "dateCreation", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<Reclamation> reclamationsPage;
        
        if (search != null && !search.trim().isEmpty()) {
            reclamationsPage = reclamationService.search(search, pageable);
        } else {
            reclamationsPage = reclamationService.findAll(pageable);
        }
        
        List<ReclamationDTO> dtos = reclamationsPage.getContent()
                .stream()
                .map(reclamationService::toDTO)
                .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", dtos);
        response.put("currentPage", reclamationsPage.getNumber());
        response.put("totalItems", reclamationsPage.getTotalElements());
        response.put("totalPages", reclamationsPage.getTotalPages());
        response.put("size", reclamationsPage.getSize());
        
        return ResponseEntity.ok(response);
    }

    // Client - Ses réclamations
    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<ReclamationDTO>> getReclamationsByClient(@PathVariable Long clientId) {
        return ResponseEntity.ok(reclamationService.findByClient(clientId));
    }

    // Récupérer une réclamation par ID
    @GetMapping("/{id}")
    public ResponseEntity<ReclamationDTO> getReclamationById(@PathVariable Long id) {
        Reclamation reclamation = reclamationService.findById(id);
        return ResponseEntity.ok(reclamationService.toDTO(reclamation));
    }

    // Créer une réclamation (Client)
    @PostMapping
    public ResponseEntity<ReclamationDTO> createReclamation(@RequestBody Reclamation reclamation) {
        Reclamation created = reclamationService.create(reclamation);
        return new ResponseEntity<>(reclamationService.toDTO(created), HttpStatus.CREATED);
    }

    // Traiter une réclamation (Admin)
    @PutMapping("/{id}/traiter")
    public ResponseEntity<ReclamationDTO> traiterReclamation(
            @PathVariable Long id,
            @RequestBody TraitementReclamationDTO dto) {
        Reclamation reclamation = reclamationService.traiter(id, dto);
        return ResponseEntity.ok(reclamationService.toDTO(reclamation));
    }

    // Changer le statut
    @PatchMapping("/{id}/statut")
    public ResponseEntity<ReclamationDTO> changerStatut(
            @PathVariable Long id,
            @RequestParam String statut) {
        Reclamation reclamation = reclamationService.changerStatut(id, statut);
        return ResponseEntity.ok(reclamationService.toDTO(reclamation));
    }

    // Assigner un traitant
    @PatchMapping("/{id}/assigner")
    public ResponseEntity<ReclamationDTO> assignerTraitant(
            @PathVariable Long id,
            @RequestParam Long utilisateurId) {
        Reclamation reclamation = reclamationService.assignerTraitant(id, utilisateurId);
        return ResponseEntity.ok(reclamationService.toDTO(reclamation));
    }

    // Statistiques
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(reclamationService.getStats());
    }
}