package ma.capital2roues.capital2roues.repository;

import ma.capital2roues.capital2roues.model.Vente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VenteRepository extends JpaRepository<Vente, Long> {
}