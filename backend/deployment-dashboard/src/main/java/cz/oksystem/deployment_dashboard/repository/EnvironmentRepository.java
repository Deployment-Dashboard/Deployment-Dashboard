package cz.oksystem.deployment_dashboard.repository;

import cz.oksystem.deployment_dashboard.entity.Environment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EnvironmentRepository extends JpaRepository<Environment, Long> {
  @Query("SELECT COUNT(e) > 0 FROM Environment e " +
         "WHERE e.name = :name " +
         "AND e.app.key = :appKey ")
  boolean existsByAppKeyAndName(@Param("appKey") String appKey,
                                @Param("name") String envName);

  @Query("SELECT e FROM Environment e " +
         "WHERE e.name = :name " +
         "AND e.app.key = :appKey ")
  Optional<Environment> findByAppKeyAndName(@Param("appKey") String appKey,
                                            @Param("name") String envName);
}
