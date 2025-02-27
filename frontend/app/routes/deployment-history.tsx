import {Link, LoaderFunction, useLoaderData} from "react-router";
import ContentContainer from "~/components/content-container";
import {
  Button,
  Group,
  Checkbox,
  Paper,
  Stack,
  Text,
  Loader,
  Collapse,
  ActionIcon,
  Badge,
  ScrollArea, Box, Menu, PillGroup, Transition, Pill, HoverCard
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconExternalLink,
  IconSelector, IconWind, IconX
} from "@tabler/icons-react";
import {DataTable, DataTableSortStatus} from 'mantine-datatable';
import {API_URL} from "~/constants"
import {useEffect, useMemo, useState} from "react";
import sortBy from 'lodash/sortBy';
import {DatePicker, DatesRangeValue} from "@mantine/dates";
import dayjs from "dayjs";
import 'dayjs/locale/cs';
import {randomId, useListState} from "@mantine/hooks";
import classes = Menu.classes;

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

  environments.sort()

  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);
  const [deployedAtSearchRange, setDeployedAtSearchRange] = useState<DatesRangeValue>();

  const componentGroups = details.flatMap((detail) =>
    ({
      key: detail.key,
      components: Object.keys(detail.componentKeysAndNamesMap).sort((a, b) => a.localeCompare(b)).map((key) => key)
    })
  ).sort((a, b) => a.key.localeCompare(b.key));

  const initialAppValues = details.flatMap((detail) =>
    Object.keys(detail.componentKeysAndNamesMap)
      .map((key) => ({
        label: `${key}`,
        checked: false,
        key: randomId()
      }))
  ).sort((a, b) => a.label.localeCompare(b.label));

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

    const group = Object.keys(detail.appKeyToVersionDtosMap).sort((a, b) => a.localeCompare(b)).flatMap(key => {
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
  }).sort((a, b) => a.groupKey.localeCompare(b.groupKey));

  const initialVersionValues = details.map(
    (detail) => detail.appKeyToVersionDtosMap).flatMap(
    (versionMap) => Object.keys(versionMap).flatMap(
      (appKey) => versionMap[appKey].filter(
        (versionDto) => (
          Object.keys(versionDto.environmentToDateAndJiraUrlMap).length > 0)).map(version => ({
        label: `${appKey}-${version.name}`,
        checked: false,
        key: randomId()
      })))
  );

  const [versions, versionHandlers] = useListState(initialVersionValues);

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
    const data = sortBy(deployments.filter(({appKey, environmentName, deployedAt, versionName}) => {
        if (
          deployedAtSearchRange &&
          deployedAtSearchRange[0] &&
          deployedAtSearchRange[1] &&
          (dayjs(deployedAtSearchRange[0]).isAfter(deployedAt, 'day') ||
            dayjs(deployedAtSearchRange[1]).isBefore(deployedAt, 'day'))
        ) return false;

        if (selectedEnvironments.length > 0 && !selectedEnvironments.some(e => e === environmentName)) return false;

        if (apps.some(a => a.checked) && !apps.find(a => a.label === appKey).checked) return false;

        if (versions.some(v => v.checked) && !versions.find((v) => v.label === `${appKey}-${versionName}`).checked) return false;

        return true;
      }
    ), sortStatus.columnAccessor);
    setRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
  }, [deployedAtSearchRange, selectedEnvironments, apps, versions]);

  useEffect(() => {
    const data = sortBy(records, sortStatus.columnAccessor);
    setRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
  }, [sortStatus]);

  const [isFiltered, setIsFiltered] = useState(false);

  const [filters, setFilters] = useState({});

  useEffect(() => {
    const newFilters = {};

    if (deployedAtSearchRange && deployedAtSearchRange[0] instanceof Date && deployedAtSearchRange[1] instanceof Date) {
      newFilters["dateFilter"] = { start: deployedAtSearchRange[0], end: deployedAtSearchRange[1] }
    }
    if (apps.some(a => a.checked)) {
      newFilters["appsFilter"] = { apps: apps.filter(app => app.checked) }
    }
    if (selectedEnvironments.length > 0) {
      newFilters["envsFilter"] = { envs: selectedEnvironments }
    }
    if (versions.some(v => v.checked)) {
      newFilters["versionsFilter"] = { versions: versions.filter(version => version.checked) }
    }

    setFilters(newFilters);
    setIsFiltered(Object.keys(newFilters).length > 0);
  }, [deployedAtSearchRange, selectedEnvironments, apps, versions]);

  const resetFilters = () => {
    setDeployedAtSearchRange(undefined);
    appHandlers.setState((current) =>
      current.map((value) => ({...value, checked: false}))
    );
    setSelectedEnvironments([]);
    versionHandlers.setState((current) =>
      current.map((value) => ({...value, checked: false}))
    );
  }

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
        <Button size="md" style={{visibility: "hidden"}}/>
        <ContentContainer>
          <Loader size="xl" m="auto" mt="300px" type="bars"/>
        </ContentContainer>
      </div>
    )
  }

  return (
    <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
      <div style={{position: "relative", height: "42px"}}>
        <Transition
          mounted={isFiltered}
          transition="slide-up"
          duration={400}
          timingFunction="ease"
        >
          {(styles) => (
            <Paper
              shadow="xs"
              radius="md"
              h="42px"
              size="md"
              bg="dynamicBackground"
              style={{
                ...styles,
                position: "absolute",
                width: "100%",
                zIndex: 1,
              }}>
              {isFiltered ?
                <Stack h="100%" justify="center">
                  <Group pr="md" pl="sm" w="100%" align="center">
                    <Text fw={500}>Aktivní filtry: </Text>
                    {filters["dateFilter"] &&
                      <Pill
                        styles={{
                          remove: {marginLeft: "2px", marginRight: "2px"}
                        }}
                        c="white"
                        style={{backgroundColor: "green"}}
                        size="md"
                        withRemoveButton
                        onRemove={() => setDeployedAtSearchRange(undefined)}
                      >
                        <Text>
                          {filters["dateFilter"].start.toLocaleDateString("cs-CZ")} – {filters["dateFilter"].end.toLocaleDateString("cs-CZ")}
                        </Text>
                      </Pill>}
                    {filters["appsFilter"] &&
                      <Pill
                        styles={{
                          remove: {marginLeft: "2px", marginRight: "2px"}
                        }}
                        c="white"
                        style={{backgroundColor: "green"}}
                        size="md"
                        withRemoveButton
                        onRemove={() => appHandlers.setState((current) =>
                          current.map((value) => ({...value, checked: false}))
                        )}
                      >
                        <HoverCard withArrow position="bottom" width={430} shadow="sm">
                          <HoverCard.Target>
                            <Text>
                              {filters["appsFilter"].apps.length}
                              {(() => {
                                const selectedAppsCount = filters["appsFilter"].apps.length;
                                if (selectedAppsCount === 1) {
                                  return (" vybraná aplikace")
                                } else if (selectedAppsCount < 5) {
                                  return (" vybrané aplikace")
                                }
                                return (" vybraných aplikací")
                              })()}
                            </Text>
                          </HoverCard.Target>
                          <HoverCard.Dropdown w="fit-content">
                            <Stack w="100%">
                              <ScrollArea.Autosize
                                bg="dynamicBackground"
                                w="100%" mah={500}
                                offsetScrollbars
                                style={{
                                  overscrollBehavior: "contain",
                                  borderRadius: 'var(--mantine-radius-sm)'
                                }}
                              >
                                <Stack ml="md" mt="md">
                                  {apps.sort().filter(app => app.checked).map(app =>
                                    <Group>
                                      <Text>
                                        {details.find(detail => detail.componentKeysAndNamesMap[app.label]).componentKeysAndNamesMap[app.label]}
                                      </Text>
                                      <Badge color="green">
                                        {app.label}
                                      </Badge>
                                      <ActionIcon ml="auto" color="red" variant="subtle" onClick={() =>
                                        appHandlers.setItemProp(
                                          apps.indexOf(app),
                                          'checked',
                                          false)}
                                      >
                                        <IconX/>
                                      </ActionIcon>
                                    </Group>)
                                  }
                                </Stack>
                              </ScrollArea.Autosize>
                            </Stack>
                          </HoverCard.Dropdown>
                        </HoverCard>
                      </Pill>}
                    {filters["envsFilter"]
                      && <Pill
                        styles={{
                          remove: {marginLeft: "2px", marginRight: "2px"}
                        }}
                        c="white"
                        style={{backgroundColor: "green"}}
                        size="md"
                        withRemoveButton
                        onRemove={() => setSelectedEnvironments([])}
                      >
                        <HoverCard withArrow position="bottom" width={430} shadow="sm">
                          <HoverCard.Target>
                            <Text>
                              {filters["envsFilter"].envs.length}
                              {(() => {
                                const selectedAppsCount = filters["envsFilter"].envs.length;
                                if (selectedAppsCount === 1) {
                                  return (" vybrané prostředí")
                                } else if (selectedAppsCount < 5) {
                                  return (" vybraná prostředí")
                                }
                                return (" vybraných prostředí")
                              })()}
                            </Text>
                          </HoverCard.Target>
                          <HoverCard.Dropdown w="fit-content">
                            <Stack w="100%">
                              <ScrollArea.Autosize
                                bg="dynamicBackground"
                                w="100%" mah={500}
                                offsetScrollbars
                                style={{
                                  overscrollBehavior: "contain",
                                  borderRadius: 'var(--mantine-radius-sm)'
                                }}
                              >
                                <Stack ml="md" mt="md">
                                  {selectedEnvironments.sort().map(env =>
                                    <Group>
                                      <Text>
                                        {env.toUpperCase()}
                                      </Text>
                                      <ActionIcon ml="auto" color="red" variant="subtle" onClick={() =>
                                        setSelectedEnvironments(selectedEnvironments.filter(selectedEnv => selectedEnv != env))
                                      }
                                      >
                                        <IconX/>
                                      </ActionIcon>
                                    </Group>)
                                  }
                                </Stack>
                              </ScrollArea.Autosize>
                            </Stack>
                          </HoverCard.Dropdown>
                        </HoverCard>
                      </Pill>}
                    {filters["versionsFilter"]
                      && <Pill
                        styles={{
                          remove: {marginLeft: "2px", marginRight: "2px"}
                        }}
                        c="white"
                        style={{backgroundColor: "green"}}
                        size="md"
                        withRemoveButton
                        onRemove={() => versionHandlers.setState((current) =>
                          current.map((value) => ({...value, checked: false}))
                        )}
                      >
                        <HoverCard withArrow position="bottom" width={430} shadow="sm">
                          <HoverCard.Target>
                            <Text>
                              {filters["versionsFilter"].versions.length}
                              {(() => {
                                const selectedAppsCount = filters["versionsFilter"].versions.length;
                                if (selectedAppsCount === 1) {
                                  return (" vybraná verze")
                                } else if (selectedAppsCount < 5) {
                                  return (" vybrané verze")
                                }
                                return (" vybraných verzí")
                              })()}
                            </Text>
                          </HoverCard.Target>
                          <HoverCard.Dropdown w="fit-content">
                            <Stack w="100%">
                              <ScrollArea.Autosize
                                bg="dynamicBackground"
                                w="100%" mah={500}
                                offsetScrollbars
                                style={{
                                  overscrollBehavior: "contain",
                                  borderRadius: 'var(--mantine-radius-sm)'
                                }}
                              >
                                <Stack ml="md" mt="md">
                                  {versionGroups.flatMap(versionGroup => versionGroup.group).map(component =>
                                    component.versions.map(versionName => {
                                      const version = versions.find((v) => v.label === `${component.key}-${versionName}`);

                                      return version && version.checked ?
                                      <Group>
                                        <Text>
                                          {details.find(detail => detail.componentKeysAndNamesMap[component.key]).componentKeysAndNamesMap[component.key]}
                                        </Text>
                                        <Badge color="green">
                                          {versionName}
                                        </Badge>
                                        <ActionIcon ml="auto" color="red" variant="subtle" onClick={() =>
                                          versionHandlers.setItemProp(
                                            versions.indexOf(version),
                                            'checked',
                                            false)}
                                        >
                                          <IconX/>
                                        </ActionIcon>
                                      </Group> : null}))}
                                </Stack>
                              </ScrollArea.Autosize>
                            </Stack>
                          </HoverCard.Dropdown>
                        </HoverCard>
                      </Pill>}
                    <ActionIcon ml="auto" style={{visibility: isFiltered ? "visible" : "hidden"}} color="red" variant="subtle" onClick={resetFilters}>
                      <IconX/>
                    </ActionIcon>
                  </Group>
                </Stack> : null}
              </Paper>
          )}
        </Transition>
      </div>

      <DataTable
        height="calc(100vh - 220px)"
        backgroundColor="dynamicBackground"
        shadow="xs"
        style={{
          borderTopLeftRadius: 'var(--mantine-radius-md)',
          borderTopRightRadius: 'var(--mantine-radius-md)',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          zIndex: 2,
        }}
        withColumnBorders
        records={records}
        columns={[
          {
            accessor: 'deployedAt',
            title: <span style={{userSelect: 'none'}}>Datum</span>,
            titleStyle: {
              fontSize: "16px",
              backgroundColor: "green",
              color: "white"
            },
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
            filter: ({close}) => (
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
            filtering: deployedAtSearchRange && deployedAtSearchRange[0] instanceof Date && deployedAtSearchRange[1] instanceof Date,
          },
          {
            accessor: 'appKey',
            title: <span style={{userSelect: 'none'}}>Klíč</span>,
            titleStyle: {

              fontSize: "16px",
              backgroundColor: "green",
              color: "white"
            },
            sortable: true,
            filter: ({close}) => (
              <Stack>
                <Text fw={500}>
                  Vyberte aplikace, které chcete zobrazit:
                </Text>

                <ScrollArea.Autosize mah={415} offsetScrollbars overscrollBehavior="contain">
                  <Stack>
                    {componentGroups.map((group) => {
                      const [opened, setOpened] = useState(false);

                      return (
                        <div key={group.key}>
                          <div style={{display: 'flex', alignItems: 'center'}}>
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
                                      ? {...value, checked: newCheckedState}
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
                                      <Badge color="green">
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
                  </Stack>
                </ScrollArea.Autosize>
                <Button
                  disabled={apps.every((value) => !value.checked)}
                  variant="light"
                  onClick={() => {
                    close();
                    appHandlers.setState((current) =>
                      current.map((value) => ({...value, checked: false}))
                    );
                  }}
                >
                  Zrušit výběr
                </Button>
              </Stack>
            ),
            filtering: apps.some((value) => value.checked)
          },
          {
            accessor: 'appName',
            title: <span style={{userSelect: 'none'}}>Aplikace</span>,
            titleStyle: {

              fontSize: "16px",
              backgroundColor: "green",
              color: "white"
            },
          },
          {
            accessor: 'environmentName',
            title: <span style={{userSelect: 'none'}}>Prostředí</span>,
            titleStyle: {

              fontSize: "16px",
              backgroundColor: "green",
              color: "white"
            },
            sortable: true,
            filter: ({close}) => (
              <Stack>
                <Text fw={500}>
                  Vyberte prostředí, která chcete zobrazit:
                </Text>
                <Checkbox.Group
                  value={selectedEnvironments}
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
                  disabled={selectedEnvironments.length === 0}
                  variant="light"
                  onClick={() => {
                    close();
                    setSelectedEnvironments([]);
                  }}
                >
                  Zrušit výběr
                </Button>
              </Stack>
            ),
            filtering: selectedEnvironments.length !== 0
          },
          {
            accessor: 'versionName',
            title: <span style={{userSelect: 'none'}}>Verze</span>,
            titleStyle: {

              fontSize: "16px",
              backgroundColor: "green",
              color: "white"
            },
            sortable: true,
            filter: ({close}) => (
              <Stack>
                <Text fw={500}>
                  Vyberte verze, které chcete zobrazit:
                </Text>

                <ScrollArea.Autosize mah={415} offsetScrollbars overscrollBehavior="contain">
                  <Stack>
                    {versionGroups.map((versionGroup) => {
                      const [openedTopLevel, setOpenedTopLevel] = useState(false);

                      return (
                        <div key={versionGroup.key}>
                          <div style={{display: 'flex', alignItems: 'center'}}>
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
                                      ? {...value, checked: newCheckedState}
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
                              const [openedSecondLevel, setOpenedSecondLevel] = useState(false);

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
                                          <Badge color="green">
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
                                              ? {...value, checked: newCheckedState}
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
                                                {version.substring(component.length + 1, version.length)}
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
                                          />)
                                      }
                                    )}
                                  </Collapse>
                                </div>
                              )
                            })}
                          </Collapse>
                        </div>
                      );
                    })}
                  </Stack>
                </ScrollArea.Autosize>
                <Button
                  disabled={versions.every((value) => !value.checked)}
                  variant="light"
                  onClick={() => {
                    close();
                    versionHandlers.setState((current) =>
                      current.map((value) => ({...value, checked: false}))
                    );
                  }}
                >
                  Zrušit výběr
                </Button>
              </Stack>
            ),
            filtering: versions.some((value) => value.checked)
          },
          {
            accessor: 'jiraUrl',
            title: <span style={{userSelect: 'none'}}>Jira ticket</span>,
            titleStyle: {

              fontSize: "16px",
              backgroundColor: "green",
              color: "white"
            },
            textAlign: 'center',
            render: (row) => (
              row.jiraUrl ? (
                <ActionIcon variant="subtle" component="a" href={row.jiraUrl}>
                  <IconExternalLink/>
                </ActionIcon>
              ) : "-"
            ),
          },
        ]}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        sortIcons={{
          sorted: <IconChevronDown size={14} color="white"/>,
          unsorted: <IconSelector size={14} color="white"/>,
        }}
        noRecordsText="Žádné záznamy k zobrazení."
        noRecordsIcon={
          <Box p={4} mb={4} className={classes.noRecordsBox}>
            <IconWind size={36} strokeWidth={1.5}/>
          </Box>
        }
      />
    </div>
  );
}
