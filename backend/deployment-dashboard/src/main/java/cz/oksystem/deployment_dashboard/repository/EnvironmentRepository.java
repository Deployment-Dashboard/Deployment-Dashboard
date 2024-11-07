package cz.oksystem.deployment_dashboard.repository;

import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Environment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EnvironmentRepository extends JpaRepository<Environment, Long> {
  boolean existsByAppAndName(App app, String envKey);

  Optional<Environment> findByAppAndName(App app, String name);
}
