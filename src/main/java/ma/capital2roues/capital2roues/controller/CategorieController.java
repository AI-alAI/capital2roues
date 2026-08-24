package ma.capital2roues.capital2roues.controller;

import ma.capital2roues.capital2roues.dto.CategorieDTO;
import ma.capital2roues.capital2roues.model.Categorie;
import ma.capital2roues.capital2roues.service.CategorieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
public class CategorieController {

    @Autowired
    private CategorieService categorieService;

    @GetMapping
    public List<CategorieDTO> getAllCategories() {
        List<Categorie> categories = categorieService.findAll();
        return categories.stream()
                .map(c -> new CategorieDTO(c.getId(), c.getNom(), c.getDescription()))
                .collect(Collectors.toList());
    }
}