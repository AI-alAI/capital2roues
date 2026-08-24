package ma.capital2roues.capital2roues.config;

import ma.capital2roues.capital2roues.model.*;
import ma.capital2roues.capital2roues.model.enums.Role;
import ma.capital2roues.capital2roues.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private CategorieRepository categorieRepository;
    @Autowired private ProduitRepository produitRepository;
    @Autowired private ClientRepository clientRepository;

    @Override
    public void run(String... args) throws Exception {
        // Créer un administrateur
        if (utilisateurRepository.findByEmail("admin@capital2roues.com").isEmpty()) {
            Utilisateur admin = new Utilisateur();
            admin.setNom("Admin");
            admin.setPrenom("Super");
            admin.setEmail("admin@capital2roues.com");
            admin.setMotDePasse("admin123"); // Pas de chiffrement pour l'instant
            admin.setRole(Role.ADMIN);
            utilisateurRepository.save(admin);
            System.out.println("✅ Admin créé (email: admin@capital2roues.com, mdp: admin123)");
        }

        // Créer des clients de test
        if (clientRepository.count() == 0) {
            Client client1 = new Client();
            client1.setNom("Alaoui");
            client1.setPrenom("Mehdi");
            client1.setTelephone("0612345678");
            client1.setEmail("mehdi@email.com");
            client1.setAdresse("Casablanca, Maroc");
            clientRepository.save(client1);

            Client client2 = new Client();
            client2.setNom("Benani");
            client2.setPrenom("Sofia");
            client2.setTelephone("0676543210");
            client2.setEmail("sofia@email.com");
            client2.setAdresse("Rabat, Maroc");
            clientRepository.save(client2);

            Client client3 = new Client();
            client3.setNom("El Fassi");
            client3.setPrenom("Karim");
            client3.setTelephone("0698765432");
            client3.setEmail("karim@email.com");
            client3.setAdresse("Tanger, Maroc");
            clientRepository.save(client3);

            System.out.println("✅ 3 clients de test créés !");
        }

        // Créer une catégorie et des produits de démonstration
        if (categorieRepository.count() == 0) {
            Categorie moto = new Categorie();
            moto.setNom("Motos");
            moto.setDescription("Toutes les motos et scooters");
            categorieRepository.save(moto);

            Produit p1 = new Produit();
            p1.setNom("Yamaha XMAX 300");
            p1.setReference("YAM-XMAX-001");
            p1.setVin("VN123456789");
            p1.setAnnee(2025);
            p1.setCouleur("Noir");
            p1.setPrixAchat(new BigDecimal("45000"));
            p1.setPrixVente(new BigDecimal("62000"));
            p1.setQuantiteStock(10);
            p1.setGarantie("2 ans");
            p1.setCategorie(moto);
            produitRepository.save(p1);

            Produit p2 = new Produit();
            p2.setNom("Honda PCX 160");
            p2.setReference("HON-PCX-002");
            p2.setVin("VN987654321");
            p2.setAnnee(2024);
            p2.setCouleur("Blanc");
            p2.setPrixAchat(new BigDecimal("35000"));
            p2.setPrixVente(new BigDecimal("48000"));
            p2.setQuantiteStock(5);
            p2.setGarantie("2 ans");
            p2.setCategorie(moto);
            produitRepository.save(p2);

            System.out.println("✅ Catégories et produits de test créés !");
        }
    }
}