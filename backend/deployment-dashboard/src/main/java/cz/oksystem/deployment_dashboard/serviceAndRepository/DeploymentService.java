package cz.oksystem.deployment_dashboard.serviceAndRepository;

import cz.oksystem.deployment_dashboard.entity.Deployment;
import cz.oksystem.deployment_dashboard.entity.Environment;
import cz.oksystem.deployment_dashboard.entity.Version;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class DeploymentService {
  private final DeploymentRepository dr;
  private final EnvironmentService es;
  private final VersionService vs;

  public DeploymentService(DeploymentRepository dr, EnvironmentService es, VersionService vs) {
    this.dr = dr;
    this.es = es;
    this.vs = vs;
  }

  @Transactional
  public Deployment save(Deployment deployment) {
    deployment.getEnv().addDeployment(deployment);
    deployment.getVer().addDeployment(deployment);

    return dr.save(deployment);
  }

  // TODO tohle změnit a sypat entries o deploymentu pokud je to pro celou appku tak i komponentám, bude pak hell to kontrolovat
  //  pokud třeba appka bude mít release a pak se vytvoří komponenta, která v době toho release ještě neexistovala
  @Transactional
  public Deployment deploy(Version version, String envKey, String urlEncodedTicket, LocalDateTime date) {
    String appKey = version.getApp().getKey();
    Optional<Version> fetchedVersion = vs.get(appKey, version.getName());

    if (fetchedVersion.isEmpty()) {
      version = vs.save(version);
    } else {
      version = fetchedVersion.get();
    }

    Optional<Environment> fetchedEnv = es.get(appKey, envKey);

    if (fetchedEnv.isEmpty()) {
      throw new CustomExceptions.NotManagedException(Environment.class, appKey + envKey);
    }

    return save(new Deployment(date, urlEncodedTicket, fetchedEnv.get(), version));
  }

  @Transactional
  public List<Deployment> deployAll(List<Version> versions, String envKey, String urlEncodedTicket, LocalDateTime date) {
    List<Deployment> deployments = new ArrayList<>();

    for (Version version: versions) {
      deployments.add(deploy(version, envKey, urlEncodedTicket, date));
    }
    return deployments;
  }
}
