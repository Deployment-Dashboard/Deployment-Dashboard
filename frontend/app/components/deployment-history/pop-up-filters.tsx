import {
  ActionIcon,
  Badge,
  Button,
  Collapse,
  Group, HoverCard,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Transition
} from "@mantine/core";
import {IconChevronDown, IconChevronUp, IconX} from "@tabler/icons-react";
import PopUpFiltersPill from "~/components/deployment-history/pop-up-filters-pill";
import {useState} from "react";

//
// "Vyskakující" řádek s filtry na stránce historie nasazení
//

export default function PopUpFilters({
                                       measuredWidth: measuredWidth,
                                       isFiltered: isFiltered,
                                       filters: filters,
                                       filterHandlers: {
                                         setDeployedAtSearchRange: setDeployedAtSearchRange,
                                         appHandlers: appHandlers,
                                         setSelectedEnvironments: setSelectedEnvironments,
                                         versionHandlers: versionHandlers},
                                       data: {
                                         componentGroups: componentGroups,
                                         versionGroups: versionGroups,
                                         selectedEnvironments: selectedEnvironments,
                                         apps: apps,
                                         versions: versions,
                                         details: details
                                       }}) {

  //
  // DATA
  //

  // rozbalené projekty
  const [openedApps, setOpenedApps] = useState<boolean[]>(() =>
    componentGroups.map(() => false)
  );

  // rozbalené verze 1. úrovně
  const [openedVersionsTopLevel, setOpenedVersionsTopLevel] = useState<boolean[]>(() =>
    componentGroups.map(() => false)
  );

  // rozbalené verze 2. úrovně
  const [openedVersionsSecondLevel, setOpenedVersionsSecondLevel] = useState<Record<string, boolean>>(() =>
    versionGroups.flatMap(({ group }) => group.map(({ key }) => ({ key, value: false })))
  );

  //
  // POMOCNÉ METODY
  //

  // zrušení všech filtrů
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

  return (
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
                    <PopUpFiltersPill
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
                    </PopUpFiltersPill>}
                  {filters["appsFilter"] &&
                    <PopUpFiltersPill
                      onRemove={() => appHandlers.setState((current) =>
                        current.map((value) =>
                          ({...value, checked: false})))}
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
                                            <Text c="var(--mantine-color-text)" style={{userSelect: "text"}}>
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
                                              <IconX/>
                                            </ActionIcon>
                                          </Group>
                                          : null
                                      })}
                                    </Collapse>
                                  </>
                                )
                              }))}
                            </Stack>
                          </ScrollArea.Autosize>
                        </HoverCard.Dropdown>
                      </HoverCard>
                    </PopUpFiltersPill>}
                  {filters["envsFilter"] &&
                    <PopUpFiltersPill onRemove={() => setSelectedEnvironments([])}>
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
                    </PopUpFiltersPill>}
                  {filters["versionsFilter"] &&
                    <PopUpFiltersPill
                          onRemove={() => versionHandlers.setState((current) =>
                            current.map((value) =>
                              ({...value, checked: false})))}
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
                                                      {openedVersionsTopLevel[index] ? <IconChevronUp hidden/> :
                                                        <IconChevronDown hidden/>}
                                                      <Text c="var(--mantine-color-text)">
                                                        {version1}
                                                      </Text>
                                                    </Group>
                                                    <ActionIcon mr={2} ml="auto" color="red" variant="light" size={20}
                                                                onClick={() =>
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
                                  </>)
                              })}
                            </Stack>
                          </ScrollArea.Autosize>
                        </HoverCard.Dropdown>
                      </HoverCard>
                    </PopUpFiltersPill>}
                  <ActionIcon ml="auto" style={{visibility: isFiltered ? "visible" : "hidden"}} color="red"
                              onClick={resetFilters}>
                    <IconX/>
                  </ActionIcon>
                </Group>
              </Stack> : null}
          </Paper>
        )}
      </Transition>
    </div>);
}
