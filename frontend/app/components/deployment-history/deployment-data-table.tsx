import {DataTable} from "mantine-datatable";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Collapse,
  Group, Menu,
  ScrollArea,
  Stack,
  Text, Textarea, TextInput,
  Tooltip
} from "@mantine/core";
import {DatePicker} from "@mantine/dates";
import {useState} from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconMenu2,
  IconSelector,
  IconTrash,
  IconWind,
  IconZoomScan
} from "@tabler/icons-react";
import IconJira from "~/components/global/icon-jira";
import {CONTEXT_PATH} from "~/constants";
import classes = Menu.classes;

// TODO REFAKTOR

//
// Upravený DataTable (https://icflorescu.github.io/mantine-datatable/) pro záznamy o nasazení
//

export default function DeploymentDataTable({
                                              measuredWidth: measuredWidth,
                                              records: records,
                                              data: {
                                                apps: apps,
                                                componentGroups: componentGroups,
                                                environments: environments,
                                                selectedEnvironments: selectedEnvironments,
                                                versions: versions,
                                                versionGroups: versionGroups,
                                                details: details,
                                                deployedAtSearchRange: deployedAtSearchRange
                                              },
                                              filterHandlers: {
                                                setDeployedAtSearchRange: setDeployedAtSearchRange,
                                                appHandlers: appHandlers,
                                                setSelectedEnvironments: setSelectedEnvironments,
                                                versionHandlers: versionHandlers},
                                              selectedRecords: selectedRecords,
                                              onSelectedRecordsChange: setSelectedRecords,
                                              sortStatus: sortStatus,
                                              onSortStatusChange: setSortStatus,
                                              isEditable: isEditable,
                                              versionEdits: {
                                                editedVersions,
                                                setEditedVersions
                                              },
                                              deleteSingleRecord: {
                                                setModalType: setModalType,
                                                openModal: openModal,
                                                setSingleDelete: setSingleDelete
                                              }
                                            }) {

  //
  // DATA
  //

  // proměnné pro ikonku v checkboxu aplikací
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

  // proměnné pro ikonku checkboxu verzí
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

  // STATE/DATA HANDLING

  // editace verze
  const handleEditChange = (row, field, value) => {
    const key = makeKey(row);

    setEditedVersions((prev) => {
      const previous = prev[key] || {
        newVersionName: row.versionName,
        newVersionDescription: row.versionDescription,
      };

      const updated = { ...previous };

      if (field === "newVersionName") updated.newVersionName = value;
      if (field === "newVersionDescription") updated.newVersionDescription = value;

      return { ...prev, [key]: updated };
    });
  };

  //
  // POMOCNÉ METODY
  //

  // vytvoření klíče editované verze
  const makeKey = (row) => JSON.stringify({
    appKey: row.appKey,
    environmentName: row.environmentName,
    versionName: row.versionName,
  });

  return (<DataTable
    selectionColumnStyle={{ backgroundColor: "black", zIndex: 2 }}
    selectionTrigger="cell"
    selectedRecords={isEditable ? selectedRecords : null}
    onSelectedRecordsChange={isEditable ? setSelectedRecords : null}
    height="calc(100vh - 220px)"
    backgroundColor="dynamicBackground"
    shadow="xs"
    style={{
      borderTopLeftRadius: 'var(--mantine-radius-md)',
      borderTopRightRadius: 'var(--mantine-radius-md)',
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      zIndex: 2
    }}
    styles={{
      header: {
        fontSize: "16px",
        backgroundColor: "green",
        color: "white"
      },
    }}
    withColumnBorders
    records={records}
    columns={[
      {
        accessor: 'deployedAt',
        title: <span style={{userSelect: 'none'}}>Datum</span>,
        width: 160,
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
        width: 200,
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
        width: 300,
      },
      {
        accessor: 'environmentName',
        title: <span style={{userSelect: 'none'}}>Prostředí</span>,
        width: 200,
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
        width: 150,
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
                            const newCheckedState = !versionGroup.group.every(component =>
                              allCheckedVersion(component.key))

                            const labels = versionGroup.group.flatMap(component =>
                              component.versions.map(version =>
                                `${component.key}-${version}`));

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
                            <Text c="var(--mantine-color-text)">
                              {details.find((detail) =>
                                detail.key === versionGroup.groupKey)
                                ?.componentKeysAndNamesMap[versionGroup.groupKey]}
                            </Text>
                          }

                          rightSection={
                            openedTopLevel
                              ? <IconChevronUp style={{marginLeft: "auto"}}/>
                              : <IconChevronDown style={{marginLeft: "auto"}}/>
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
                                        component.versions.includes(
                                          value.label.substring(
                                            component.key.length + 1,
                                            value.label.length
                                          )
                                        )
                                        && value.label.startsWith(component.key)
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
                                    <Text c="var(--mantine-color-text)">
                                      {details.find((appDetail) =>
                                        appDetail.key === versionGroup.groupKey)
                                        ?.componentKeysAndNamesMap[component.key]}
                                    </Text>
                                  }

                                  rightSection={
                                    openedSecondLevel
                                      ? <IconChevronUp style={{marginLeft: "auto"}}/>
                                      : <IconChevronDown style={{marginLeft: "auto"}}/>
                                  }
                                />
                              </div>
                              <Collapse in={openedSecondLevel}>
                                {component.versions.map(version => {
                                    const versionListState = versions.find(versionListState =>
                                      versionListState.label === `${component.key}-${version}`);

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
        render: (row) => {
          const key = makeKey(row);
          const edited = editedVersions[key];

          if (!isEditable) return row.versionName ?? "";

          return (
            <TextInput
              maxLength={255}
              value={edited?.newVersionName ?? row.versionName ?? ""}
              onChange={(e) => handleEditChange(row, "newVersionName", e.currentTarget.value.trim())}
              noWrap
            />
          );
        },
        filtering: versions.some((value) => value.checked)
      },
      {
        accessor: 'versionDescription',
        title: <span style={{userSelect: 'none'}}>Poznámka k verzi</span>,
        width: 400,
        render: (row) => {
          const key = makeKey(row);
          const edited = editedVersions[key];

          if (!isEditable) return row.versionDescription ?? "";

          return (
            <Textarea
              maxLength={1024}
              value={edited?.newVersionDescription ?? row.versionDescription ?? ""}
              onChange={(e) => handleEditChange(row, "newVersionDescription", e.currentTarget.value)}
            />
          );
        },
      },
      {
        accessor: 'actions',
        title: <IconMenu2 style={{justifySelf: "center"}}>Akce</IconMenu2>,
        width: 160,
        render: (row) => (
          <Group m="auto" justify="center">
            {row.jiraUrl ? (
            <Tooltip label="Přejít na Jira ticket">
              <ActionIcon  color="blue" variant="subtle" component="a" href={row.jiraUrl}>
                <IconJira/>
              </ActionIcon>
            </Tooltip>) : null}
            <Tooltip label="Přejít na detail projektu">
              <ActionIcon
                color="green"
                variant="subtle"
                component="a"
                href={
                  `${CONTEXT_PATH}/projects/detail/` +
                  `${componentGroups.find(group => group.components.includes(row.appKey)).key}` +
                  `?from=history&appKey=${row.appKey}&versionName=${row.versionName}`}
              >
                <IconZoomScan/>
              </ActionIcon>
            </Tooltip>
            {isEditable ? (
              <Tooltip label="Smazat záznam">
                <ActionIcon color="red" variant="subtle" component="a" href={row.jiraUrl}>
                  <IconTrash onClick={() => {setSingleDelete(makeKey(row)); setModalType('delete-one'); openModal();}}/>
                </ActionIcon>
              </Tooltip>) : null}
          </Group>
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
  />);
}
