package cz.oksystem.deployment_dashboard;

import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Environment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnvironmentRepository extends JpaRepository<Environment, Long> {
  List<Environment> findAllByApp (App app);
}
