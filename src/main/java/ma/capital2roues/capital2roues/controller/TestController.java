package ma.capital2roues.capital2roues.controller;

import ma.capital2roues.capital2roues.repository.ProduitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @Autowired
    private ProduitRepository produitRepository;

    @GetMapping("/produits")
    public Object getProduits() {
        return produitRepository.findAll();
    }
}