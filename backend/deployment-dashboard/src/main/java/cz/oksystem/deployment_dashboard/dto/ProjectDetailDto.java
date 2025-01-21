package cz.oksystem.deployment_dashboard.dto;

import java.util.List;
import java.util.Map;

public class ProjectDetailDto {
  private String key;
  private String name;
  private List<String> environmentNames;
  private Map<String, String> componentKeysAndNamesMap;
  private Map<String, List<VersionDto>> appKeyToVersionDtosMap;

  public ProjectDetailDto() {}

  public ProjectDetailDto(String key, String name) {
    this(key, name, null, null, null);
  }

  public ProjectDetailDto(String key, String name, List<String> environmentNames, Map<String, String> componentKeysAndNamesMap, Map<String, List<VersionDto>>appKeyToVersionDtosMap) {
    this.key = key;
    this.name = name;
    this.environmentNames = environmentNames;
    this.componentKeysAndNamesMap = componentKeysAndNamesMap;
    this.appKeyToVersionDtosMap = appKeyToVersionDtosMap;
  }

  public String getKey() {
    return key;
  }

  public void setKey(String key) {
    this.key = key;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public List<String> getEnvironmentNames() {
    return environmentNames;
  }

  public void setEnvironmentNames(List<String> environmentNames) {
    this.environmentNames = environmentNames;
  }

  public Map<String, String> getComponentKeysAndNamesMap() {
    return componentKeysAndNamesMap;
  }

  public void setComponentKeysAndNamesMap(Map<String, String> componentKeysAndNamesMap) {
    this.componentKeysAndNamesMap = componentKeysAndNamesMap;
  }

  public Map<String, List<VersionDto>> getAppKeyToVersionDtosMap() {
    return appKeyToVersionDtosMap;
  }

  public void setAppKeyToVersionDtosMap(Map<String, List<VersionDto>> appKeyToVersionDtosMap) {
    this.appKeyToVersionDtosMap = appKeyToVersionDtosMap;
  }
}
