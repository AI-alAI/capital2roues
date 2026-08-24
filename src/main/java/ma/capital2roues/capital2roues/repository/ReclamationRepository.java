package ma.capital2roues.capital2roues.repository;

import ma.capital2roues.capital2roues.model.Reclamation;
import ma.capital2roues.capital2roues.model.enums.StatutReclamation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReclamationRepository extends JpaRepository<Reclamation, Long> {
    
    List<Reclamation> findByClientIdOrderByDateCreationDesc(Long clientId);
    
    Page<Reclamation> findByStatut(StatutReclamation statut, Pageable pageable);
    
    Page<Reclamation> findByClientId(Long clientId, Pageable pageable);
    
    @Query("SELECT COUNT(r) FROM Reclamation r WHERE r.statut = :statut")
    long countByStatut(@Param("statut") StatutReclamation statut);
    
    @Query("SELECT r FROM Reclamation r WHERE " +
           "LOWER(r.sujet) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Reclamation> search(@Param("keyword") String keyword, Pageable pageable);
}
