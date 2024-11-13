package cz.oksystem.deployment_dashboard.repository;

import cz.oksystem.deployment_dashboard.entity.Deployment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DeploymentRepository extends JpaRepository<Deployment, Long> {
  @Query("SELECT COUNT(d) > 0 FROM Deployment d " +
    "WHERE d.version = :version " +
    "AND d.environment = :environment " +
    "AND d.environment.app.key = :appKey")
  boolean existsByAppAndEnvironmentAndVersion(@Param("version") String version,
                                             @Param("environment") String environment,
                                             @Param("appKey") String appKey);
}
