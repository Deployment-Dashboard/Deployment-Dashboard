package cz.oksystem.deployment_dashboard.service;

import cz.oksystem.deployment_dashboard.dto.*;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Deployment;
import cz.oksystem.deployment_dashboard.entity.Environment;
import cz.oksystem.deployment_dashboard.entity.Version;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions;
import cz.oksystem.deployment_dashboard.serializers.CustomProtocolsSerializer;
import org.hibernate.Hibernate;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

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

  @Transactional
  public void deleteApp(String appKey, boolean hardDelete) {
    Optional<App> fetchedApp = appService.get(appKey);

    System.out.println("Mažu aplikaci: " + appKey);
    if (fetchedApp.isPresent()) {
      App app = fetchedApp.get();

      new ArrayList<>(app.getDirectComponents()).forEach(component -> this.deleteApp(component.getKey(), hardDelete));

      if (hardDelete) {
        if (!app.isComponent()) {
          new ArrayList<>(app.getEnvironments()).forEach(environment -> this.deleteEnvironment(appKey, environment.getName(), hardDelete));
        }
        new ArrayList<>(app.getVersions()).forEach(version -> {
          new ArrayList<>(version.getDeployments()).forEach(this::deleteDeployment);
          versionService.delete(appKey, version.getName());
        });
      }
    }
    appService.delete(appKey);
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

  @Transactional
  public void deleteEnvironment(String appKey, String envKey, boolean hardDelete) {
    if (hardDelete) {
      environmentService.get(appKey, envKey).ifPresent(environment -> new ArrayList<>(environment.getDeployments()).forEach(this::deleteDeployment));
    }
    environmentService.delete(appKey, envKey);
  }

  @Transactional
  public void release(String projectKey, String envKey, Map<String, String> versionedApps, String jiraTicket, boolean force) {
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

        Deployment newDeployment = new Deployment(envToDeployTo, appVersion, jiraTicket, LocalDateTime.now());

        Optional<Deployment> latestDeployment = deploymentService.getLastDeploymentForApp(appKey);

        // TODO přepsat pomocí nějakého comparatoru
        // kontrola, zda neni nasazena novejsi verze, nebo zda prave nasazovana verze neni prenasazovana
        if (!force
          && latestDeployment.isPresent()
          && latestDeployment.get().getVersion().getId() > appVersion.getId()) {
          throw new CustomExceptions.VersionRollbackException(latestDeployment.get(), newDeployment);
        }
        deploymentService.get(newDeployment).ifPresent(
          deployment -> { if (!force) {
              throw new CustomExceptions.VersionRedeployException(deployment);
            }
          }
        );
        deploymentService.save(newDeployment);
      });
    }
  }

  @Transactional
  public void deleteDeployment(Deployment dep) {
    deploymentService.delete(dep);
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
      List<Deployment> lastDeployments = new ArrayList<>();

      deploymentService.getLastDeploymentForApp(projectKey).ifPresent(lastDeployments::add);

      project.getComponents().forEach(component -> deploymentService.getLastDeploymentForApp(component.getKey()).ifPresent(lastDeployments::add));

      ProjectOverviewDto projectOverview = new ProjectOverviewDto(projectKey, projectName);

      lastDeployments.sort(Comparator.comparing(
        deployment -> deployment.getDate().orElse(null),
        Comparator.nullsLast(Comparator.reverseOrder())
      ));


      if (!lastDeployments.isEmpty()) {
        Deployment lastDeployment = lastDeployments.getFirst();

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

  public List<DeploymentDto> getAllDeployments() {
    List<Deployment> deployments = deploymentService.getAllDeployments();

    return deployments.stream().map(deployment -> new DeploymentDto(
        deployment.getDate().get(),
        deployment.getVersion().getApp().getKey(),
        deployment.getVersion().getApp().getName(),
        deployment.getEnvironment().getName(),
        deployment.getVersion().getName(),
        deployment.getJiraUrl().map(jiraUrl -> jiraUrl.replace("ok-jira://", protocolsSerializer.getCustomProtocols().get("ok-jira"))).orElse("")))
      .collect(Collectors.toList()).reversed();
  }

  public ProjectDetailDto getAppDetailDto(String key) {
    App fetchedApp = appService.get(key).orElseThrow(
      () -> new CustomExceptions.NotManagedException(App.class, key)
    );

    ProjectDetailDto detailDto = new ProjectDetailDto(fetchedApp.getKey(), fetchedApp.getName());

    List<App> apps = new ArrayList<>(fetchedApp.getComponents());
    apps.addFirst(fetchedApp);

    Map<String, List<VersionDto>> componentToVersionDtoMap = new HashMap<>();

    // prochazime aplikace
    for (App app : apps) {
      // inicializujeme list VersionDtos
      List<VersionDto> versionDtos = new ArrayList<>();

      // prochazime verze
      for (Version version : app.getVersions()) {
        // inicializujeme nove DTO pro verzi
        VersionDto versionDto = new VersionDto(version.getId(), version.getName(), version.getDescription().orElse(""));

        // inicializujeme mapu envName -> <deployedDate, jiraUrl>
        Map<String, Pair<LocalDateTime, String>> environmentToDateAndJiraUrlMap = new HashMap<>();

        // pro envs projektu pridame <deployedDate, jiraUrl> do mapy ve VersionDto
        for (Deployment deployment : version.getDeployments()) {
          String jiraUrl = deployment.getJiraUrl().orElse("");
          jiraUrl = jiraUrl.replace("ok-jira://", protocolsSerializer.getCustomProtocols().get("ok-jira"));

          environmentToDateAndJiraUrlMap.put(deployment.getEnvironment().getName(), Pair.of(deployment.getDate().orElse(null), jiraUrl));
        }
        versionDto.setEnvironmentToDateAndJiraUrlMap(environmentToDateAndJiraUrlMap);
        versionDtos.addFirst(versionDto);
      }
      componentToVersionDtoMap.put(app.getKey(), versionDtos);
    }

    detailDto.setEnvironmentNames(fetchedApp.getEnvironments().stream().map(Environment::getName).toList());
    detailDto.setComponentKeysAndNamesMap(apps.stream().collect(
      Collectors.toMap(
        App::getKey,
        App::getName
      )
    ));
    detailDto.setAppKeyToVersionDtosMap(componentToVersionDtoMap);

    return detailDto;
  }

  public List<ProjectDetailDto> getAllAppDetailDtos() {
    List<ProjectDetailDto> detailDtos = new ArrayList<>();

    for (App app : this.appService.getAllProjects()) {
      detailDtos.add(this.getAppDetailDto(app.getKey()));
    }
    return detailDtos;
  }
}
