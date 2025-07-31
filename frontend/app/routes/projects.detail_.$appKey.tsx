import {Link, LoaderFunctionArgs, redirect, replace, useLoaderData, useNavigate, useRevalidator} from "react-router";
import ContentContainer from "~/components/global/content-container";
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
  TextInput,
  Text,
  Title, Loader, Tooltip, Modal, Flex, Indicator, Fieldset, ScrollArea
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconHistory, IconInfoCircle,
  IconPencil, IconPlus,
  IconTrash,
  IconX
} from "@tabler/icons-react";
import {BROWSER_API_URL, DOCKER_API_URL} from "~/constants"
import {useDisclosure} from "@mantine/hooks";
import {useEffect, useRef, useState} from "react";
import {useForm} from "@mantine/form";
import {NotificationData, notifications} from "@mantine/notifications";
import {ErrorBody} from "~/types";
import IconJira from "~/components/global/icon-jira";
import {equalsCaseInsensitive} from "~/util-methods";

//
// Detail projektu
//

export async function loader({
                               params, request
                             }: LoaderFunctionArgs) {
  const response = await fetch(`${DOCKER_API_URL}/apps/${params.appKey}`);

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const scrollToApp = url.searchParams.get("appKey");
  const scrollToVersion = url.searchParams.get("versionName")

  const scrollTo = scrollToApp && scrollToVersion ? {appKey: scrollToApp, versionName: scrollToVersion} : null;

  if (!response.ok) {
    return redirect('/404');
  }

  const data = await response.json();

  let goBackTo = {url: "/projects", buttonText: "přehled"}

  switch(from) {
    case "history":
      goBackTo = {url: "/deployment-history", buttonText: "historii"}
  }

  return {appDetail: data, goBackTo: goBackTo, scrollTo: scrollTo}
}

export default function ProjectDetail() {
  const navigate = useNavigate();

  const loaderData = useLoaderData();
  const appDetail = loaderData.appDetail;

  appDetail.environmentNames.sort();

  const getLatestVersionForComponentsAndEnvs = () => {
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
          latestVersions[key][name] = "-";
        }
      });
    });

    return Object.fromEntries(
      Object.entries(latestVersions).sort(([keyA]: [string, any], [keyB]: [string, any]) => keyA.localeCompare(keyB))
    );
  };

  const transformData = () => {
    const transformedData = {};

    Object.keys(appDetail.appKeyToVersionDtosMap).forEach((appKey) => {
      transformedData[appKey] = appDetail.appKeyToVersionDtosMap[appKey].map((version) => {
        console.log(version)

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
    const targetId = `row-${appKey}-${versionName}`;
    const tryScrollToRow = () => {
      const row = document.getElementById(targetId);
      if (row) {
        row.scrollIntoView({ block: "center", behavior: "smooth" });
        row.style.boxShadow = "inset 0 0 3px 3px green";
        row.style.transition = "box-shadow 0.2s ease-in-out";
        setTimeout(() => {
          row.style.boxShadow = "";
        }, 1500);
      } else {
        setTimeout(tryScrollToRow, 100);
      }
    };

    if (!openStates[appKey]) {
      toggleCollapse(appKey);
      setTimeout(tryScrollToRow, 500);
    } else {
      tryScrollToRow();
    }
  };

  const [overflowMap, setOverflowMap] = useState<Record<string, boolean>>({});

  const paperRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const checkOverflow = () => {
    const newOverflowMap: Record<string, boolean> = {};
    Object.entries(paperRefs.current).forEach(([key, ref]) => {
      if (ref) {
        newOverflowMap[key] = ref.scrollHeight > ref.clientHeight;
      }
    });
    setOverflowMap(newOverflowMap);
  };

  useEffect(() => {
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, []);

  const latestVersions = getLatestVersionForComponentsAndEnvs(appDetail);
  const transformedData = transformData(appDetail);

  const envIdCounter = useRef(0);

  const initializeEnvironments = () => {
    return appDetail.environmentNames.map(name => ({
      id: envIdCounter.current++,
      name,
      newName: name,
      isNew: false,
      toDelete: false,
    }));
  };

  const [environments, setEnvironments] = useState(() => initializeEnvironments());


  const handleAddEnvironment = () => {
    if (inputEnvironment.trim()) {
      setEnvironments((prev) => [
        ...prev,
        {
          id: envIdCounter.current++, // Ensure the id is unique
          name: inputEnvironment.trim(),
          newName: inputEnvironment.trim(),
          isNew: true,
          toDelete: false,
        }
      ]);
    }
    setInputEnvironment('');
    document.getElementById('inputEnv').focus();
  };

  const handleRemoveEnvironment = (idToDelete) => {
    const foundEnvironment = environments.find(env => env.id === idToDelete);

    if (!foundEnvironment.isNew) {
      setEnvironments((prev) =>
        prev.map(env =>
          env.id === idToDelete ? { ...env, toDelete: true } : env
        )
      );
    } else {
      setEnvironments(environments.filter(env => env.id !== idToDelete));
    }

    setObjectToDelete({ type: "", id: -1 });
  }

  const handleEnvironmentNameChange = (envId, changedName) => {
    setEnvironments((prev) =>
      prev.map(env =>
        env.id === envId ? { ...env, newName: changedName } : env
      )
    )
  }



  const [inputEnvironment, setInputEnvironment] = useState('');

  const [enabledEnv, envButtonHandlers] = useDisclosure(false);

  useEffect(() => {
    if (inputEnvironment.trim()
      && !environments.some(env => equalsCaseInsensitive(env.newName, inputEnvironment.trim()) && !env.toDelete)) {
      envButtonHandlers.open();
    } else {
      envButtonHandlers.close();
    }
  }, [inputEnvironment, environments]);

  const appIdCounter = useRef(0);

  // komponenty z TextInputu ve formu
  const initializeComponentStates = () => {
    return Object.entries(appDetail.componentKeysAndNamesMap)
      .map(([key, name]) => ({
        id: appIdCounter.current++,
        key,
        name,
        newName: name,
        newKey: key,
        isNew: false,
        toDelete: false,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  };

  const resetForm = () => {
    setComponentStates((prev) =>
      prev.filter(component => !component.isNew).map(component =>
        ({ ...component,
          newName: component.name,
          newKey: component.key,
          isNew: false,
          toDelete: false, })
      )
    )

    setProjectState((prev) => ({...prev, newName: prev.name, newKey: prev.key}))

    setEnvironments((prev) =>
      prev.filter(env => !env.isNew).map(env =>
        ({ ...env,
          newName: env.name,
          isNew: false,
          toDelete: false, })
      )
    )
  }

  const [componentStates, setComponentStates] = useState(() => initializeComponentStates());

  const [projectState, setProjectState] = useState(componentStates.find(component => component.key === appDetail.key));

  useEffect(() => {
    form.setFieldValue('name', projectState.newName);
    form.setFieldValue('key', projectState.newKey);
    form.validate();
  }, [projectState]);

  useEffect(() => {
    form.validate();
  }, [componentStates]);



  const [inputComponentName, setInputComponentName] = useState('');
  const [inputComponentKey, setInputComponentKey] = useState('');

  // state pro button pridavajici komponenty
  const [enabledApp, componentButtonHandlers] = useDisclosure(false);

  useEffect(() => {
    if (inputComponentKey.trim()
      && inputComponentName.trim()
      && !componentStates.some(component=> equalsCaseInsensitive(component.newKey, inputComponentKey) && !component.toDelete))
    {
      componentButtonHandlers.open();
    } else {
      componentButtonHandlers.close();
    }
  }, [inputComponentKey, inputComponentName, componentStates]);

  // pridani komponenty
  const handleAddComponent = () => {
    if (inputComponentKey.trim() && inputComponentName.trim()) {
      setComponentStates([
        ...componentStates, {
          id: appIdCounter.current++,
          key: inputComponentKey.trim(),
          name: inputComponentName.trim(),
          newKey: inputComponentKey.trim(),
          newName: inputComponentName.trim(),
          isNew: true,
          toDelete: false,
      }]);
      setInputComponentName('');
      setInputComponentKey('');
      document.getElementById('inputComponentName').focus();
    }
  };

  const [objectToDelete, setObjectToDelete] = useState({ type: '', id: -1 });

  useEffect(() => {
    if (objectToDelete.id !== -1) {
      openConfirm();
    }
  }, [objectToDelete]);

  // odebrani komponenty
  const handleRemoveComponent = (idToDelete) => {
    const foundComponent = componentStates.find(component => component.id === idToDelete);

    if (!foundComponent.isNew) {
      setComponentStates((prev) =>
        prev.map(component =>
          component.id === idToDelete ? { ...component, toDelete: true } : component
        )
      );
    } else {
      setComponentStates(componentStates.filter(component => component.id !== idToDelete));
    }
    setObjectToDelete({ type: "", id: -1 });
  }

  const hasDeploymentComp = (idToCheck) => {
    const foundApp = componentStates.find(component => component.id === idToCheck);

    return !foundApp.isNew
      && Object.keys(appDetail.componentKeysAndNamesMap)
        .some(ogKey => ogKey === foundApp.key)
      && appDetail.environmentNames
        .some(env => latestVersions[foundApp.key][env] !== "-");
  }

  const hasDeploymentEnv = (idToCheck) => {
    const foundEnv = environments.find(env => env.id === idToCheck);

    return !foundEnv.isNew
      && Object.keys(appDetail.componentKeysAndNamesMap)
        .some(key => latestVersions[key][foundEnv.name] !== "-");
  }

  const handleComponentNameChange = (idToChange, newValue) => {
    setComponentStates((prev) =>
      prev.map(component =>
        component.id === idToChange
          ? { ...component, newName: newValue }
          : component
      )
    );
  };

  const handleComponentKeyChange = (idToChange, newValue) => {
    setComponentStates((prev) =>
      prev.map(component =>
        component.id === idToChange
          ? { ...component, newKey: newValue }
          : component
      )
    );
  };


  const form = useForm({
    mode: 'uncontrolled',
    validateInputOnChange: true,
    initialValues: {
      name: appDetail.name,
      key: appDetail.key,
      environments: [],
      components: []
    },

    validate: {
      name: (value) => (value.length === 0 ? 'Název projektu nesmí být prázdný.' : null),
      key: (value) => (value.length === 0
        ? 'Klíč projektu nesmí být prázdný.'
        : componentStates.some(component=> (
            equalsCaseInsensitive(component.newKey, projectState.newKey)
          && component.id !== projectState.id
          && !component.toDelete
        ))
        ? 'Klíč projektu je stejný jako klíč některé z komponent.' : null),
    },

    transformValues: (values) => ({
      key: values.key,
      name: values.name,
      app: values.AppDto = {
        key: values.key,
        name: values.name,
      },
      environments: environments,
      components: componentStates,
    }),
  });

  const [hasErrors, setHasErrors] = useState(false);

  useEffect(() => {
    form.validate();

    const customErrors = checkFormErrors();
    const formErrors = !form.isValid();

    setHasErrors(formErrors || customErrors);
  }, [componentStates, environments])

  const checkFormErrors = () => {
    const envErrors = document.querySelectorAll('[id^="inputEnv"][aria-invalid="true"]');
    const compNameErrors = document.querySelectorAll('[id^="inputComponentName"][aria-invalid="true"]');
    const compKeyErrors = document.querySelectorAll('[id^="inputComponentKey"][aria-invalid="true"]');

    return envErrors.length > 0 || compNameErrors.length > 0 || compKeyErrors.length > 0;
  }

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

  const getEnvErrorMessage = (idToCheck) => {
    const foundEnv = environments.find(env => env.id === idToCheck);

    if (!foundEnv.toDelete) {
      if (!foundEnv.newName.trim() && !foundEnv.toDelete) {
        return "Název prostředí nesmí být prázdný."
      } else if (environments.some(env =>
        equalsCaseInsensitive(env.newName, foundEnv.newName.trim())
        && env.id !== idToCheck
        && !env.toDelete
        && env.newName
      )) {
        return "Název prostředí musí být unikátní."
      }
    }
    return null
  }

  const getCompErrorMessage = (idToCheck) => {
    const foundComp = componentStates.find(comp => comp.id === idToCheck);

    if (!foundComp.toDelete) {
      if (!foundComp.newKey.trim() && !foundComp.toDelete) {
        return "Klíč komponenty nesmí být prázdný."
      } else if (equalsCaseInsensitive(foundComp.newKey, projectState.newKey)) {
        return "Klíč komponenty je stejný jako klíč projektu."
      } else if (componentStates.some(comp =>
          equalsCaseInsensitive(comp.newKey, foundComp.newKey.trim())
          && comp.id !== idToCheck
          && !comp.toDelete
          && comp.newKey
          && comp.id !== projectState.id
        )) {
        return "Klíč komponenty musí být unikátní."
      }
    }

    return null
  }

  const handleRemoveProject = async () => {
    const requestOptions = {
      method: 'DELETE',
    };

    try {
      let response = await fetch(`${BROWSER_API_URL}/apps/${appDetail.key}?force=true`, requestOptions);
      if (!response.ok) {
        const error: ErrorBody = await response.json();
        notifications.show({
          color: "red",
          title: "Při mazání projektu došlo k chybě!",
          message: error.details,
          position: "top-center",
        } as NotificationData);
        return;
      }
      navigate("/projects");
      notifications.show({
        title: "Úspěch!",
        message: `Projekt ${appDetail.key} byl úspěšně smazán.`,
        position: "top-center",
      });
    } catch (error) {
      console.error("Caught error: ", error);
      notifications.show({
        color: "red",
        title: "Při mazání projektu došlo k chybě!",
        message: "Nastala neočekávaná chyba.",
        position: "top-center",
      } as NotificationData);
    }
  }

  const handleSubmit = async (formValues) => {
    const deleteOptions = {
      method: 'DELETE',
    };
    const postOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '',
    }
    const putOptions = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '',
    }

    let response;

    const appsToRemove = formValues.components.filter(component => component.toDelete);
    const envsToRemove = formValues.environments.filter(env => env.toDelete);

    const appsToAdd = formValues.components
      .filter(component => component.isNew)
      .map(component => ({
        ...component,
        newKey: component.newKey.toLowerCase()
    }));

    const envsToAdd = formValues.environments
      .filter(env => env.isNew)
      .map(env => ({
        ...env,
        newName: env.newName.toLowerCase()
      }));

    const appsToUpdate = formValues.components
      .filter(component => (
        !equalsCaseInsensitive(component.key, component.newKey)
          || component.name !== component.newName)
        && !component.toDelete
        && !component.isNew
        && component.id !== projectState.id)
      .map(component => ({
        ...component,
        newKey: component.newKey.toLowerCase()
      }));

    const envsToUpdate = formValues.environments
      .filter(env =>
        !equalsCaseInsensitive(env.name, env.newName)
        && !env.toDelete
        && !env.isNew)
      .map(env => ({
        ...env,
        newName: env.newName.toLowerCase()
      }));

    const newProjectKey = projectState.newKey.toLowerCase();

    console.log("remove apps: ");
    console.log(appsToRemove);
    console.log("add apps: ");
    console.log(appsToAdd);
    console.log("update apps: ");
    console.log(appsToUpdate);

    console.log("remove envs: ");
    console.log(envsToRemove);
    console.log("add envs: ");
    console.log(envsToAdd);
    console.log("update envs: ");
    console.log(envsToUpdate);

    try {
      for (const app of appsToRemove) {
        response = await fetch(`${BROWSER_API_URL}/apps/${app.key}?force=true`, deleteOptions);
        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: `Při odebírání komponenty ${app.key} došlo k chybě!`,
            message: error.details,
            position: "top-center",
          } as NotificationData);
          return;
        }
      }

      for (const env of envsToRemove) {
        response = await fetch(`${BROWSER_API_URL}/apps/${projectState.key}/envs/${env.name}?force=true`, deleteOptions);
        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: `Při odebírání prostředí ${env.name} došlo k chybě!`,
            message: error.details,
            position: "top-center",
          } as NotificationData);
          return;
        }
      }

      if (!equalsCaseInsensitive(projectState.key, projectState.newKey) || projectState.name !== projectState.newName) {
        putOptions.body = JSON.stringify({key: newProjectKey, name: projectState.newName})
        response = await fetch(`${BROWSER_API_URL}/apps/${projectState.key}`, putOptions);
        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: `Při aktualizaci projektu ${projectState.key} došlo k chybě!`,
            message: error.details,
            position: "top-center",
          } as NotificationData);
          return;
        }
      }

      for (const app of appsToAdd) {
        postOptions.body = JSON.stringify({ key: app.newKey, name: app.newName, parentKey: newProjectKey });
        response = await fetch(`${BROWSER_API_URL}/apps`, postOptions);
        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: `Při přidávání komponenty ${app.newKey} došlo k chybě!`,
            message: error.details,
            position: "top-center",
          } as NotificationData);
          return;
        }
      }

      for (const env of envsToAdd) {
        postOptions.body = JSON.stringify({appKey: newProjectKey, name: env.newName});
        response = await fetch(`${BROWSER_API_URL}/apps/${projectState.newKey}/envs`, postOptions);
        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: `Při aktualizaci prostředí ${env.newName} došlo k chybě!`,
            message: error.details,
            position: "top-center",
          } as NotificationData);
          return;
        }
      }

      for (const app of appsToUpdate) {
        putOptions.body = JSON.stringify({ key: app.newKey, name: app.newName, parentKey: newProjectKey });
        response = await fetch(`${BROWSER_API_URL}/apps/${app.key}`, putOptions);
        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: `Při aktualizaci aplikace ${app.key} došlo k chybě!`,
            message: error.details,
            position: "top-center",
          } as NotificationData);
          return;
        }
      }

      for (const env of envsToUpdate) {
        putOptions.body = JSON.stringify({appKey: newProjectKey, name: env.newName});
        response = await fetch(`${BROWSER_API_URL}/apps/${newProjectKey}/envs/${env.name}`, putOptions);
        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: `Při aktualizaci prostředí ${env.name} došlo k chybě!`,
            message: error.details,
            position: "top-center",
          } as NotificationData);
          return;
        }
      }
      closeEdit();
      if (!equalsCaseInsensitive(projectState.key, projectState.newKey)) {
        await navigate(`/projects/detail/${newProjectKey}`);
      }
      window.location.reload();
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Při mazání projektu došlo k chybě!",
        message: "Nastala neočekávaná chyba.",
        position: "top-center",
      } as NotificationData)
    }
  }

  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);
  const [resetFormOpened, { open: openResetForm, close: closeResetForm }] = useDisclosure(false);

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      checkOverflow();
    }
  }, [isHydrated]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      checkOverflow();
    }, 1);

    return () => clearTimeout(timeout);
  }, [openStates]);

  useEffect(() => {
    if (!isHydrated || !loaderData.scrollTo) return;

    handleCellClick(loaderData.scrollTo.appKey, loaderData.scrollTo.versionName);
  }, [isHydrated, loaderData.scrollTo]);

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
            Smazat {
              objectToDelete.type === "project"
                ? `projekt ${componentStates.find(component => component.id === projectState.id).name}`
                : objectToDelete.type === "env"
                  ? `prostředí ${environments.find(env => env.id === objectToDelete.id)?.name.toUpperCase()}`
                  : `komponentu ${componentStates.find(component => component.id === objectToDelete.id)?.name}`
          }?
          </Title>
      }
        opened={confirmOpened}
        onClose={() => { setTimeout(() => setObjectToDelete({ type: "", id: -1 }), 100); closeConfirm(); }} zIndex={999}
        closeButtonProps={{icon: <IconX color="red"/>, variant: "subtle", color: "gray"}}
      >
        <Text mt="lg">
          Společně s {objectToDelete.type === "project" ? "projektem" : objectToDelete.type === "env" ? "prostředím" : "komponentou"} budou odstraněna <br/> i všechna související data!
        </Text>
        <Group justify="flex-end" pt="xl">
          <Button variant="light" color="gray" rightSection={<IconX size={16}/>} onClick={() => { setTimeout(() => setObjectToDelete({ type: "", id: -1 }), 100); closeConfirm(); }}>Zrušit akci</Button>
          <Button
            color="red"
            rightSection={<IconTrash size={16}/>}
            onClick={() => {
              closeConfirm();
              setTimeout(() =>
                objectToDelete.type === "project"
                  ? handleRemoveProject()
                  : objectToDelete.type === "env"
                    ? handleRemoveEnvironment(objectToDelete.id)
                    : handleRemoveComponent(objectToDelete.id),
                100)
            }}>Smazat</Button>
        </Group>
      </Modal>

      <Modal
        title={
        <Title order={3}>
          Opravdu chcete zahodit změny?
        </Title>
      }
        opened={resetFormOpened}
        onClose={closeResetForm} zIndex={999}
        closeButtonProps={{icon: <IconX color="red"/>, variant: "subtle", color: "gray"}}
      >
        <Text mt="lg">
          Hodnoty ve formuláři budou obnoveny na původní hodnoty.
        </Text>
        <Group justify="flex-end" pt="xl">
          <Button variant="light" color="gray" rightSection={<IconX size={16}/>} onClick={closeResetForm}>Zrušit akci</Button>
          <Button
            color="red"
            rightSection={<IconHistory size={16}/>}
            onClick={() => { resetForm(); closeResetForm(); }}
          >
            Zahodit
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={editOpened}
        size="auto"
        onClose={closeEdit}
        closeButtonProps={{icon: <IconX color="red"/>, variant: "subtle", color: "gray"}}
        title={<Title mb="md" order={2}>Úprava projektu {appDetail.name}</Title>}
        scrollAreaComponent={ScrollArea.Autosize}
        styles={{
          header: {paddingBottom: 8},
          body: {paddingBottom: 0}
        }}
      >
        <form
          onSubmit={form.onSubmit((values) => handleSubmit(values))}
          onKeyDown={(e) => {if (e.key === 'Enter') e.preventDefault();}}
        >
          <div style={{paddingLeft: 8, paddingRight: 8}}>
          <Fieldset pb="35">
          <Flex align="flex-start" direction="row" gap="md" h={55}>
            <TextInput
              id={'inputProjectName'}
              w={322}
              rightSection={
                projectState.name !== projectState.newName ?
                  <Tooltip
                    label={`Obnovit původní hodnotu.`}
                  >
                    <ActionIcon
                      size="26px"
                      radius="xl"
                      color="yellow"
                      variant="subtle"
                      onClick={() =>
                        setProjectState((prev) =>({...prev, newName: prev.name}))
                      }
                    >
                      <IconHistory size={18}/>
                    </ActionIcon>
                  </Tooltip> : null
              }
              data-autofocus
              withAsterisk
              label="Název"
              placeholder="Zadejte název projektu..."
              value={projectState.newName}
              onInput={(e) => setProjectState((prev) => ({...prev, newName: e.target.value}))}
              key={form.key('name')}
              {...form.getInputProps('name')}
            />
            <TextInput
              id={'inputProjectKey'}
              w={322}
              rightSection={
                !equalsCaseInsensitive(projectState.key, projectState.newKey) ?
                  <Tooltip
                    label={`Obnovit původní hodnotu.`}
                  >
                    <ActionIcon
                      size="26px"
                      radius="xl"
                      color="yellow"
                      variant="subtle"
                      onClick={() =>
                        setProjectState((prev) =>({...prev, newKey: prev.key}))
                      }
                    >
                      <IconHistory size={18}/>
                    </ActionIcon>
                  </Tooltip> : null
              }
              withAsterisk
              label="Klíč"
              placeholder="Zadejte klíč projektu..."
              value={projectState.newKey.toUpperCase()}
              onInput={(e) => setProjectState((prev) => ({...prev, newKey: e.target.value}))}
              key={form.key('key')}
              {...form.getInputProps('key')}
            />
          </Flex>
          </Fieldset>
          <Fieldset w="fit-content" mt="lg" pb="35" legend={
            <Title order={3}>
              Prostředí
            </Title>}
          >
          <Flex align="flex-start" direction="column" gap="md">
          {environments.map(environment => (
            <Group align="flex-start" h={50}>
              <Indicator
                processing
                styles={{
                  indicator: { padding: 0 }
                }}
                label={
                <Tooltip label={<span>Nové prostředí, které bude přidáno <br/>do evidence po odeslání formuláře.</span>}>
                  <div style={{width: 10, height: 10, cursor: "pointer", position: "relative" }}/>
                </Tooltip>}
                position="top-end"
                disabled={!environment.isNew}>
              <TextInput
                disabled={environment.toDelete}
                rightSection={
                  !environment.isNew ?
                  !equalsCaseInsensitive(environment.name, environment.newName) && !environment.toDelete ?
                      <Tooltip
                        label={`Obnovit původní hodnotu.`}
                      >
                        <ActionIcon
                          size="26px"
                          radius="xl"
                          color="yellow"
                          variant="subtle"
                          onClick={() =>
                            setEnvironments((prev) =>
                              prev.map(env =>
                                env.id === environment.id ? { ...env, newName: env.name } : env
                              ))
                          }
                        >
                          <IconHistory size={18}/>
                        </ActionIcon>
                      </Tooltip>
                    : null
                    : null
                }
                id={`inputEnv${environment.id}`}
                w={300}
                placeholder="Zadejte název prostředí..."
                value={environment.newName.toUpperCase()}
                onInput={(e) => handleEnvironmentNameChange(environment.id, e.target.value.toLowerCase())}
                error={getEnvErrorMessage(environment.id)}
              />
              </Indicator>
              {environment.toDelete ?
                <Tooltip label="Vrátit prostředí do evidence">
                  <ActionIcon variant="light" color="orange" mt={4} onClick={() => setEnvironments((prev) =>
                    prev.map(env =>
                      env.id === environment.id ? { ...env, toDelete: false } : env
                    ))}>
                    <IconHistory size={18}/>
                  </ActionIcon>
                </Tooltip> :
                <ActionIcon variant="light" color="red" mt={4} onClick={() =>
                  {
                    if (hasDeploymentEnv(environment.id)) {
                      setObjectToDelete({type: "env", id: environment.id});
                      openConfirm();
                    } else {
                      handleRemoveEnvironment(environment.id)
                    }
                  }}
                >
                  <IconTrash size={18}/>
                </ActionIcon>
              }
            </Group>
          ))}
          </Flex>
          <Group mt="8px">
            <TextInput
              id={"inputEnv"}
              label={"Nové prostředí"}
              h={50}
              w={300}
              inputWrapperOrder={['label', 'input', 'description', 'error']}
              placeholder="Zadejte název prostředí..."
              value={inputEnvironment.toUpperCase()}
              onInput={(e) => {setInputEnvironment(e.target.value.toLowerCase());}}
              onKeyDown={(e) => {
                if (e.key === "Enter" && enabledEnv) {
                  handleAddEnvironment();
                }
              }}
              description={environments.some(env => equalsCaseInsensitive(env.newName, inputEnvironment.trim()) && !env.toDelete && env.newName)
                ? <Group gap={"6"} c={"yellow"}><IconInfoCircle size={16}/>Prostředí s tímto názvem už je evidováno.</Group> : null}
            />
            <Tooltip label={!inputEnvironment.trim() ? "Pro přidání prostředí vyplňte název." : null} disabled={enabledEnv || environments.some(env => equalsCaseInsensitive(env.newName, inputEnvironment.trim()) && !env.toDelete)}>
              <ActionIcon
                disabled={!enabledEnv}
                variant="light"
                color="green"
                onClick={handleAddEnvironment}
                mt={35}
              >
                <IconPlus size="20" />
              </ActionIcon>
            </Tooltip>
          </Group>
          </Fieldset>

          <Fieldset mt="lg" pb="35" mb="8" legend={
            <Title order={3} >
              Projektové komponenty
            </Title>}
          >
          <Flex align="flex-start" direction="column" gap="md">
          {componentStates.filter(component => component.key !== appDetail.key).map((row, index) => (
              <Group align="flex-start" key={row.id} h={index === 0 ? 75 : 50}>
                <TextInput
                  disabled={row.toDelete}
                  rightSection={
                    !row.isNew ?
                    !equalsCaseInsensitive(row.name as string, row.newName as string) && !row.toDelete ?
                      <Tooltip
                        label={`Obnovit původní hodnotu.`}
                      >
                        <ActionIcon
                          size="26px"
                          radius="xl"
                          color="yellow"
                          variant="subtle"
                          onClick={() =>
                            setComponentStates((prev) =>
                              prev.map(comp =>
                                comp.id === row.id ? { ...comp, newName: comp.name } : comp
                              ))
                          }
                        >
                          <IconHistory size={18}/>
                        </ActionIcon>
                      </Tooltip>
                      : null
                      : null
                  }
                  id={`inputComponentName${row.id}`}
                  w="300"
                  label={componentStates.length > 0 && index === 0 ? "Název" : ""}
                  placeholder="Zadejte název komponenty..."
                  value={row.newName}
                  onInput={(e) => handleComponentNameChange(row.id, e.target.value)}
                  error={!row.newName.trim() ? "Název nesmí být prázdný." : null}
                />
                <TextInput
                  disabled={row.toDelete}
                  id={`inputComponentKey${row.id}`}
                  rightSection={
                    !row.isNew ?
                      !equalsCaseInsensitive(row.key, row.newKey) && !row.toDelete ?
                        <Tooltip
                          label={`Obnovit původní hodnotu.`}
                        >
                          <ActionIcon
                            size="26px"
                            radius="xl"
                            color="yellow"
                            variant="subtle"
                            onClick={() =>
                              setComponentStates((prev) =>
                                prev.map(comp =>
                                  comp.id === row.id ? { ...comp, newKey: comp.key } : comp
                                ))
                            }
                          >
                            <IconHistory size={18}/>
                          </ActionIcon>
                        </Tooltip>
                        : null
                      : null
                  }
                  inputContainer={(children) => <Indicator
                    processing
                    styles={{
                      indicator: {padding: 0}
                    }}
                    label={
                      <Tooltip label={<span>Nová komponenta, která bude přidána <br/>do evidence po odeslání formuláře.</span>}>
                        <div style={{width: 10, height: 10, cursor: "pointer", position: "relative" }}/>
                      </Tooltip>}
                    position="top-end"
                    disabled={!row.isNew}>
                    {children}
                  </Indicator>}
                  w="300"
                  label={ componentStates.length > 0 && index === 0 ? "Klíč" : "" }
                  placeholder="Zadejte klíč komponenty..."
                  value={row.newKey.toUpperCase()}
                  onInput={(e) => handleComponentKeyChange(row.id, e.target.value.toLowerCase())}
                  error={getCompErrorMessage(row.id)}
                />
                {row.toDelete ?
                  <Tooltip label="Vrátit komponentu do evidence">
                    <ActionIcon variant="light" color="orange" mt={index === 0 ? 27 : 4} onClick={() => setComponentStates((prev) =>
                      prev.map(comp =>
                        comp.id === row.id ? { ...comp, toDelete: false } : comp
                      ))}>
                      <IconHistory size={18}/>
                    </ActionIcon>
                  </Tooltip> :
                  <ActionIcon
                    variant="light"
                    color="red"
                    mt={index === 0 ? 27 : 4}
                    onClick={() =>
                      {
                        if (hasDeploymentComp(row.id)) {
                          setObjectToDelete({type: "app", id: row.id});
                          openConfirm();
                        } else {
                          handleRemoveComponent(row.id)
                        }
                      }
                    }
                  >
                    <IconTrash size={18}/>
                  </ActionIcon>
                }
              </Group>)
            )}
          </Flex>
          <Group mt="8px">
            <TextInput
              h={50}
              id='inputComponentName'
              label={"Nová komponenta"}
              placeholder="Zadejte název komponenty..."
              value={inputComponentName}
              w={300}
              onInput={(e) => {setInputComponentName(e.target.value);}}
            />
            <TextInput
              h={50}
              id='inputComponentKey'
              label={" "}
              placeholder="Zadejte klíč komponenty..."
              value={inputComponentKey.toUpperCase()}
              w={300}
              inputWrapperOrder={['label', 'input', 'description', 'error']}
              onInput={(e) => {setInputComponentKey(e.target.value.toLowerCase());}}
              description={componentStates.some(component =>
                equalsCaseInsensitive(component.newKey, inputComponentKey.trim()) && !component.toDelete)
                ? equalsCaseInsensitive(projectState.newKey, inputComponentKey)
                  ? <Group gap={"6"} c={"yellow"}><IconInfoCircle size={16}/>Klíč komponenty je stejný jako klíč projektu.</Group>
                  : <Group gap={"6"} c={"yellow"}><IconInfoCircle size={16}/>Komponenta s tímto klíčem už je evidována.</Group>
                : null
              }
            />
            <Tooltip
              label={"Pro přidání komponenty vyplňte název i klíč."}
              disabled={inputComponentKey.trim() && inputComponentName.trim()}
            >
              <ActionIcon
                disabled={!enabledApp}
                variant="light"
                color="green"
                onClick={handleAddComponent}
                mt={35}
              >
                <IconPlus size="20" />
              </ActionIcon>
            </Tooltip>

          </Group>
          </Fieldset>
        </div>
          <Paper
            style={{
              position: "sticky",
              bottom: 0,
              zIndex: 999
            }}>
            <Group
              py={16}
              pr={16}
              justify="flex-end"
            >
              <Button variant="light" color="red" onClick={openResetForm} rightSection={<IconX size={16}/>}>Zahodit změny</Button>
              <Tooltip label={hasErrors ? "Ve formuláři jsou chyby, pro odeslání je opravte." : null}><Button type="submit" disabled={hasErrors} rightSection={<IconCheck size={16}/>}>Uložit</Button></Tooltip>
            </Group>
          </Paper>
        </form>
      </Modal>
      <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
        <Group mr="2px" justify="space-between">
          <Button
            variant="outline"
            size="md"
            leftSection={<IconArrowBackUp size={16}/>}
            component={Link}
            to={loaderData.goBackTo.url}
          >
            Zpět na {loaderData.goBackTo.buttonText}
          </Button>
          <Group style={{alignSelf: "flex-end"}}>
            <Button
              size="md"
              rightSection={<IconTrash size={16}/>}
              variant="light"
              color="red"
              onClick={() => setObjectToDelete({ type: "project", id: -2 })}
            >
              Smazat
            </Button>
          </Group>
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
              <Group gap="5px">
                <Title
                  style={{color: "green"}}
                >
                  Detail projektu {appDetail.name}
                </Title>
                <ActionIcon
                  size="lg"
                  variant="subtle"
                  onClick={openEdit}
                ><IconPencil size={16}/></ActionIcon>
              </Group>
              <Group justify="space-between" ml="xl" pr="xl" mt="xl" w="100%" h="100%">
                <Stack h="100%" justify="center" gap="xl">
                  <Stack gap="xs">
                    <Title order={2}>Klíč</Title>
                    <Text
                      size="xl"
                    >
                      {appDetail.key.toUpperCase()}
                    </Text>
                  </Stack>
                  <Stack gap="xs">
                    <Title order={2}>Název</Title>
                    <Text
                      size="xl"
                    >
                      {appDetail.name}
                    </Text>
                  </Stack>
                  <Stack>
                    <Title order={2}>Prostředí</Title>
                    {Object.entries(environments).length === 0 ? (<Text size="xl">Projekt nemá žádná prostředí</Text>) : null}
                    <Group>
                      {appDetail.environmentNames.map((name) => <Badge size="lg">{name}</Badge>)}
                    </Group>
                  </Stack>
                </Stack>
                <Stack gap="0" mr="xl" w="50%">
                  {Object.keys(appDetail.componentKeysAndNamesMap).some(appKey => Object.entries(latestVersions[appKey]).length > 0) ? (
                    <>
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
                                  style={{textAlign: 'center', borderRight: "1px solid green", backgroundColor: 'var(--mantine-color-green-8)'}}
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
                    </>) : null}
                </Stack>
              </Group>
            </Card>
            {Object.keys(appDetail.componentKeysAndNamesMap).some(appKey => Object.entries(latestVersions[appKey]).length > 0) ? (
              <Card withBorder shadow="sm" radius="md" pb="48px"
                    style={{display: "flex", flexDirection: "column", alignItems: "flex-start"}}>
                <Group w="100%" justify="space-between">
                  <Group gap="5px">
                  <Title
                    style={{color: "green"}}
                    order={2}
                  >
                    Verze komponent
                  </Title>
                    {/*<ActionIcon
                      size="lg"
                      variant="subtle"
                      onClick={openEdit}
                    ><IconPencil size={16}/></ActionIcon>*/}
                  </Group>
                  <Button
                    mr="sm"
                    mt="sm"
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
                      ? "Sbalit vše"
                      : "Rozbalit vše"
                    }
                  </Button>
                </Group>
                <Stack justify="space-between" w="100%">
                  {Object.keys(appDetail.appKeyToVersionDtosMap)
                    .sort((keyA, keyB) => keyA.localeCompare(keyB))
                    .filter(key => transformedData[key] && transformedData[key].length > 0)
                    .map((key) => (
                        <Stack mt="xl" ml="xl" mr="xl">
                          <Button
                            size="xl"
                            justify="space-between"
                            variant="subtle"
                            onClick={() => toggleCollapse(key)}
                            leftSection={
                              <Group>
                                <Title key={`title-${key}`} order={3} c="var(--mantine-color-text)">
                                  {appDetail.componentKeysAndNamesMap[key]}
                                </Title>
                                <Badge size="lg" variant="outline">{key}</Badge>
                              </Group>
                            }

                            rightSection={
                              openStates[key] ? <IconChevronUp style={{marginLeft: "auto"}}/> : <IconChevronDown style={{marginLeft: "auto"}}/>
                            }
                          />
                          <Collapse in={openStates[key]}>
                          <Paper
                            radius="md"
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
                              stickyHeader
                              style={{borderRight: overflowMap[key] ? "2px solid green" : "" }}
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
                                          backgroundColor: 'var(--mantine-color-green-8)'
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
                                          backgroundColor: 'var(--mantine-color-green-7)'
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
                                          backgroundColor: 'var(--mantine-color-green-7)'
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
                                          ? <ActionIcon component="a" href={rowData[name].jiraUrl} color="blue"
                                                        variant="subtle">
                                            <IconJira/>
                                          </ActionIcon>
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
              </Card>) : null
            }
          </Stack>
        </ContentContainer>
      </div>
    </>
  );
}
