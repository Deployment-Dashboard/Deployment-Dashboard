package cz.oksystem.deployment_dashboard.service;

import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Version;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions;
import cz.oksystem.deployment_dashboard.repository.VersionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class VersionService {
  private final VersionRepository versionRepository;

  public VersionService(VersionRepository versionRepository) {
    this.versionRepository = versionRepository;
  }

  @Transactional
  public Version save(Version newVersion) {
    if (this.exists(newVersion.getApp().getKey(), newVersion.getName())) {
      throw new CustomExceptions.DuplicateKeyException(
        Version.class, newVersion.getApp().getKey(), newVersion.getName()
      );
    }

    //newVersion.getApp().addVersion(newVersion);
    return versionRepository.save(newVersion);
  }

  @Transactional(readOnly = true)
  public Optional<Version> get(String appKey, String versionName) {
    return versionRepository.findByAppAndName(appKey, versionName);
  }

  @Transactional(readOnly = true)
  public boolean exists(String appKey, String versionName) {
    return versionRepository.existsByAppAndName(appKey, versionName);
  }

  @Transactional
  public void delete(String appKey, String versionName) {
    Version verToDelete = this.get(appKey, versionName).orElseThrow(
      () -> new CustomExceptions.NotManagedException(
        Version.class, App.class, versionName, appKey
      )
    );

    if (verToDelete.hasDeployment()) {
      throw new CustomExceptions.DeletionNotAllowedException(
        Version.class, versionName
      );
    }

    //verToDelete.getApp().removeVersion(verToDelete);
    versionRepository.delete(verToDelete);
  }
}
