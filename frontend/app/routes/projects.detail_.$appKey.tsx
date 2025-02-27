import {Link, LoaderFunctionArgs, useLoaderData} from "react-router";
import ContentContainer from "~/components/content-container";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Collapse,
  Group,
  Paper,
  Stack,
  Table,
  TagsInput,
  TextInput,
  Text,
  Title, Loader
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconExternalLink,
  IconPencil,
  IconRocket,
  IconX
} from "@tabler/icons-react";
import {API_URL} from "~/constants"
import {useDisclosure} from "@mantine/hooks";
import {useEffect, useRef, useState} from "react";

// TODO datove typy a upravit parsovani, je to hnus
export async function loader({
                               params,
                             }: LoaderFunctionArgs) {
  console.log(`fetching data for: ${params.appKey}`);
  const response = await fetch(`${API_URL}/apps/${params.appKey}`);
  const appDetail = await response.json();

  return (appDetail);
}

export default function ProjectDetail() {
  const appDetail = useLoaderData();
  appDetail.environmentNames.sort();

  const getLatestVersionForComponentsAndEnvs = (data) => {
    const latestVersions = {};

    Object.keys(appDetail.appKeyToVersionDtosMap).forEach((key) => {
      latestVersions[key] = {};

      appDetail.environmentNames.forEach((name) => {
        for (let i = 0; i < Object.keys(appDetail.appKeyToVersionDtosMap[key]).length; i++) {
          if (appDetail.appKeyToVersionDtosMap[key][i].environmentToDateAndJiraUrlMap[name]) {
            latestVersions[key][name] = appDetail.appKeyToVersionDtosMap[key][i].name;
            break;
          }
        }
        if (!latestVersions[key][name]) {
          latestVersions[key][name] = "-"; // Default value for missing versions
        }
      });
    });

    return Object.fromEntries(
      Object.entries(latestVersions).sort(([keyA]: [string, any], [keyB]: [string, any]) => keyA.localeCompare(keyB))
    );
  };

  const transformData = (data) => {
    const transformedData = {};

    Object.keys(appDetail.appKeyToVersionDtosMap).forEach((appKey) => {
      transformedData[appKey] = appDetail.appKeyToVersionDtosMap[appKey].map((version) => {
        const versionData = {
          versionName: version.name,
          description: version.versionDescription,
        };

        appDetail.environmentNames.forEach((env) => {
          const deploymentData = version.environmentToDateAndJiraUrlMap[env] || {};
          versionData[env] = {
            date: deploymentData.first || '', // Date or empty if not deployed
            jiraUrl: deploymentData.second || '', // Jira URL or empty
          };
        });

        return versionData;
      });
    });

    return transformedData;
  };


  const handleCellClick = (appKey, versionName) => {
    const row = document.getElementById(`row-${appKey}-${versionName}`);

    if (row) {
      if (!openStates[appKey]) {
        toggleCollapse(appKey);
      }

      setTimeout(() => row.scrollIntoView({ block: "center", behavior: "smooth" }), 300)

      setTimeout(() => {
        row.style.boxShadow = "inset 0 0 3px 3px green";
        row.style.transition = "box-shadow 0.2s ease-in-out";
      }, 1300);

      setTimeout(() => {
        row.style.transition = "box-shadow 0.2s ease-in-out";
        row.style.boxShadow = "";
      }, 2800);
    }
  };

  const [overflowMap, setOverflowMap] = useState<Record<string, boolean>>({});

  const paperRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const checkOverflow = () => {
      const newOverflowMap: Record<string, boolean> = {};
      Object.entries(paperRefs.current).forEach(([key, ref]) => {
        if (ref) {
          newOverflowMap[key] = ref.scrollHeight > ref.clientHeight;
        }
      });
      setOverflowMap(newOverflowMap);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, []);

  const latestVersions = getLatestVersionForComponentsAndEnvs(appDetail);
  const transformedData = transformData(appDetail);
  const [editMode, handlers] = useDisclosure(false);

  const initialStates = Object.keys(appDetail.appKeyToVersionDtosMap)
    .filter(key => transformedData[key] && transformedData[key].length > 0)
    .reduce((acc, key) => {
      acc[key] = false; // Set initial state to false for each key
      return acc;
    }, {});

  const [openStates, setOpenStates] = useState<Record<string, boolean>>(initialStates);

  const toggleCollapse = (key: string) => {
    setOpenStates((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (formValues) => {};

  const [isHydrated, setIsHydrated] = useState(false);

  return (
    <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
      <Group mr="2px" style={{alignSelf: "flex-end"}}>
        { editMode ? (
          <>
            <Button
              size="md"
              onClick={handleSubmit}
              rightSection={<IconCheck size={16}/>}
            >
              Potvrdit
            </Button>
            <Button
              color="red"
              size="md"
              onClick={handlers.close}
              rightSection={<IconX size={16}/>}
            >
              Zrušit změny
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="md"
              leftSection={<IconArrowBackUp size={16}/>}
              component={Link}
              to="/projects"
            >
              Zpět na přehled
            </Button>
            <Button
              size="md"
              rightSection={<IconPencil size={16}/>}
              onClick={handlers.open}
              disabled
            >
              Upravit
            </Button>
            <Button
              size="md"
              rightSection={<IconRocket size={16}/>}
              disabled
            >
              Nasadit
            </Button>
          </>
        )}

      </Group>
      <ContentContainer>
        <Stack>
          <Card
            withBorder
            shadow="sm"
            radius="md"
            pb="48px"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems:"flex-start"
            }}
          >
            <Title
              style={{color: "green"}}
            >
              Detail projektu {appDetail.name}
            </Title>
            <Group justify="space-between" ml="xl" pr="xl" mt="xl" w="100%" h="100%">
              <Stack h="100%" justify="center" gap="xl">
                <TextInput
                  size="xl"
                  label={<Title order={2}>Klíč</Title>}
                  id={"projectKey"}
                  variant="unstyled"
                  value={appDetail.key.toUpperCase()}
                  style={{
                    pointerEvents: 'none',
                  }}
                  tabIndex={-1}
                />
                <TextInput
                  size="xl"
                  label={<Title order={2}>Název</Title>}
                  id={"projectName"}
                  variant="unstyled"
                  value={appDetail.name}
                  style={{
                    pointerEvents: 'none',
                  }}
                  tabIndex={-1}
                />
                <Stack>
                  <Title order={2}>Prostředí</Title>
                  <Group>
                    {appDetail.environmentNames.map((name) => <Badge size="lg">{name}</Badge>)}
                  </Group>
                </Stack>
              </Stack>
              <Stack gap="0" mr="xl" w="50%">
                <Title mb="md" order={2}>Aktuální verze</Title>
                <Paper
                  ref={(el) => {paperRefs.current["latestVersionPaper"] = el as HTMLDivElement;}}
                  radius="md"
                  style={{
                    border: "2px solid green",
                    borderRadius: overflowMap["latestVersionPaper"]
                      ? "var(--mantine-radius-md) 0 0 var(--mantine-radius-md)"
                      : "var(--mantine-radius-md)",
                    maxHeight: "408px",
                    overflowY: "auto",
                    backgroundColor: "light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-9))"
                  }}
                >
                  <Table
                    stickyHeader
                    withColumnBorders
                    style={{borderRight: overflowMap["latestVersionPaper"] ? "2px solid green" : "" }}
                  >
                    <Table.Thead style={{backgroundColor: "green", color: "white"}}>
                      <Table.Tr>
                        <Table.Th
                          className="table-header-border-fix"
                          rowSpan={2}
                          style={{
                            verticalAlign: 'middle',
                            textAlign: 'center',
                          }}
                        />
                        <Table.Th
                          className="table-header-border-fix"
                          colSpan={appDetail.environmentNames.length}
                          style={{textAlign: 'center', borderRight: "1px solid green"}}
                        >
                          Prostředí
                        </Table.Th>
                      </Table.Tr>
                      <Table.Tr>
                        {appDetail.environmentNames.map((env) => (
                          <Table.Th
                            className="table-header-border-fix"
                            key={env}
                            style={{textAlign: 'center', borderRight: "1px solid green"}}
                          >
                            {env.toUpperCase()}
                          </Table.Th>
                        ))}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {Object.entries(latestVersions).map(([appKey, envs]) => (
                        <Table.Tr key={appKey}>
                          <Table.Td style={{fontWeight: "bold", width: "fit-content"}}>{appDetail.componentKeysAndNamesMap[appKey]}</Table.Td>
                          {appDetail.environmentNames.map((env) => (
                            <Table.Td
                              key={env}
                              style={{textAlign: 'center'}}
                            >
                              {envs[env] !== "-" ? (
                                <span
                                  style={{ cursor: "pointer", color: "green", textDecoration: "underline" }}
                                  onClick={() => handleCellClick(appKey, envs[env])}
                                >
                            {envs[env]}
                          </span>
                              ) : (
                                "-"
                              )}
                            </Table.Td>
                          ))}
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Paper>
              </Stack>
            </Group>
          </Card>
          <Card withBorder shadow="sm" radius="md" pb="48px"
                style={{display: "flex", flexDirection: "column", alignItems: "flex-start"}}>
            <Group w="100%" justify="space-between">
              <Title
                style={{color: "green"}}
                order={2}
              >
                Verze komponent
              </Title>
              <Text
                mr="xl"
                style={{justifySelf: "center", textDecoration: "underline", color: "green", cursor: "pointer"}}
                onClick={() => {
                  setOpenStates(prevStates => {
                    return Object.keys(prevStates).reduce((acc, key) => {
                      acc[key] = !Object.values(prevStates).includes(true);  // Toggle based on whether any value is true
                      return acc;
                    }, {});
                  });
                }}
              >
                {Object.values(openStates).includes(true)
                  ? "sbalit vše"
                  : "rozbalit vše"
                }
              </Text>
            </Group>
            <Stack justify="space-between" w="100%">
              {Object.keys(appDetail.appKeyToVersionDtosMap)
                .sort((keyA, keyB) => keyA.localeCompare(keyB))
                .filter(key => transformedData[key] && transformedData[key].length > 0)
                .map((key) => (
                    <Stack mt="xl" ml="xl" mr="xl">
                      <Group>
                        <Title key={`title-${key}`} order={3}>
                          {appDetail.componentKeysAndNamesMap[key]}
                        </Title>
                        <Badge size="lg" variant="outline">{key}</Badge>
                        <ActionIcon
                          variant="subtle"
                          ml="auto"
                          onClick={() => toggleCollapse(key)}
                        >
                          {openStates[key] ? <IconChevronUp/> : <IconChevronDown/>}
                        </ActionIcon>
                      </Group>
                      <Collapse in={openStates[key]}>
                      <Paper
                        ref={(el) => {
                          paperRefs.current[key] = el as HTMLDivElement;
                        }}
                        key={`paper-${key}`}
                        withBorder
                        style={{
                          borderColor: "green", overflowX: "hidden", maxHeight: "490px",
                          border: "2px solid green",
                          borderRadius: overflowMap[key]
                            ? "var(--mantine-radius-md) 0 0 var(--mantine-radius-md)"
                            : "var(--mantine-radius-md)",
                          backgroundColor: "light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-9))"
                        }}
                        ml="xl"
                      >
                        <Table
                          key={`table-${key}`}
                          withColumnBorders
                        >
                          <Table.Thead style={{backgroundColor: "green", color: "white"}}>
                            <Table.Tr>
                              <Table.Th
                                className="table-header-border-fix"
                                rowSpan={3}
                                style={{
                                  verticalAlign: 'middle',
                                  textAlign: 'center'
                                }}
                              >
                                Verze
                              </Table.Th>
                              <Table.Th
                                className="table-header-border-fix"
                                colSpan={appDetail.environmentNames.length * 2}
                                style={{textAlign: 'center'}}
                              >
                                Prostředí
                              </Table.Th>
                              <Table.Th
                                className="table-header-border-fix"
                                rowSpan={3}
                                style={{
                                  verticalAlign: 'middle',
                                  textAlign: 'center',
                                }}
                              >
                                Poznámka
                              </Table.Th>
                            </Table.Tr>
                            <Table.Tr>
                              {appDetail.environmentNames.map((name) => (
                                <>
                                  <Table.Th
                                    className="table-header-border-fix"
                                    key={name}
                                    colSpan={2}
                                    style={{
                                      verticalAlign: 'middle',
                                      textAlign: 'center',
                                    }}
                                  >
                                    {name.toUpperCase()}
                                  </Table.Th>
                                </>
                              ))}
                            </Table.Tr>
                            <Table.Tr>
                              {appDetail.environmentNames.map((name) => (
                                <>
                                  <Table.Th
                                    className="table-header-border-fix"
                                    key={`date-header-cell-${name}`}
                                    style={{
                                      verticalAlign: 'middle',
                                      textAlign: 'center',
                                    }}
                                  >
                                    Datum nasazení
                                  </Table.Th>
                                  <Table.Th
                                    className="table-header-border-fix"
                                    key={`ticket-header-cell${name}`}
                                    style={{
                                      verticalAlign: 'middle',
                                      textAlign: 'center',
                                    }}
                                  >
                                    Jira ticket
                                  </Table.Th>
                                </>
                              ))}
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {transformedData[key].map((rowData) => (
                              <Table.Tr key={`row-${key}-${rowData.versionName}`}
                                        id={`row-${key}-${rowData.versionName}`}>
                                <Table.Td
                                  id={`name-value-cell-${rowData.versionName}`}
                                  style= {{fontWeight: "bold", textAlign: "right"}}>{rowData.versionName}</Table.Td>
                                {appDetail.environmentNames.map((name) => (
                                  <>
                                    <Table.Td key={`date-value-cell-${name}`}
                                              style={{textAlign: 'center'}}>{rowData[name].date ? new Date(rowData[name].date).toLocaleDateString("cs-CZ") : "-"}</Table.Td>
                                    <Table.Td key={`ticket-value-cell-${name}`}
                                              style={{textAlign: 'center'}}>{rowData[name].jiraUrl
                                      ? <ActionIcon component="a" href={rowData[name].jiraUrl}
                                                    variant="subtle"><IconExternalLink/></ActionIcon>
                                      : "-"}</Table.Td>
                                  </>
                                ))}
                                <Table.Td>{rowData.description}</Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </Paper>
                      </Collapse>
                    </Stack>
                ))}
            </Stack>
          </Card>
        </Stack>
      </ContentContainer>
    </div>
  );
}
