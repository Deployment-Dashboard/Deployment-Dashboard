package cz.oksystem.deployment_dashboard.repository;

import cz.oksystem.deployment_dashboard.entity.App;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppRepository extends JpaRepository<App, Long> {
  boolean existsByKey(String key);
  Optional<App> findByKey(String key);
  Optional<App> findByKeyAndArchivedTimestampIsNull(String key);

  @Query("SELECT a FROM App a " +
    "WHERE a.parent IS NULL")
  List<App> getAllWhereParentIsNull();
}
