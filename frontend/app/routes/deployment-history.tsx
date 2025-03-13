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
  ScrollArea, Box, Menu, PillGroup, Transition, Pill, HoverCard, Popover, Title
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconExternalLink,
  IconSelector, IconWind, IconX
} from "@tabler/icons-react";
import {DataTable, DataTableSortStatus} from 'mantine-datatable';
import {API_URL} from "~/constants"
import {useEffect, useMemo, useRef, useState} from "react";
import sortBy from 'lodash/sortBy';
import orderBy from 'lodash/orderBy'
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

  const [openedApps, setOpenedApps] = useState<boolean[]>(() =>
    componentGroups.map(() => false)
  );

  const [openedVersionsTopLevel, setOpenedVersionsTopLevel] = useState<boolean[]>(() =>
    componentGroups.map(() => false)
  );
  const [openedVersionsSecondLevel, setOpenedVersionsSecondLevel] = useState<Record<string, boolean>>(() =>
    versionGroups.flatMap(({ group }) => group.map(({ key }) => ({ key, value: false })))
  );

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const [measuredWidth, setMeasuredWidth] = useState<number>();
  const measureRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      if (measureRef.current) {
        setMeasured(true);
        setMeasuredWidth(measureRef.current.offsetWidth);
      }
    }, 20);
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
        {!measured && (
          <div
            style={{
              position: "absolute",
              top: "-9999px",
              left: "-9999px",
              pointerEvents: "none"
            }}
          >
          <Popover defaultOpened >
            <Popover.Target>
              <Text>
              </Text>
            </Popover.Target>
            <Popover.Dropdown ref={measureRef}>
              <div style={{width: "100%"}} >
              <Stack w="100%">
                <ScrollArea.Autosize
                  w="100%" mah={500}
                  offsetScrollbars
                >
                  <Stack ml="md" mt="md">
                    {componentGroups.map(group => {
                      const detail = details.find(detail => detail.key === group.key);

                      return (
                        <>
                          <Group gap={5}>
                            <Button
                              flex={1}
                              w="100%"
                              size="sm"
                              justify="space-between"
                              variant="subtle"
                              leftSection={
                                <Group>
                                  <IconChevronUp/>
                                  <Text>
                                    {detail.name}
                                  </Text>
                                </Group>
                              }
                            />
                            <ActionIcon ml="auto" mr={2} color="red" variant="light" size={20}>
                              <IconX/>
                            </ActionIcon>
                          </Group>
                          <Collapse in={true}>
                            {group.components.map(component => (
                                <Group
                                  mt="xs"
                                  ml={33}
                                >
                                  <Text>
                                    {detail.componentKeysAndNamesMap[component]}
                                  </Text>
                                  <Badge color="green">
                                    {component}
                                  </Badge>
                                  <ActionIcon mr={2} ml="auto" color="red" variant="light" size={20}>
                                    <IconX/>
                                  </ActionIcon>
                                </Group>
                            ))}
                          </Collapse>
                        </>
                      )})}
                  </Stack>
                </ScrollArea.Autosize>
              </Stack>
              </div>
            </Popover.Dropdown>
          </Popover>
        </div>)}

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
                          {(() => {
                            const startDate = filters["dateFilter"].start.toLocaleDateString("cs-CZ");
                            const endDate = filters["dateFilter"].end.toLocaleDateString("cs-CZ");
                            return startDate === endDate
                              ? startDate
                              : `${startDate} – ${endDate}`
                          })()}
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
                        <HoverCard withArrow position="bottom" shadow="sm">
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
                          <HoverCard.Dropdown w={measuredWidth} pl={0} py={0}>
                              <ScrollArea.Autosize
                                ml="sm"
                                w="100%" mah={485}
                                offsetScrollbars
                                style={{
                                  overscrollBehavior: "contain",
                                  borderRadius: 'var(--mantine-radius-sm)'
                                }}
                              >
                                <Stack w="100%" mt="xs" gap={0}>
                                {componentGroups.filter(group =>
                                  group.components.some(component =>
                                    apps.find(app => app.label === component && app.checked))).map(((group, index) => {
                                  const detail = details.find(detail => detail.key === group.key);

                                  return (
                                  <>
                                    <Group gap={5}>
                                      <Button
                                        flex={1}
                                        w="100%"
                                        size="sm"
                                        justify="space-between"
                                        variant="subtle"
                                        onClick={() => setOpenedApps((prev) => prev.map((o, i) => (i === index ? !o : o)))}
                                        leftSection={
                                          <Group>
                                            {openedApps[index] ? <IconChevronUp/> : <IconChevronDown/>}
                                            <Text c="var(--mantine-color-text)">
                                              {detail.name}
                                            </Text>
                                          </Group>
                                        }
                                      />
                                      <ActionIcon ml="auto" mr={2} color="red" variant="light" size={20} onClick={() =>
                                        group.components.forEach(component =>
                                          appHandlers.setItemProp(
                                            apps.findIndex(app => app.label === component),
                                            'checked',
                                            false)
                                        )}
                                      >
                                        <IconX/>
                                      </ActionIcon>
                                    </Group>
                                    <Collapse in={openedApps[index]}>
                                      {group.components.map(component => {
                                        const appState = apps.find(app => app.label === component && app.checked)

                                        return appState
                                          ? <Group
                                            w="100%"
                                            h={36} // Match the button height
                                            pl={33} // Match button padding
                                          >
                                            <Text c="var(--mantine-color-text)" style={{ userSelect: "text" }}>
                                              {detail.componentKeysAndNamesMap[component]}
                                            </Text>
                                            <Badge color="green">{component}</Badge>
                                            <ActionIcon
                                              mr={2}
                                              ml="auto"
                                              color="red"
                                              variant="light"
                                              size={20}
                                              onClick={() =>
                                                appHandlers.setItemProp(apps.indexOf(appState), "checked", false)
                                              }
                                            >
                                              <IconX />
                                            </ActionIcon>
                                          </Group>
                                          : null
                                      })}
                                    </Collapse>
                                  </>
                                )}))}
                              </Stack>
                            </ScrollArea.Autosize>
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
                          <HoverCard.Dropdown w="fit-content" py={0} px="sm">
                            <Stack w="100%">
                              <ScrollArea.Autosize
                                w="100%" mah={500}
                                offsetScrollbars
                                style={{
                                  overscrollBehavior: "contain",
                                  borderRadius: 'var(--mantine-radius-sm)'
                                }}
                              >
                                <Stack ml="md" mt="md" gap="xs">
                                  {selectedEnvironments.sort().map(env =>
                                    <Group>
                                      <Text>
                                        {env.toUpperCase()}
                                      </Text>
                                      <ActionIcon ml="auto" color="red" variant="light" size={20} onClick={() =>
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
                          <HoverCard.Dropdown w={measuredWidth} pl={0} py={0}>
                            <ScrollArea.Autosize
                              mx="sm"
                              w="100%" mah={485}
                              offsetScrollbars
                              style={{
                                overscrollBehavior: "contain",
                                borderRadius: 'var(--mantine-radius-sm)'
                              }}
                            >
                              <Stack w="100%" mt="xs" gap={0}>
                                {versionGroups.filter(group =>
                                  group.group.some(component =>
                                    component.versions.some(version1 =>
                                      versions.find(version2 =>
                                        version2.label === `${component.key}-${version1}` && version2.checked)))).map((group, index) => {
                                  const detail = details.find(detail => detail.key === group.groupKey);

                                  return (
                                    <>
                                      <Group gap={5}>
                                        <Button
                                          flex={1}
                                          w="100%"
                                          size="sm"
                                          justify="space-between"
                                          variant="subtle"
                                          onClick={() => setOpenedVersionsTopLevel((prev) => prev.map((o, i) => (i === index ? !o : o)))}
                                          leftSection={
                                            <Group>
                                              {openedVersionsTopLevel[index] ? <IconChevronUp/> : <IconChevronDown/>}
                                              <Text c="var(--mantine-color-text)">
                                                {detail.name}
                                              </Text>
                                            </Group>
                                          }
                                        />
                                        <ActionIcon ml="auto" mr={2} color="red" variant="light" size={20} onClick={() =>
                                          group.group.forEach(component =>
                                            component.versions.forEach(version1 =>
                                              versionHandlers.setItemProp(
                                                versions.findIndex(version2 => version2.label === `${component.key}-${version1}`),
                                                'checked',
                                                false)
                                          ))}
                                        >
                                          <IconX/>
                                        </ActionIcon>
                                      </Group>
                                      <Collapse in={openedVersionsTopLevel[index]}>
                                        {group.group.filter(group => group.versions.some(version => versions.find(foundVersion => foundVersion.label === `${group.key}-${version}` && foundVersion.checked))).map(component => {
                                          const componentName = detail.componentKeysAndNamesMap[component.key];

                                          return (
                                            <>
                                              <Group ml={33} gap={5}>
                                                <Button
                                                  flex={1}
                                                  w="100%"
                                                  size="sm"
                                                  justify="space-between"
                                                  variant="subtle"
                                                  onClick={() => setOpenedVersionsSecondLevel((prev) => ({
                                                    ...prev,
                                                    [component.key]: !prev[component.key]
                                                  }))}
                                                  leftSection={
                                                    <Group>
                                                      {openedVersionsSecondLevel[component.key] ? <IconChevronUp/> :
                                                        <IconChevronDown/>}
                                                      <Text c="var(--mantine-color-text)">
                                                        {componentName}
                                                      </Text>
                                                    </Group>
                                                  }
                                                />
                                                <ActionIcon ml="auto" mr={2} color="red" variant="light" size={20}
                                                            onClick={() =>
                                                                component.versions.forEach(version1 =>
                                                                  versionHandlers.setItemProp(
                                                                    versions.findIndex(version2 => version2.label === `${component.key}-${version1}`),
                                                                    'checked',
                                                                    false)
                                                                )}
                                                >
                                                  <IconX/>
                                                </ActionIcon>
                                              </Group>
                                              <Collapse in={openedVersionsSecondLevel[component.key]}>

                                                {component.versions.map(version1 => {
                                                  const versionState = versions.find(version2 => version2.label === `${component.key}-${version1}` && version2.checked)

                                                  return versionState
                                                    ? <Group
                                                      h={36}
                                                      pl="sm"
                                                      ml={66}
                                                    >
                                                      <Group>
                                                        {openedVersionsTopLevel[index] ? <IconChevronUp hidden/> : <IconChevronDown hidden/>}
                                                        <Text c="var(--mantine-color-text)">
                                                          {version1}
                                                        </Text>
                                                      </Group>
                                                      <ActionIcon mr={2} ml="auto" color="red" variant="light" size={20} onClick={() =>
                                                        versionHandlers.setItemProp(
                                                          versions.indexOf(versionState),
                                                          'checked',
                                                          false)}
                                                      >
                                                        <IconX/>
                                                      </ActionIcon>
                                                    </Group>
                                                    : null
                                                })}
                                              </Collapse>
                                            </>
                                          )
                                        })}
                                      </Collapse>
                                    </>)})}
                              </Stack>
                            </ScrollArea.Autosize>
                          </HoverCard.Dropdown>
                        </HoverCard>
                      </Pill>}
                    <ActionIcon ml="auto" style={{visibility: isFiltered ? "visible" : "hidden"}} color="red" onClick={resetFilters}>
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
            width: 180,
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
            width: 300,
            titleStyle: {

              fontSize: "16px",
              backgroundColor: "green",
              color: "white"
            },
            render: (row) => row.appKey.toUpperCase(),
            sortable: true,
            filter: ({close}) => (
              <Stack w={measuredWidth - 50} gap="xs">
                <Text fw={500}>
                  Vyberte aplikace, které chcete zobrazit:
                </Text>

                <ScrollArea.Autosize w={measuredWidth - 50} mah={415} offsetScrollbars overscrollBehavior="contain">
                  <Stack gap={0}>
                    {componentGroups.map((group) => {
                      const [opened, setOpened] = useState(false);

                      return (
                        <>
                          <div style={{display: 'flex', alignItems: 'center'}}>
                            <Checkbox
                              checked={allCheckedApp(group.key)}
                              indeterminate={indeterminateApp(group.key)}
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
                            <Button
                              size="sm"
                              w="100%"
                              ml={5}
                              justify="space-between"
                              variant="subtle"
                              onClick={() => setOpened((o) => !o)}
                              leftSection={
                                <Text c="var(--mantine-color-text)">{details.find((detail) => detail.key === group.key)
                                  ?.componentKeysAndNamesMap[group.key]}
                                </Text>
                              }

                              rightSection={
                                opened ? <IconChevronUp style={{marginLeft: "auto"}}/> : <IconChevronDown style={{marginLeft: "auto"}}/>
                              }
                            />
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
                        </>
                      );
                    })}
                  </Stack>
                </ScrollArea.Autosize>
                <Button
                  mt={5}
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
            width: 400,
            titleStyle: {

              fontSize: "16px",
              backgroundColor: "green",
              color: "white"
            },
          },
          {
            accessor: 'environmentName',
            title: <span style={{userSelect: 'none'}}>Prostředí</span>,
            width: 300,
            titleStyle: {

              fontSize: "16px",
              backgroundColor: "green",
              color: "white"
            },
            sortable: true,
            render: (row) => row.environmentName.toUpperCase(),
            filter: ({close}) => (
              <Stack >
                <Text fw={500}>
                  Vyberte prostředí, která chcete zobrazit:
                </Text>
                <Checkbox.Group
                  value={selectedEnvironments}
                  onChange={setSelectedEnvironments}
                >
                  <Group>
                    <Stack>
                      {environments.map(e =>
                        <Checkbox value={e} label={e.toUpperCase()}/>)}
                    </Stack>
                  </Group>
                </Checkbox.Group>
                <Button
                  mt={5}
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
            width: 250,
            titleStyle: {

              fontSize: "16px",
              backgroundColor: "green",
              color: "white"
            },
            sortable: true,
            filter: ({close}) => (
              <Stack w={measuredWidth - 50} gap="xs">
                <Text fw={500}>
                  Vyberte verze, které chcete zobrazit:
                </Text>

                <ScrollArea.Autosize mah={425} offsetScrollbars overscrollBehavior="contain">
                  <Stack gap={0}>
                    {versionGroups.map((versionGroup) => {
                      const [openedTopLevel, setOpenedTopLevel] = useState(false);

                      return (
                        <>
                          <div style={{display: 'flex', alignItems: 'center'}}>
                            <Checkbox
                              checked={versionGroup.group.every(component => allCheckedVersion(component.key))}
                              indeterminate={versionGroup.group.some(component => !allCheckedVersion(component.key))
                                && versionGroup.group.some(component =>
                                  indeterminateVersion(component.key)
                                  || allCheckedVersion(component.key))}

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
                            <Button
                              size="sm"
                              w="100%"
                              ml={5}
                              justify="space-between"
                              variant="subtle"
                              onClick={() => setOpenedTopLevel((o) => !o)}
                              leftSection={
                                <Text c="var(--mantine-color-text)">{details.find((detail) => detail.key === versionGroup.groupKey)
                                  ?.componentKeysAndNamesMap[versionGroup.groupKey]}
                                </Text>
                              }

                              rightSection={
                                openedTopLevel ? <IconChevronUp style={{marginLeft: "auto"}}/> : <IconChevronDown style={{marginLeft: "auto"}}/>
                              }
                            />
                          </div>
                          <Collapse in={openedTopLevel}>
                            {versionGroup.group.map((component) => {
                              const [openedSecondLevel, setOpenedSecondLevel] = useState(false);

                              return (
                                <div>
                                  <div style={{display: 'flex', alignItems: 'center'}}>
                                    <Checkbox
                                      key={component.key}
                                      ml={33}
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
                                    <Button
                                      size="sm"
                                      w="100%"
                                      ml={5}
                                      justify="space-between"
                                      variant="subtle"
                                      onClick={() => setOpenedSecondLevel((o) => !o)}
                                      leftSection={
                                        <Text c="var(--mantine-color-text)">{details.find((appDetail) => appDetail.key === versionGroup.groupKey)
                                          ?.componentKeysAndNamesMap[component.key]}
                                        </Text>
                                      }

                                      rightSection={
                                        openedSecondLevel ? <IconChevronUp style={{marginLeft: "auto"}}/> : <IconChevronDown style={{marginLeft: "auto"}}/>
                                      }
                                    />
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
                        </>
                      );
                    })}
                  </Stack>
                </ScrollArea.Autosize>
                <Button
                  mt={5}
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
            width: 110,
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
