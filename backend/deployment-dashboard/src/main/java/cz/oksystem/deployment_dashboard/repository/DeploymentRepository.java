package cz.oksystem.deployment_dashboard.repository;

import cz.oksystem.deployment_dashboard.entity.Deployment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeploymentRepository extends JpaRepository<Deployment, Long> {
  @Query("SELECT d FROM Deployment d " +
    "WHERE d.environment.app.key = :appKey " +
    "AND d.environment.name = :environment " +
    "AND d.version.name = :version")
  Optional<Deployment> findByAppAndEnvironmentAndVersion(@Param("appKey") String appKey,
                                                         @Param("environment") String environmentName,
                                                         @Param("version") String versionName);

  @Query("SELECT d FROM Deployment d " +
    "WHERE d.environment.app.key = :appKey " +
    "ORDER BY d.id DESC LIMIT 1")
  Optional<Deployment> getLastDeploymentForApp(@Param("appKey") String appKey);

  @Query("SELECT d FROM Deployment d " +
    "WHERE d.jiraUrl = :jiraUrl")
  List<Deployment> findByJiraUrl(Optional<String> jiraUrl);
}
