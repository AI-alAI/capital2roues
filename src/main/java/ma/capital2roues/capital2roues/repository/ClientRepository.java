package ma.capital2roues.capital2roues.repository;

import ma.capital2roues.capital2roues.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
}