package cz.oksystem.deployment_dashboard.service;

import cz.oksystem.deployment_dashboard.dto.AppDto;
import cz.oksystem.deployment_dashboard.dto.EnvironmentDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Deployment;
import cz.oksystem.deployment_dashboard.entity.Environment;
import cz.oksystem.deployment_dashboard.entity.Version;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

// TODO projít services a všechny cross-checky přesunout sem
@Service
public class ServiceOrchestrator {
  private final AppService appService;
  private final EnvironmentService environmentService;
  private final VersionService versionService;
  private final DeploymentService deploymentService;


  public ServiceOrchestrator(AppService appService, EnvironmentService environmentService, VersionService versionService, DeploymentService deploymentService) {
    this.appService = appService;
    this.environmentService = environmentService;
    this.versionService = versionService;
    this.deploymentService = deploymentService;
  }


  public void addApp(AppDto appDto) {
    appService.save(this.appFromDto(appDto));
  }

  public void updateApp(String appKey, AppDto appDto) {
    appService.update(appKey, this.appFromDto(appDto));
  }

  public void deleteApp(String appKey, boolean hardDelete) {
    appService.delete(appKey, hardDelete);
  }

  public List<Environment> getAppEnvironments(String appKey) {
    App fetchedApp = appService.get(appKey).orElseThrow(
      () -> new CustomExceptions.NotManagedException(App.class, appKey)
    );

    return fetchedApp.getEnvironments();
  }

  public List<Version> getAppVersions(String appKey) {
    App fetchedApp = appService.get(appKey).orElseThrow(
      () -> new CustomExceptions.NotManagedException(App.class, appKey)
    );

    return fetchedApp.getVersions();
  }

  public void addEnvironment(EnvironmentDto envDto) {
    environmentService.save(this.environmentFromDto(envDto));
  }

  public void updateEnvironment(String appKey, String envKey, EnvironmentDto envDto) {
    environmentService.update(appKey, envKey, this.environmentFromDto(envDto));
  }

  public void deleteEnvironment(String appKey, String envKey) {
    environmentService.delete(appKey, envKey);
  }

//  @Transactional
//  public void release(String appKey, List<String> components, String envKey, String versionName, String jiraTicket, boolean componentsOnly) {
//    App mainApp = appService.get(appKey).orElseThrow(
//      () -> new CustomExceptions.NotManagedException(App.class, appKey)
//    );
//
//    Environment envToDeployTo = environmentService.get(appKey, envKey).orElseThrow(
//      () -> new CustomExceptions.NotManagedException(Environment.class, appKey + "-" + envKey)
//    );
//
//    List<App> mainAppComponents = mainApp.getComponents();
//    List<App> versionedApps = new ArrayList<>();
//
//    if (!componentsOnly) {
//      versionedApps.add(mainApp);
//    }
//
//    if (components != null && !components.isEmpty()) {
//      for (String componentKey : components) {
//        App fetchedComponent = appService.get(componentKey).orElseThrow(
//          () -> new CustomExceptions.NotManagedException(App.class, appKey)
//        );
//
//        if (mainAppComponents.contains(fetchedComponent)) {
//          versionedApps.add(fetchedComponent);
//        } else {
//          throw new CustomExceptions.NoSuchAppComponentException(componentKey, appKey);
//        }
//      }
//    } else if (componentsOnly){
//      versionedApps.addAll(mainAppComponents);
//    }
//
//    for (App versionedApp : versionedApps) {
//      Version appVersion = versionService.get(versionedApp.getKey(), versionName).orElseGet(
//        () -> versionService.save(new Version(versionedApp, versionName, jiraTicket))
//      );
//
//      deploymentService.save(
//        new Deployment(envToDeployTo, appVersion, jiraTicket, LocalDateTime.now())
//      );
//    }
//  }

  @Transactional
  public void release(String projectKey, String envKey, Map<String, String> versionedApps, String jiraTicket) {
    App project = appService.get(projectKey).orElseThrow(
      () -> new CustomExceptions.NotManagedException(App.class, projectKey)
    );

    Environment envToDeployTo = environmentService.get(projectKey, envKey).orElseThrow(
      () -> new CustomExceptions.NotManagedException(Environment.class, projectKey + "-" + envKey)
    );

    List<App> projectComponents = project.getComponents();

    if (versionedApps != null && !versionedApps.isEmpty()) {
      versionedApps.forEach((appKey, versionName) -> {
        App fetchedApp = appService.get(appKey).orElseThrow(
          () -> new CustomExceptions.NotManagedException(App.class, appKey)
        );

        if (!projectComponents.contains(fetchedApp)
          && fetchedApp != project) {
          throw new CustomExceptions.NoSuchAppComponentException(appKey, appKey);
        }

        Version appVersion = versionService.get(appKey, versionName).orElseGet(
          () -> versionService.save(new Version(fetchedApp, versionName))
        );

        deploymentService.save(
          new Deployment(envToDeployTo, appVersion, jiraTicket, LocalDateTime.now())
        );
      });
    }
  }

  public App appFromDto(AppDto appDto) {
    App newApp = new App(appDto.getKey(), appDto.getName());

    appDto.getParentKey().ifPresent(
      parentKey -> {
        App parent = appService.get(parentKey).orElseThrow(
          () -> new CustomExceptions.NotManagedException(App.class, parentKey));
        newApp.setParent(parent);
      }
    );

    newApp.setArchivedTimestamp(appDto.getArchivedTimestamp().orElse(null));

    return newApp;
  }

  public Environment environmentFromDto(EnvironmentDto envDto) {
    App fetchedApp = appService.get(envDto.getAppKey()).orElseThrow(
      () -> new CustomExceptions.NotManagedException(App.class, envDto.getAppKey())
    );

    return new Environment(envDto.getName(), fetchedApp);
  }
}
