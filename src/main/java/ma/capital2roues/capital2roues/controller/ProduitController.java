package ma.capital2roues.capital2roues.controller;

import ma.capital2roues.capital2roues.dto.ProduitDTO;
import ma.capital2roues.capital2roues.model.Produit;
import ma.capital2roues.capital2roues.service.ExportService;
import ma.capital2roues.capital2roues.service.ProduitService;
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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/produits")
public class ProduitController {

    @Autowired
    private ProduitService produitService;

    @Autowired
    private ExportService exportService;  // <-- AJOUTER CETTE INJECTION

    // 1. Récupérer tous les produits (avec pagination et recherche)
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllProducts(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<Produit> produitsPage;
        
        if (keyword != null && !keyword.isEmpty()) {
            produitsPage = produitService.search(keyword, pageable);
        } else {
            produitsPage = produitService.findAll(pageable);
        }
        
        // Convertir en DTO
        List<ProduitDTO> produitsDTO = produitsPage.getContent()
                .stream()
                .map(produitService::toDTO)
                .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", produitsDTO);
        response.put("currentPage", produitsPage.getNumber());
        response.put("totalItems", produitsPage.getTotalElements());
        response.put("totalPages", produitsPage.getTotalPages());
        response.put("size", produitsPage.getSize());
        
        return ResponseEntity.ok(response);
    }

    // 2. Récupérer un produit par ID
    @GetMapping("/{id}")
    public ResponseEntity<ProduitDTO> getProductById(@PathVariable Long id) {
        Produit produit = produitService.findById(id);
        return ResponseEntity.ok(produitService.toDTO(produit));
    }

    // 3. Créer un nouveau produit
    @PostMapping
    public ResponseEntity<ProduitDTO> createProduct(@RequestBody ProduitDTO produitDTO) {
        Produit produit = produitService.create(produitDTO);
        return new ResponseEntity<>(produitService.toDTO(produit), HttpStatus.CREATED);
    }

    // 4. Mettre à jour un produit
    @PutMapping("/{id}")
    public ResponseEntity<ProduitDTO> updateProduct(@PathVariable Long id, @RequestBody ProduitDTO produitDTO) {
        Produit produit = produitService.update(id, produitDTO);
        return ResponseEntity.ok(produitService.toDTO(produit));
    }

    // 5. Supprimer un produit
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        produitService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // 6. Récupérer les produits en stock faible
    @GetMapping("/low-stock")
    public ResponseEntity<List<ProduitDTO>> getLowStockProducts(
            @RequestParam(defaultValue = "5") int threshold) {
        List<Produit> produits = produitService.getLowStockProducts(threshold);
        List<ProduitDTO> produitsDTO = produits.stream()
                .map(produitService::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(produitsDTO);
    }

    // ===== EXPORT EXCEL =====
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel() {
        try {
            byte[] excelBytes = exportService.exportProduitsExcel();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            String filename = "produits_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(excelBytes.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'export Excel: " + e.getMessage());
        }
    }
}