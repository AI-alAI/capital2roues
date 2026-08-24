package ma.capital2roues.capital2roues.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne @JoinColumn(name = "utilisateur_id") private Utilisateur utilisateur;
    @Column(length = 255) private String action;
    @Column(name = "table_name", length = 50) private String tableName;
    @Column(name = "record_id") private Long recordId;
    @Column(name = "date_action", updatable = false) private LocalDateTime dateAction;
    @PrePersist protected void onCreate() { dateAction = LocalDateTime.now(); }
}