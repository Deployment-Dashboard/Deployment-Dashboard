package cz.oksystem.deployment_dashboard.service;

import cz.oksystem.deployment_dashboard.dto.VersionDto;
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
        Version.CZECH_NAME, newVersion.getApp().getKey(), newVersion.getName()
      );
    }

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
  public void delete(String appKey, String versionName, boolean force) {
    Version verToDelete = this.get(appKey, versionName).orElseThrow(
      () -> new CustomExceptions.NotManagedException(
        Version.CZECH_NAME, App.CZECH_NAME, versionName, appKey
      )
    );

    if (!force && verToDelete.hasDeployment()) {
      throw new CustomExceptions.DeletionNotAllowedException(
        Version.CZECH_NAME, versionName
      );
    }

    versionRepository.delete(verToDelete);
  }

  @Transactional
  public void update(String appKey, String versionName, VersionDto versionDto) {
    Version verToUpdate = this.get(appKey, versionName).orElseThrow(
      () -> new CustomExceptions.NotManagedException(
        Version.CZECH_NAME, App.CZECH_NAME, versionName, appKey
      )
    );

    verToUpdate.setName(versionDto.getName());
    verToUpdate.setDescription(versionDto.getDescription());
  }
}
