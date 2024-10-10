package cz.oksystem.deployment_dashboard.serviceAndRepository;

import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Version;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class VersionService {
  private final VersionRepository vr;

  private final AppService as;

  public VersionService(VersionRepository vr, AppService as) {
    this.vr = vr;
    this.as = as;
  }


  public Version save(Version version) {
    return vr.save(version);
  }

  public Optional<Version> get(String appKey, String name) {
    Optional<App> fetchedApp = as.get(appKey);

    if (fetchedApp.isPresent()) {
      return vr.findByAppAndName(fetchedApp.get(), name);
    } else {
      return Optional.empty();
    }
  }

  public boolean exists(String appKey, String version) {
    Optional<App> fetchedApp = as.get(appKey);

    return fetchedApp.isPresent() && vr.existsByAppAndName(fetchedApp.get(), version);
  }
}
