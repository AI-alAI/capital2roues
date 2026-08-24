package ma.capital2roues.capital2roues.controller;

import ma.capital2roues.capital2roues.dto.DashboardDTO;
import ma.capital2roues.capital2roues.service.StatistiqueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/statistiques")
public class StatistiqueController {

    @Autowired
    private StatistiqueService statistiqueService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> getDashboardStats() {
        return ResponseEntity.ok(statistiqueService.getDashboardStats());
    }
}