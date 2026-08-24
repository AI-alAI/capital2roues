package ma.capital2roues.capital2roues.controller;

import ma.capital2roues.capital2roues.dto.VenteRequestDTO;
import ma.capital2roues.capital2roues.dto.VenteResponseDTO;
import ma.capital2roues.capital2roues.model.Vente;
import ma.capital2roues.capital2roues.service.PDFService;
import ma.capital2roues.capital2roues.service.VenteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ventes")
public class VenteController {

    @Autowired
    private VenteService venteService;

    @Autowired
    private PDFService pdfService;  // <-- AJOUTER CETTE INJECTION

    @PostMapping
    public ResponseEntity<VenteResponseDTO> createVente(@RequestBody VenteRequestDTO request) {
        VenteResponseDTO vente = venteService.createVente(request);
        return new ResponseEntity<>(vente, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllVentes(
            @PageableDefault(size = 10, sort = "dateVente", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<Vente> ventesPage = venteService.findAll(pageable);

        List<VenteResponseDTO> ventesDTO = ventesPage.getContent()
                .stream()
                .map(venteService::toResponseDTO)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("content", ventesDTO);
        response.put("currentPage", ventesPage.getNumber());
        response.put("totalItems", ventesPage.getTotalElements());
        response.put("totalPages", ventesPage.getTotalPages());
        response.put("size", ventesPage.getSize());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/test-date")
public ResponseEntity<String> testDate(@PathVariable Long id) {
    Vente vente = venteService.findById(id);
    String dateStr = vente.getDateVente() != null ? 
        vente.getDateVente().toString() : "NULL";
    return ResponseEntity.ok("Date: " + dateStr);
}

    @PutMapping("/{id}/annuler")
    public ResponseEntity<VenteResponseDTO> annulerVente(@PathVariable Long id) {
        VenteResponseDTO vente = venteService.annulerVente(id);
        return ResponseEntity.ok(vente);
    }

    // === MÉTHODE POUR EXPORTER LA FACTURE EN PDF ===
@GetMapping("/{id}/pdf")
public ResponseEntity<byte[]> exportFacturePDF(@PathVariable Long id) {
    try {
        byte[] pdfBytes = pdfService.generateFacturePDF(id);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "facture_" + id + ".pdf");
        headers.setContentLength(pdfBytes.length);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    } catch (Exception e) {
        // Afficher l'erreur complète dans les logs
        e.printStackTrace();
        throw new RuntimeException("Erreur lors de la génération du PDF: " + e.getMessage() + " - Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "Aucune cause"));
    }
}
}