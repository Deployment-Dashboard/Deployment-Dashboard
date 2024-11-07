package cz.oksystem.deployment_dashboard.repository;

import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Version;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VersionRepository extends JpaRepository<Version, Long> {

  boolean existsByAppAndName(App app, String name);

  Optional<Version> findByAppAndName(App app, String name);
}
