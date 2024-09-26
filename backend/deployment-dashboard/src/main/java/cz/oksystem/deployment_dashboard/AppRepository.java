package cz.oksystem.deployment_dashboard;

import cz.oksystem.deployment_dashboard.entity.App;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppRepository extends JpaRepository<App, Long> {
  boolean existsByKey(String key);

  Optional<App> findByKey(String key);

  Optional<App> findByKeyAndDeletedIsNull(String key);
}
