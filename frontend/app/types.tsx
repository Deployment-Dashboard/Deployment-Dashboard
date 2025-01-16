export type ProjectOverviewDto = {
  key: string;
  name: string;
  lastDeployedAt: Date;
  lastDeployedVersionName: string;
  lastDeployedToEnvName: string;
  lastDeploymentJiraUrl: string;
  versionedComponentsNames: string[];
}

export type Environment = {

}

export type Version = {

}

export type AppDto = {
  key: string;
  name: string;
  parentKey?: string;
  archivedTimestamp?: Date;
}

export type App = {
  id: bigint;
  key: string;
  name: string;
  archivedTimestamp: Date;
  parent: App;
  environments: Environment[];
  versions: Version[];
  components: App[];
}

export type ErrorBody = {
  timestamp: Date;
  statusCode: number;
  message: string;
  details: string;
  path: string;
}
