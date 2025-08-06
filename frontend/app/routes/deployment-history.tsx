import {LoaderFunction, useLoaderData, useRevalidator} from "react-router";
import ContentContainer from "~/components/global/content-container";

import {
  ActionIcon,
  Button, Group,
  Loader, Modal, Stack, Text, Title, Tooltip,
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconCheck,
  IconPencil, IconTrash, IconX,
} from "@tabler/icons-react";
import {DataTableSortStatus} from 'mantine-datatable';
import {BROWSER_API_URL, DOCKER_API_URL} from "~/constants"
import {useEffect, useMemo, useRef, useState} from "react";
import sortBy from 'lodash/sortBy';
import {DatesRangeValue} from "@mantine/dates";
import dayjs from "dayjs";
import 'dayjs/locale/cs';
import {randomId, useDisclosure, useListState} from "@mantine/hooks";
import PopUpFilters from "~/components/deployment-history/pop-up-filters";
import PopUpFiltersMeasurer from "~/components/deployment-history/pop-up-filters-measurer";
import DeploymentDataTable from "~/components/deployment-history/deployment-data-table";
import {NotificationData, notifications} from "@mantine/notifications";
import {ErrorBody} from "~/types";


//
// Stránka histore nasazení
//

export let loader: LoaderFunction = async () => {
  const [response1, response2] = await Promise.all([
    fetch(`${DOCKER_API_URL}/deployments`),
    fetch(`${DOCKER_API_URL}/apps`)
  ]);

  const data1 = await response1.json();
  const data2 = await response2.json();

  return { deployments: data1, detailsOfAllApps: data2 }
}

export default function DeploymentHistory() {

  const revalidator = useRevalidator();
  //
  // DATA
  //

  // načtení dat ze serverového loaderu
  const data = useLoaderData();

  const deployments = data.deployments
  const details = data.detailsOfAllApps;

  // třídění pro DataTable
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'deployedAt',
    direction: 'desc',
  });

  // záznamy pro DataTable
  const [records, setRecords] = useState(sortBy(deployments, 'deployedAt'));

  // vybrané záznamy v DataTable
  const [selectedRecords, setSelectedRecords] = useState([]);

  // prostředí
  const environments = useMemo(() => {
    const environments = new Set(deployments.map((d) => d.environmentName));
    return [...environments];
  }, []);

  environments.sort()

  // vybraná prostředí pro filtr
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);

  // rozsah dat pro filtr
  const [deployedAtSearchRange, setDeployedAtSearchRange] = useState<DatesRangeValue>();

  // skupiny projekt-komponenty pro srolovatelné části
  const componentGroups = details.flatMap((detail) =>
    ({
      key: detail?.key,
      components: Object.keys(detail.componentKeysAndNamesMap)
        .sort((a, b) =>
          a.localeCompare(b)).map((key) => key)
    })
  ).sort((a, b) => a?.key.localeCompare(b?.key));

  // přidání checked a key k aplikacím pro DataTable
  const initializeAppValues = (data) => {
    return details.flatMap((data) =>
      Object.keys(data.componentKeysAndNamesMap)
        .map((key) => ({
          label: `${key}`,
          checked: false,
          key: randomId()
        }))
    ).sort((a, b) => a.label.localeCompare(b.label));
  }

  // aplikace
  const [apps, appHandlers] = useListState(initializeAppValues(details));

  // skupiny aplikace-verze pro srolovatelné části
  const versionGroups = details.flatMap((detail) => {
    let groups = [];

    const group = Object.keys(detail.appKeyToVersionDtosMap)
      .sort((a, b) =>
        a.localeCompare(b)).flatMap(key => {
      const versions = detail.appKeyToVersionDtosMap[key]
        .filter(versionDto =>
          Object.keys(versionDto.environmentToDateAndJiraUrlMap).length > 0
        )
        .map(version => version.name);

      return versions.length > 0 ? [{key, versions}] : [];
    })

    if (group.length > 0) {
      groups = [...groups, {groupKey: detail?.key, group: group}]
    }
    return groups;
  }).sort((a, b) => a.groupKey.localeCompare(b.groupKey));

  // přidání checked a key k verzím pro DataTable
  const initializeVersionValues = (data) => {
    return details.map(
      (data) => data.appKeyToVersionDtosMap).flatMap(
      (versionMap) => Object.keys(versionMap).flatMap(
        (appKey) => versionMap[appKey].filter(
          (versionDto) => (
            Object.keys(versionDto.environmentToDateAndJiraUrlMap).length > 0)).map(version => ({
          label: `${appKey}-${version.name}`,
          checked: false,
          key: randomId()
        })))
    );
  }

  // verze
  const [versions, versionHandlers] = useListState(initializeVersionValues(details));

  // je aktivní nějaký filtr?
  const [isFiltered, setIsFiltered] = useState(false);

  // aktivní filtry
  const [filters, setFilters] = useState({});

  // jsme v režimu editace?
  const [isEditable, setIsEditable] = useState(false);

  // kontrola hydratace
  const [isHydrated, setIsHydrated] = useState(false);

  // pomocné proměnné pro změření velikosti Popoveru pro filtry
  const [measuredWidth, setMeasuredWidth] = useState<number>();
  const measureRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(false);

  // mažeme/potvrzujeme/rušíme?
  const [modalType, setModalType] = useState('confirm');

  // state modalu
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)

  // změněné verze
  const [editedVersions, setEditedVersions] = useState({});

  // jedna verze ke smazání
  const [singleDelete, setSingleDelete] = useState("");

  //
  // DATA/STATE HANDLING & SUBMIT
  //

  // odeslání požadavků na úpravu verzí
  const handleSubmitVersions = async () => {
    const putOptions = {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: '',
    }

    let response;

    for (const editedVersionKey of Object.keys(editedVersions)) {
      const {appKey, _, versionName} = JSON.parse(editedVersionKey);
      const editedVersion = editedVersions[editedVersionKey];

      putOptions.body = JSON.stringify({name: editedVersion.newVersionName ?? versionName, description: editedVersion.newVersionDescription});

      try {
        response = await fetch(`${BROWSER_API_URL}/apps/${appKey}/versions/${versionName}`, putOptions);
      } catch (error) {
        notifications.show({
          color: "red",
          title: "Při ukládání změn došlo k chybě.",
          message: "Nastala neočekávaná chyba.",
          position: "top-center",
        } as NotificationData)
      }
    }
    if (response?.ok) {
      notifications.show({
        color: "green",
        title: "Změny byly úspěšně uloženy!",
        position: "top-center",
      } as NotificationData)
    }
    setIsEditable(false);
    await revalidator.revalidate();
  }

  // mazání verzí
  const handleDeleteVersions = async () => {
    const deleteOptions = {
      method: 'DELETE',
    };

    let response;

    if (modalType === 'delete-one') {
      const {appKey, environmentName, versionName} = JSON.parse(singleDelete);

      try {
        response = await fetch(`${BROWSER_API_URL}/apps/${appKey}/envs/${environmentName}/versions/${versionName}/deployment`, deleteOptions);
        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: `Nepodařilo se smazat nasazení ${appKey}:${environmentName}:v${versionName}.`,
            message: error.details,
            position: "top-center",
          } as NotificationData)
        } else {
          const deletedKey = singleDelete;
          setEditedVersions(prev => {
            const next = { ...prev };
            delete next[deletedKey];
            return next;
          });

          notifications.show({
            color: "green",
            title: "Smazání nasazení proběhlo úspěšně!",
            position: "top-center",
          } as NotificationData)
        }
      } catch (error) {
        notifications.show({
          color: "red",
          title: "Při mazání nasazení došlo k chybě.",
          message: "Nastala neočekávaná chyba.",
          position: "top-center",
        } as NotificationData)
      }
    } else if (modalType === 'delete-many') {
      for (const record of selectedRecords) {
        try {
          response = await fetch(`${BROWSER_API_URL}/apps/${record.appKey}/envs/${record.environmentName}/versions/${record.versionName}/deployment`, deleteOptions);
          if (!response.ok) {
            const error: ErrorBody = await response.json();
            notifications.show({
              color: "red",
              title: `Nepodařilo se smazat nasazení ${record.appKey}:${record.environmentName}:v${record.versionName} zaevidovaného ${record.deployedAt}.`,
              message: error.details,
              position: "top-center",
            } as NotificationData)
            break;
          } else {
            const deletedKey = JSON.stringify({
              appKey: record.appKey,
              environmentName: record.environmentName,
              versionName: record.versionName
            });
            setEditedVersions(prev => {
              const next = { ...prev };
              delete next[deletedKey];
              return next;
            });
          }
        } catch (error) {
          notifications.show({
            color: "red",
            title: "Při mazání nasazení došlo k chybě.",
            message: "Nastala neočekávaná chyba.",
            position: "top-center",
          } as NotificationData)
        }
      }
      notifications.show({
        color: "green",
        title: "Smazání nasazení proběhlo úspěšně!",
        position: "top-center",
      } as NotificationData)
    }
    setSelectedRecords([]);
    setSingleDelete("")
    await revalidator.revalidate();
  }

  const resetVersionChanges = () => {
    setEditedVersions({});
    setSelectedRecords([]);
    setSingleDelete("");
  }

  //
  // POMOCNÉ METODY
  //

  // obsah potvrzovacího modalu
  const getModalTitle = () => {
    switch (modalType) {
      case 'cancel':
        return "Opravdu chcete zrušit provedené změny?";
      case 'confirm':
        return "Chystáte se provést změny.";
      case 'delete-one':
        return "Opravdu chcete smazat vybranou položku?";
      case 'delete-many':
        return "Opravdu chcete smazat vybrané položky?";
      default:
        return "";
    }
  };

  //
  // USE EFFECTS
  //

  // při změně details nastav versions a apps
  useEffect(() => {
    versionHandlers.setState(initializeVersionValues(details))
    appHandlers.setState(initializeAppValues(details))
  }, [details])

  // při změně deployments nastav records a setřiď podle data nasazení
  useEffect(() => {
    setRecords(sortBy(deployments, 'deployedAt'));
  }, [deployments]);

  // kontrola hydratace
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // filtování záznamů
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

        if (apps.some(a => a?.checked) && !apps.find(a => a.label === appKey)?.checked) return false;

        if (versions.some(v => v?.checked) && !versions.find((v) => v.label === `${appKey}-${versionName}`)?.checked) return false;

        return true;
      }
    ), sortStatus.columnAccessor);
    setRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
  }, [deployments, deployedAtSearchRange, selectedEnvironments, apps, versions]);

  // nastavení proměnné filtrů
  useEffect(() => {
    const newFilters = {};

    if (deployedAtSearchRange && deployedAtSearchRange[0] instanceof Date && deployedAtSearchRange[1] instanceof Date) {
      newFilters["dateFilter"] = { start: deployedAtSearchRange[0], end: deployedAtSearchRange[1] }
    }
    if (apps.some(a => a?.checked)) {
      newFilters["appsFilter"] = { apps: apps.filter(app => app?.checked) }
    }
    if (selectedEnvironments.length > 0) {
      newFilters["envsFilter"] = { envs: selectedEnvironments }
    }
    if (versions.some(v => v?.checked)) {
      newFilters["versionsFilter"] = { versions: versions.filter(version => version?.checked) }
    }

    setFilters(newFilters);
    setIsFiltered(Object.keys(newFilters).length > 0);
  }, [deployedAtSearchRange, selectedEnvironments, apps, versions]);

  // prvotní seřazení záznamů
  useEffect(() => {
    const data = sortBy(records, sortStatus.columnAccessor);

    setRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
  }, [sortStatus]);

  // kontrola hydratace
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // změření Popoveru
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
    <>
      <Modal
        title={
          <Title order={3}>
            {getModalTitle()}
          </Title>
        }
        opened={modalOpened}
        zIndex={999}
        closeButtonProps={{icon: <IconX color="red"/>, variant: "subtle", color: "gray"}}
        onClose={closeModal}>
        <Text mt="lg">
          { modalType === 'delete-one' || modalType === 'delete-many' ? "Tato akce je nevratná" : "Prosím potvrďte akci."}
        </Text>
        <Group justify="flex-end" pt="xl">
          <Button
            variant="light"
            color="gray"
            rightSection={<IconX size={16}/>}
            onClick={closeModal}
          >
            Zrušit akci
          </Button>
          <Button
            color={ modalType === 'delete-one' || modalType === 'delete-many' ? "red" : "green" }
            rightSection={ modalType === 'delete-one' || modalType === 'delete-many' ? <IconTrash size={16}/> : <IconCheck size={16}/>}
            onClick={() => {
              switch (modalType) {
                case 'cancel':
                    resetVersionChanges();
                    closeModal();
                    setIsEditable(false);
                  break;
                case 'confirm':
                    handleSubmitVersions();
                    closeModal();
                    setIsEditable(false);
                  break;
                case 'delete-one':
                    handleDeleteVersions();
                    closeModal();
                  break;
                case 'delete-many':
                    handleDeleteVersions();
                    closeModal();
                default:
                  break;
            }}}
          >
            Povrdit
          </Button>

        </Group>
      </Modal>
      <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
        {!measured && (<PopUpFiltersMeasurer measureRef={measureRef} componentGroups={componentGroups} details={details}/>)}
        <PopUpFilters
          measuredWidth={measuredWidth}
          isFiltered={isFiltered}
          filters={filters}
          filterHandlers={{
            setDeployedAtSearchRange,
            appHandlers,
            setSelectedEnvironments,
            versionHandlers,
          }}
          data={{
            componentGroups,
            versionGroups,
            selectedEnvironments,
            apps,
            versions,
            details,
          }}
        />
        <DeploymentDataTable
          measuredWidth={measuredWidth}
          records={records}
          data={{
            apps,
            componentGroups,
            environments,
            selectedEnvironments,
            versions,
            versionGroups,
            details,
            deployedAtSearchRange,
          }}
          filterHandlers={{
            setDeployedAtSearchRange,
            appHandlers,
            setSelectedEnvironments,
            versionHandlers
          }}
          selectedRecords={selectedRecords}
          onSelectedRecordsChange={setSelectedRecords}
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
          isEditable={isEditable}
          versionEdits={{editedVersions, setEditedVersions}}
          deleteSingleRecord={{setModalType, openModal, setSingleDelete}}
        />
        {!isEditable ? (
          <Button
            size="md"
            rightSection={<IconPencil size={16}/>}
            style={{
              bordercolor: "green",
              position: "fixed",
              bottom: "20px",
              right: "30px",
              zIndex: "99",
            }}
            onClick={() => setIsEditable(true)}
          >
            Režim úprav
          </Button>) : (
            <Stack
              style={{
                position: "fixed",
                bottom: "20px",
                right: "30px",
                zIndex: "99",
              }}
            >
              <Group justify="flex-end">
                <Tooltip label="Potvrdit změny">
                  <ActionIcon
                    size="xl"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
                    }}
                    onClick={() => {
                      if (Object.keys(editedVersions).length) {
                        setModalType('confirm');
                        openModal()
                      } else {
                        setIsEditable(false);
                      }
                    }}
                  >
                    <IconCheck/>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Zrušit změny">
                  <ActionIcon
                    color="red"
                    variant="light"
                    size="xl"
                    onClick={() => {
                      if (Object.keys(editedVersions).length > 0) {
                        setModalType('cancel');
                        openModal()
                      } else {
                        setIsEditable(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
                    }}
                  >
                    <IconX c="red"/>
                  </ActionIcon>
                </Tooltip>
              </Group>
              {selectedRecords.length ? (
                <Button
                  size="md"
                  color="red"
                  rightSection={<IconTrash size={16}/>}
                  onClick={() => {setModalType('delete-many'); openModal();}}
                >
                  Smazat vybrané
                </Button>) : null}
            </Stack>)}
      </div>
    </>
  );
}
