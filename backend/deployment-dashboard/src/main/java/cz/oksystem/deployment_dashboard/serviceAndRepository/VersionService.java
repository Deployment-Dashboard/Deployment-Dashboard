package cz.oksystem.deployment_dashboard.serviceAndRepository;

import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Version;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class VersionService {
  private final VersionRepository versionRepository;
  private final AppService appService;

  public VersionService(VersionRepository versionRepository, AppService appService) {
    this.versionRepository = versionRepository;
    this.appService = appService;
  }

  @Transactional
  public Version save(Version version) {
    if (exists(version.getApp().getKey(), version.getName())) {
      throw new CustomExceptions.DuplicateKeyException(Version.class, version.getApp().getKey() + "-" + version.getName());
    }

    Optional<App> fetchedApp = appService.get(version.getApp().getKey());

    if (fetchedApp.isEmpty()) {
      throw new CustomExceptions.NotManagedException(App.class, version.getApp().getKey());
    }
    fetchedApp.get().addVersion(version);

    return versionRepository.save(version);
  }

  @Transactional(readOnly = true)
  public Optional<Version> get(String appKey, String name) {
    Optional<App> fetchedApp = appService.get(appKey);

    if (fetchedApp.isPresent()) {
      return versionRepository.findByAppAndName(fetchedApp.get(), name);
    } else {
      return Optional.empty();
    }
  }

  @Transactional(readOnly = true)
  public boolean exists(String appKey, String version) {
    Optional<App> fetchedApp = appService.get(appKey);

    return fetchedApp.isPresent() && versionRepository.existsByAppAndName(fetchedApp.get(), version);
  }
}
