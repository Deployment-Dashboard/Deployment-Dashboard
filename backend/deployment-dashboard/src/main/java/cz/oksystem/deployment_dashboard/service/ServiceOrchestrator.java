package cz.oksystem.deployment_dashboard.service;

import cz.oksystem.deployment_dashboard.dto.AppDto;
import cz.oksystem.deployment_dashboard.dto.EnvironmentDto;
import cz.oksystem.deployment_dashboard.dto.ProjectOverviewDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Deployment;
import cz.oksystem.deployment_dashboard.entity.Environment;
import cz.oksystem.deployment_dashboard.entity.Version;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions;
import cz.oksystem.deployment_dashboard.serializers.CustomProtocolsSerializer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

// TODO projít services a všechny cross-checky přesunout sem
@Service
public class ServiceOrchestrator {
  private final AppService appService;
  private final EnvironmentService environmentService;
  private final VersionService versionService;
  private final DeploymentService deploymentService;
  private final CustomProtocolsSerializer protocolsSerializer;


  public ServiceOrchestrator(AppService appService, EnvironmentService environmentService, VersionService versionService, DeploymentService deploymentService, CustomProtocolsSerializer protocolsSerializer) {
    this.appService = appService;
    this.environmentService = environmentService;
    this.versionService = versionService;
    this.deploymentService = deploymentService;
    this.protocolsSerializer = protocolsSerializer;
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

  public List<ProjectOverviewDto> getAllProjectOverviews() {
    List<ProjectOverviewDto> projectOverviews = new ArrayList<>();

    List<App> projects = appService.getAllProjects();

    for (App project : projects) {
      String projectKey = project.getKey();
      String projectName = project.getName();
      Optional<Deployment> fetchedLastDeployment = deploymentService.getLastDeploymentForApp(projectKey);

      ProjectOverviewDto projectOverview = new ProjectOverviewDto(projectKey, projectName);

      if (fetchedLastDeployment.isPresent()) {
        Deployment lastDeployment = fetchedLastDeployment.get();

        lastDeployment.getDate().ifPresent(projectOverview::setLastDeployedAt);
        projectOverview.setLastDeployedVersionName(lastDeployment.getVersion().getName());
        projectOverview.setLastDeployedToEnvName(lastDeployment.getEnvironment().getName());
        lastDeployment.getJiraUrl().ifPresent(jiraUrl -> projectOverview.setLastDeploymentJiraUrl(jiraUrl.replace("ok-jira://", protocolsSerializer.getCustomProtocols().get("ok-jira"))));
        projectOverview.setVersionedComponentsNames(deploymentService.getDeployedAppsByJiraUuid(lastDeployment.getJiraUrl())
          .stream()
          .map(deployment -> deployment.getVersion().getApp().getKey()).toList());
      }
      projectOverviews.add(projectOverview);
    }
    return projectOverviews;
  }

  public List<Deployment> getAllDeployments() {
    return deploymentService.getAllDeployments();
  }
}
