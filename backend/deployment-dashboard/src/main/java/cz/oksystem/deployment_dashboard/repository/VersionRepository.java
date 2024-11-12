package cz.oksystem.deployment_dashboard.repository;

import cz.oksystem.deployment_dashboard.entity.Version;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VersionRepository extends JpaRepository<Version, Long> {

  @Query("SELECT COUNT(v) > 0 FROM Version v " +
    "WHERE v.name = :name " +
    "AND v.app.key = :appKey ")
  boolean existsByAppAndName(@Param("appKey") String appKey,
                             @Param("name") String versionName);

  @Query("SELECT v FROM Version v " +
    "WHERE v.name = :name " +
    "AND v.app.key = :appKey ")
  Optional<Version> findByAppAndName(@Param("appKey") String app,
                                     @Param("name") String versionName);
}

