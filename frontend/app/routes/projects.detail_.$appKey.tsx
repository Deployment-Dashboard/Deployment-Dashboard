import { LoaderFunctionArgs } from "react-router";
import ContentContainer from "~/components/content-container";
import {Button, Group, Paper, Table, TagsInput, TextInput, Title} from "@mantine/core";
import {IconArrowBackUp, IconExternalLink, IconPencil, IconRocket} from "@tabler/icons-react";
import { Link } from "react-router";
import {useLoaderData} from "react-router";
import {API_URL} from "~/constants"
import {useDisclosure} from "@mantine/hooks";

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

    return latestVersions;
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
      row.scrollIntoView({block:"center", behavior: "smooth" });
      row.style.backgroundColor = "#cdffcd";
      row.style.transition = "background-color 0.2s ease-in-out";

      setTimeout(() => {
        row.style.backgroundColor = "white";
      }, 2000);
    }
  };


  const latestVersions = getLatestVersionForComponentsAndEnvs(appDetail);
  const transformedData = transformData(appDetail);
  const [editable, handlers] = useDisclosure(false);

  const handleSubmit = async (formValues) => {};

  return (
    <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
      <Group style={{alignSelf: "flex-end"}}>
        { editable ? (
          <>
            <Button
              size="md"
              onClick={handleSubmit}
            >
              Potvrdit změny
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handlers.close}
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
        <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
          <Group className="rounded-md p-8 bg-white" style={{display: "flex", flexDirection: "column", alignItems:"flex-start"}}>
            <Title style={{color: "green"}}>Detail projektu</Title>
            <Group>
              <TextInput
                label="Klíč"
                id={"projectKey"}
                variant="unstyled"
                readOnly={true}
                value={appDetail.key}
                style={{
                  minWidth: '300px',
                  pointerEvents: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  borderColor: 'transparent',
                }}
                tabIndex={-1}
              />
              <TextInput
                label="Název"
                id={"projectName"}
                variant="unstyled"
                readOnly={true}
                value={appDetail.name}
                style={{
                  minWidth: '300px',
                  pointerEvents: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  borderColor: 'transparent',
                }}
                tabIndex={-1}
              />
              <TagsInput variant="unstyled" label="Prostředí" readOnly defaultValue={appDetail.environmentNames}/>
            </Group>
            <Title mb="md" order={2}>Aktuální verze</Title>
            <Paper withBorder style={{ borderColor: "green" }}>
              <Table
                withColumnBorders
                style={{width: 'fit-content'}}
              >
                <Table.Thead style={{backgroundColor: "green", color: "white"}}>
                  <Table.Tr>
                    <Table.Th
                      rowSpan={2}
                      style={{
                        verticalAlign: 'middle',
                        textAlign: 'center'
                      }}
                    />
                    <Table.Th
                      colSpan={appDetail.environmentNames.length}
                      style={{textAlign: 'center'}}
                    >
                      Prostředí
                    </Table.Th>
                  </Table.Tr>
                  <Table.Tr>
                    {appDetail.environmentNames.map((env) => (
                      <Table.Th
                        key={env}
                        style={{textAlign: 'center'}}
                      >
                        {env.toUpperCase()}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {Object.entries(latestVersions).map(([appKey, envs]) => (
                    <Table.Tr key={appKey}>
                      <Table.Td style={{fontWeight: "bold"}}>{appKey}</Table.Td>
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
          </Group>
          <Group className="rounded-md p-8 bg-white gap-1" style={{display: "flex", flexDirection:"column", alignItems:"flex-start"}}>
            <Title style={{color: "green"}} order={2}>Verze komponent</Title>
            {Object.keys(appDetail.appKeyToVersionDtosMap).map((key) => (
              <>
                <Title key={`title-${key}`} order={3}>
                  {appDetail.componentKeysAndNamesMap[key]} ({key.toUpperCase()})
                </Title>
                {transformedData[key] && transformedData[key].length > 0 ? (
                  <Paper key={`paper-${key}`} withBorder style={{ borderColor: "green" }}>
                    <Table
                      key={`table-${key}`}
                      withColumnBorders
                      style={{width: 'fit-content'}}
                    >
                      <Table.Thead style={{backgroundColor: "green", color: "white"}}>
                        <Table.Tr>
                          <Table.Th
                            rowSpan={3}
                            style={{
                              verticalAlign: 'middle',
                              textAlign: 'center'
                            }}
                          >
                            Verze
                          </Table.Th>
                          <Table.Th
                            colSpan={appDetail.environmentNames.length * 2}
                            style={{textAlign: 'center'}}
                          >
                            Prostředí
                          </Table.Th>
                          <Table.Th
                            rowSpan={3}
                            style={{
                              verticalAlign: 'middle',
                              textAlign: 'center',
                              borderLeft: '1px solid #ddd',
                            }}
                          >
                            Poznámka
                          </Table.Th>
                        </Table.Tr>
                        <Table.Tr>
                          {appDetail.environmentNames.map((name) => (
                            <>
                              <Table.Th
                                key={name}
                                colSpan={2}
                                style={{
                                  verticalAlign: 'middle',
                                  textAlign: 'center'
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
                              <Table.Th key={`date-header-cell-${name}`}>Datum nasazení</Table.Th>
                              <Table.Th key={`ticket-header-cell${name}`}>Jira ticket</Table.Th>
                            </>
                          ))}
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {transformedData[key].map((rowData) => (
                          <Table.Tr key={`row-${key}-${rowData.versionName}`} id={`row-${key}-${rowData.versionName}`}>
                            <Table.Td style={{fontWeight: "bold", textAlign: "right"}}>{rowData.versionName}</Table.Td>
                            {appDetail.environmentNames.map((name) => (
                              <>
                                <Table.Td key={`date-value-cell-${name}`} style={{textAlign: 'center'}}>{rowData[name].date ? new Date(rowData[name].date).toLocaleDateString("cs-CZ") : "-"}</Table.Td>
                                <Table.Td key={`ticket-value-cell-${name}`} style={{textAlign: 'center'}}>{rowData[name].jiraUrl
                                  ? <Link to={rowData[name].jiraUrl} style={{color: "green", display: "inline-flex"}}><IconExternalLink/></Link>
                                  : "-"}</Table.Td>
                              </>
                            ))}
                            <Table.Td>{rowData.description}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                ) : (
                  <p>Žádná data k zobrazení</p>
                )}
              </>
            ))}
          </Group>
          <Group className="rounded-md p-8 bg-white gap-1" style={{display: "flex", flexDirection:"column", alignItems:"flex-start"}}>
            <Title style={{color: "green"}} order={2}>Historie nasazení</Title>
          </Group>
        </div>
      </ContentContainer>
    </div>
  );
}
