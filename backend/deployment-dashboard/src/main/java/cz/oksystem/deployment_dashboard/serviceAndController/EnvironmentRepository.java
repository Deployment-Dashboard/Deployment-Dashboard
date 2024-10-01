package cz.oksystem.deployment_dashboard.serviceAndController;

import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Environment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EnvironmentRepository extends JpaRepository<Environment, Long> {
  List<Environment> findAllByApp (App app);

  Optional<Environment> findByNameAndApp(String key, App app);
}
