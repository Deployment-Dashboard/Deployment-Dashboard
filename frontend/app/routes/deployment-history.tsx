import {Link, LoaderFunction, useLoaderData} from "react-router";
import ContentContainer from "~/components/content-container";
import {Button, Group, Checkbox, Paper, Stack, Text, Accordion, Collapse, ActionIcon, Badge} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconExternalLink,
  IconMoodSad,
  IconSelector
} from "@tabler/icons-react";
import {DataTable, DataTableSortStatus} from 'mantine-datatable';
import {API_URL} from "~/constants"
import {useEffect, useMemo, useState} from "react";
import sortBy from 'lodash/sortBy';
import {DatePicker, DatesRangeValue} from "@mantine/dates";
import dayjs from "dayjs";
import 'dayjs/locale/cs';
import {randomId, useListState} from "@mantine/hooks";

export let loader: LoaderFunction = async () => {
  const [response1, response2] = await Promise.all([
    fetch(`${API_URL}/apps/deployments`),
    fetch(`${API_URL}/apps/all`)
  ]);

  const data1 = await response1.json();
  const data2 = await response2.json();

  return [data1, data2];
};

export default function DeploymentHistory() {
  const data = useLoaderData();

  const deployments = data[0]
  const details = data[1];

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'deployedAt',
    direction: 'desc',
  });

  const [records, setRecords] = useState(sortBy(deployments, 'deployedAt'));

  const environments = useMemo(() => {
    const environments = new Set(deployments.map((d) => d.environmentName));
    return [...environments];
  }, []);

  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>(environments);
  const [deployedAtSearchRange, setDeployedAtSearchRange] = useState<DatesRangeValue>();

  const componentGroups = details.flatMap((detail) =>
    ({
      key: detail.key,
      components: Object.keys(detail.componentKeysAndNamesMap).map((key) => key)
    })
  );

  const initialAppValues = details.flatMap((detail) =>
    Object.keys(detail.componentKeysAndNamesMap).map((key) => ({
      label: `${key}`,
      checked: true,
      key: randomId()
    }))
  );

  const [apps, appHandlers] = useListState(initialAppValues);

  const allCheckedApp = (projectKey) => {
    return componentGroups.find(item => item.key === projectKey).components.every((componentKey) => {
      return apps.find(item => item.label === componentKey).checked;
    });
  };

  const indeterminateApp = (projectKey) => {
    const components = componentGroups.find((item) => item.key === projectKey).components;
    const checkedCount = components.filter((componentKey) =>
      apps.find((item) => item.label === componentKey)?.checked
    ).length;
    return checkedCount > 0 && checkedCount < components.length;
  };

  const versionGroups = details.flatMap((detail) => {
    let groups = [];

    const group = Object.keys(detail.appKeyToVersionDtosMap).flatMap(key => {
      const versions = detail.appKeyToVersionDtosMap[key]
        .filter(versionDto =>
          Object.keys(versionDto.environmentToDateAndJiraUrlMap).length > 0
        )
        .map(version => version.name);

      return versions.length > 0 ? [{key, versions}] : [];
    })

    if (group.length > 0) {
      groups = [...groups, {groupKey: detail.key, group: group}]
    }
    return groups;
  });

  const initialVersionValues = details.map(
    (detail) => detail.appKeyToVersionDtosMap).flatMap(
    (versionMap) => Object.keys(versionMap).flatMap(
      (appKey) => versionMap[appKey].filter(
        (versionDto) => (
          Object.keys(versionDto.environmentToDateAndJiraUrlMap).length > 0)).map(version => ({
          label: `${appKey}-${version.name}`,
          checked: true,
          key: randomId()
        })))
  );

  const [versions, versionHandlers] = useListState(initialVersionValues);

  // problem: projekt je verzovana komponenta sama sebe, tzn. musí se podchytit tenhle edge case
  const allCheckedVersion = (appKey) => {
    const group = versionGroups.find(components =>
      components.group.some(component => component.key === appKey)
    );
    if (!group) return false;

    const component = group.group.find(component => component.key === appKey);
    return component.versions.every(version =>
      versions.find(item => item.label === `${appKey}-${version}`)?.checked
    );
  };

  const indeterminateVersion = (appKey) => {
    const group = versionGroups.find(components =>
      components.group.some(component => component.key === appKey)
    );
    if (!group) return false;

    const component = group.group.find(component => component.key === appKey);
    const checkedVersions = component.versions.filter(version =>
      versions.find(item => item.label === `${appKey}-${version}`)?.checked
    );

    return checkedVersions.length > 0 && checkedVersions.length < component.versions.length;
  };

  useEffect(() => {
      const data = sortBy(deployments.filter(({ appKey, environmentName, deployedAt, versionName }) => {
        if (
          deployedAtSearchRange &&
          deployedAtSearchRange[0] &&
          deployedAtSearchRange[1] &&
          (dayjs(deployedAtSearchRange[0]).isAfter(deployedAt, 'day') ||
            dayjs(deployedAtSearchRange[1]).isBefore(deployedAt, 'day'))
        ) return false;

        if (!selectedEnvironments.some((e) => e === environmentName)) return false;

        if (!apps.find((v) => v.label === appKey).checked) return false;

        if (!versions.find((v) => v.label === `${appKey}-${versionName}`).checked) return false;

        return true;
      }
    ), sortStatus.columnAccessor);
    setRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
  }, [deployedAtSearchRange, selectedEnvironments, apps, versions]);

  useEffect(() => {
    const data = sortBy(records, sortStatus.columnAccessor);
    setRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
  }, [sortStatus]);

  return (
    <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
      <Button
        size="md"
        style={{visibility: "hidden"}}
      />
      <ContentContainer>
        <Paper withBorder style={{ borderColor: "green" }}>
        <DataTable
          style={{ tableLayout: 'fixed' }}
          styles={{header: {backgroundColor: "green", color: "white"}}}
          withColumnBorders
          // provide data
          records={records}
          // define columns
          columns={[
            {
              accessor: 'deployedAt',
              title: <span style={{userSelect: 'none'}}>Datum</span>,
              sortable: true,
              render: (row) => (
                row.deployedAt ? (
                  new Date(row.deployedAt).toLocaleDateString("cs-CZ", {
                    year: "numeric",
                    month: "numeric",
                    day: "2-digit",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                ) : "-"
              ),
              filter: ({ close }) => (
                <Stack>
                  <DatePicker
                    locale="cs"
                    maxDate={new Date()}
                    type="range"
                    allowSingleDateInRange
                    value={deployedAtSearchRange}
                    onChange={setDeployedAtSearchRange}
                  />
                  <Button
                    disabled={!deployedAtSearchRange}
                    variant="light"
                    onClick={() => {
                      setDeployedAtSearchRange(undefined);
                      close();
                    }}
                  >
                    Zrušit výběr
                  </Button>
                </Stack>
              ),
              filtering: Boolean(deployedAtSearchRange),
            },
            {
              accessor: 'appKey',
              title: <span style={{userSelect: 'none'}}>Klíč </span>,
              sortable: true,
              filter: ({ close }) => (
                <Stack>
                  <Text fw={500} size="sm">
                    Vyberte aplikace, které chcete zobrazit:
                  </Text>

                  {componentGroups.map((group) => {
                    const [opened, setOpened] = useState(false);

                    return (
                      <div key={group.key}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Checkbox
                            checked={allCheckedApp(group.key)}
                            indeterminate={indeterminateApp(group.key)}
                            label={
                              <Text>{details.find((detail) => detail.key === group.key)
                                ?.componentKeysAndNamesMap[group.key]}
                              </Text>
                            }

                            onChange={() => {
                              const newCheckedState = !allCheckedApp(group.key);
                              appHandlers.setState((current) =>
                                current.map((value) =>
                                  group.components.includes(value.label)
                                    ? { ...value, checked: newCheckedState }
                                    : value
                                )
                              );
                            }}
                          />
                          <ActionIcon
                            variant="subtle"
                            size="xs"
                            ml="auto"
                            onClick={() => setOpened((o) => !o)}
                          >
                            {opened ? <IconChevronUp/> : <IconChevronDown/>}
                          </ActionIcon>
                        </div>
                        <Collapse in={opened}>
                          {group.components.map((component) => {
                            const value = apps.find((item) => item.label === component);
                            return (
                              <Checkbox
                                key={value.key}
                                mt="xs"
                                ml={33}
                                label={
                                  <Group>
                                    <Text>{details.find((detail) => detail.key === group.key)
                                      ?.componentKeysAndNamesMap[value.label]}
                                    </Text>
                                    <Badge variant="default">
                                      {value.label}
                                    </Badge>
                                  </Group>
                              }
                                checked={value.checked}
                                onChange={(event) =>
                                  appHandlers.setItemProp(
                                    apps.indexOf(value),
                                    'checked',
                                    event.currentTarget.checked
                                  )
                                }
                              />
                            );
                          })}
                        </Collapse>
                      </div>
                    );
                  })}
                  <Button
                    disabled={apps.every((value) => value.checked)}
                    variant="light"
                    onClick={() => {
                      close();
                      appHandlers.setState((current) =>
                        current.map((value) => ({ ...value, checked: true }))
                      );
                    }}
                  >
                    Zrušit výběr
                  </Button>
                </Stack>
              ),
              filtering: apps.some((value) => !value.checked)
            },
            {
              accessor: 'appName',
              title: <span style={{userSelect: 'none'}}>Aplikace</span>
            },
            {
              accessor: 'environmentName',
              title: <span style={{userSelect: 'none'}}>Prostředí</span>,
              sortable: true,
              filter: ({ close }) => (
                <Stack>
                  <Text fw={500} size="sm">
                    Vyberte prostředí, která chcete zobrazit:
                  </Text>
                  <Checkbox.Group
                    defaultValue={selectedEnvironments}
                    onChange={setSelectedEnvironments}
                  >
                    <Group mt="xs">
                      <Stack>
                        {environments.map(e =>
                          <Checkbox value={e} label={e.toUpperCase()}/>)}
                      </Stack>
                    </Group>
                  </Checkbox.Group>
                  <Button
                    disabled={!(selectedEnvironments.length !== environments.length ||
                      new Set(selectedEnvironments).size !== new Set(selectedEnvironments.concat(environments)).size)}
                    variant="light"
                    onClick={() => {
                      close();
                      setSelectedEnvironments(environments);
                    }}
                  >
                    Zrušit výběr
                  </Button>
                </Stack>
              ),
              filtering: selectedEnvironments.length !== environments.length ||
                new Set(selectedEnvironments).size !== new Set(selectedEnvironments.concat(environments)).size,
            },
            {
              accessor: 'versionName',
              title: <span style={{userSelect: 'none'}}>Verze</span>,
              sortable: true,
              filter: ({ close }) => (
                <Stack>
                  <Text fw={500} size="sm">
                    Vyberte verze, které chcete zobrazit:
                  </Text>

                  {versionGroups.map((versionGroup) => {
                    const [openedTopLevel, setOpenedTopLevel] = useState(false);

                    return (
                      <div key={versionGroup.key}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Checkbox
                            checked={versionGroup.group.every(component => allCheckedVersion(component.key))}
                            indeterminate={versionGroup.group.some(component => !allCheckedVersion(component.key))
                              && versionGroup.group.some(component =>
                                indeterminateVersion(component.key)
                                || allCheckedVersion(component.key))}
                            label={
                              <Text>{details.find((detail) => detail.key === versionGroup.groupKey)
                                ?.componentKeysAndNamesMap[versionGroup.groupKey]}
                              </Text>
                            }

                            onChange={() => {
                              const newCheckedState = !versionGroup.group.every(component => allCheckedVersion(component.key))

                              const labels = versionGroup.group.flatMap(component => component.versions.map(version => `${component.key}-${version}`));

                              versionHandlers.setState((current) =>
                                current.map((value) =>
                                  labels.includes(value.label)
                                    ? { ...value, checked: newCheckedState }
                                    : value
                                )
                              );
                            }}
                          />
                          <ActionIcon
                            variant="subtle"
                            size="xs"
                            ml="auto"
                            onClick={() => setOpenedTopLevel((o) => !o)}
                          >
                            {openedTopLevel ? <IconChevronUp/> : <IconChevronDown/>}
                          </ActionIcon>
                        </div>
                        <Collapse in={openedTopLevel}>
                          {versionGroup.group.map((component) => {
                            const [openedSecondLevel, setOpenedSecondLevel] = useState(true);

                            return (
                              <div>
                                <div style={{display: 'flex', alignItems: 'center'}}>
                                  <Checkbox
                                    key={component.key}
                                    mt="xs"
                                    ml={33}
                                    label={
                                      <Group>
                                        <Text>{details.find((appDetail) => appDetail.key === versionGroup.groupKey)
                                          ?.componentKeysAndNamesMap[component.key]}
                                        </Text>
                                        <Badge variant="default">
                                          {component.key}
                                        </Badge>
                                      </Group>
                                    }
                                    checked={allCheckedVersion(component.key)}
                                    indeterminate={indeterminateVersion(component.key)}
                                    onChange={() => {
                                      const newCheckedState = !allCheckedVersion(component.key);
                                      versionHandlers.setState((current) =>
                                        current.map((value) =>
                                          component.versions.includes(value.label.substring(component.key.length + 1, value.label.length)) && value.label.startsWith(component.key)
                                            ? { ...value, checked: newCheckedState }
                                            : value
                                        )
                                      );
                                    }}
                                  />
                                  <ActionIcon
                                    variant="subtle"
                                    size="xs"
                                    ml="auto"
                                    onClick={() => setOpenedSecondLevel((o) => !o)}
                                  >
                                    {openedSecondLevel ? <IconChevronUp/> : <IconChevronDown/>}
                                  </ActionIcon>
                                </div>
                                <Collapse in={openedSecondLevel}>
                                  {component.versions.map(version => {
                                    const versionListState = versions.find(versionListState => versionListState.label === `${component.key}-${version}`);

                                    return (
                                    <Checkbox
                                      key={versionListState.key}
                                      mt="xs"
                                      ml={66}
                                      label={
                                        <Text>
                                          ver. {version.substring(component.length + 1, version.length)}
                                        </Text>
                                      }
                                      checked={versionListState.checked}
                                      onChange={(event) =>
                                        versionHandlers.setItemProp(
                                          versions.indexOf(versionListState),
                                          'checked',
                                          event.currentTarget.checked
                                        )
                                      }
                                    />)}
                                  )}
                                </Collapse>
                              </div>
                            )
                          })}
                        </Collapse>
                      </div>
                    );
                  })}
                  <Button
                    disabled={versions.every((value) => value.checked)}
                    variant="light"
                    onClick={() => {
                      close();
                      versionHandlers.setState((current) =>
                        current.map((value) => ({ ...value, checked: true }))
                      );
                    }}
                  >
                    Zrušit výběr
                  </Button>
                </Stack>
              ),
              filtering: versions.some((value) => !value.checked)
            },
            {
              accessor: 'jiraUrl',
              title: <span style={{userSelect: 'none'}}>Jira ticket</span>,
              textAlign: 'right',
              render: (row) => (
                row.jiraUrl ? (
                    <Link
                      to={row.jiraUrl}
                      style={{ color: "green", display: "inline-flex", alignSelf: 'center' }}
                    >
                      <IconExternalLink />
                    </Link>
                  ) : "-"
              ),
            },
          ]}
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
          sortIcons={{
            sorted:
              sortStatus.direction === 'asc' ? (
                <IconChevronUp size={14} />
              ) : (
                <IconChevronDown size={14} />
              ),
            unsorted: <IconSelector size={14} />,
          }}

        />
        </Paper>
      </ContentContainer>
    </div>
  );
}
