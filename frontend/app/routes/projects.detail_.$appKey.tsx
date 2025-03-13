import {Link, LoaderFunctionArgs, redirect, replace, useLoaderData, useNavigate, useRevalidator} from "react-router";
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
  Title, Loader, Tooltip, Modal, Notification, useModalsStack
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconExternalLink,
  IconPencil, IconPlus,
  IconRocket, IconTrash,
  IconX
} from "@tabler/icons-react";
import {API_URL} from "~/constants"
import {useDisclosure} from "@mantine/hooks";
import {useEffect, useRef, useState} from "react";
import {useForm} from "@mantine/form";
import {notifications} from "@mantine/notifications";
import {ErrorBody} from "~/types";

// TODO datove typy a upravit parsovani, je to hnus
export async function loader({
                               params,
                             }: LoaderFunctionArgs) {
  console.log(`fetching data for: ${params.appKey}`);
  const response = await fetch(`${API_URL}/apps/${params.appKey}`);

  if (!response.ok) {
    return redirect('/404');
  }

  const appDetail = await response.json();

  return (appDetail);
}

export default function ProjectDetail() {
  const { revalidate } = useRevalidator();
  const navigate = useNavigate();

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
      intermediateName: name,
      newName: name,
      isNew: false,
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
          intermediateName: inputEnvironment.trim(),
          newName: inputEnvironment.trim(),
          isNew: true,
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
          env.id === idToDelete ? { ...env, newName: '' } : env
        )
      );
    } else {
      setEnvironments(environments.filter(env => env.id !== idToDelete));
    }

    setObjectToDelete({ type: "", id: -1 });
  }

  const [inputEnvironment, setInputEnvironment] = useState('');

  const [enabledEnv, envButtonHandlers] = useDisclosure(false);

  useEffect(() => {
    if (inputEnvironment.trim()
      && !environments.some(env => (
        (!editingEnv[env.id] &&
          env.newName === inputEnvironment.trim()) ||
        (editingEnv[env.id] &&
          env.intermediateName === inputEnvironment.trim())))) {
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
        intermediateName: name,
        intermediateKey: key,
        newName: name,
        newKey: key,
        isNew: false,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  };

  const [componentStates, setComponentStates] = useState(() => initializeComponentStates());

  const projectId = componentStates.find(component => component.key === appDetail.key).id;

  const [inputComponentName, setInputComponentName] = useState('');
  const [inputComponentKey, setInputComponentKey] = useState('');

  // state pro button pridavajici komponenty
  const [enabledApp, componentButtonHandlers] = useDisclosure(false);

  useEffect(() => {
    if (inputComponentKey.trim()
      && inputComponentName.trim()
      && !componentStates.some(component=> (
        (!editing[component.id] &&
          component.newKey === inputComponentKey) ||
        (editing[component.id] &&
          component.intermediateKey === inputComponentKey))))
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
          intermediateKey: inputComponentKey.trim(),
          intermediateName: inputComponentName.trim(),
          newKey: inputComponentKey.trim(),
          newName: inputComponentName.trim(),
          isNew: true,
      }]);
      setInputComponentName('');
      setInputComponentKey('');
      document.getElementById('inputComponentName').focus();
    }
  };

  const [objectToDelete, setObjectToDelete] = useState({ type: '', id: -1 });

  useEffect(() => {
    if (objectToDelete.id !== -1) {
      confirmHandlers.open();
    }
  }, [objectToDelete]);

  // odebrani komponenty
  const handleRemoveComponent = (idToDelete) => {
    const foundComponent = componentStates.find(component => component.id === idToDelete);

    if (!foundComponent.isNew) {
      setComponentStates((prev) =>
        prev.map(component =>
          component.id === idToDelete ? { ...component, newKey: '' } : component
        )
      );
    } else {
      setComponentStates(componentStates.filter(component => component.id !== idToDelete));
    }
    setObjectToDelete({ type: "", id: -1 });
  }

  const hasDeploymentComp = (idToCheck) => {
    const foundApp = componentStates.find(component => component.id === idToCheck);

    return !foundApp.isNew && Object.keys(appDetail.componentKeysAndNamesMap).some(ogKey => ogKey === foundApp.key) && appDetail.environmentNames.some(env => latestVersions[foundApp.key][env] !== "-");
  }

  const hasDeploymentEnv = (idToCheck) => {
    const foundEnv = environments.find(env => env.id === idToCheck);

    return !foundEnv.isNew && Object.keys(appDetail.componentKeysAndNamesMap).some(key => latestVersions[key][foundEnv.name] !== "-");
  }

  const handleComponentNameChange = (idToChange, newValue) => {
    setComponentStates((prev) =>
      prev.map(component =>
        component.id === idToChange
          ? idToChange === projectId
            ? { ...component, newName: newValue }
            : { ...component, intermediateName: newValue }
          : component
      )
    );
  };

  const handleComponentKeyChange = (idToChange, newValue) => {
    setComponentStates((prev) =>
      prev.map(component =>
        component.id === idToChange
          ? idToChange === projectId
            ? { ...component, newKey: newValue }
            : { ...component, intermediateKey: newValue }
          : component
      )
    );
  };

  // chovani pro enter a backspace
  const handleKeyDownComp = (event, currentInput, index = -1) => {
    // pokud je stisknut enter a jsme v name inputu, preskocime na key input
    // jinak pokud jsme v key inputu, pokusime se pridat komponentu
    if (index === -1) {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (currentInput === 'inputComponentName') {
          event.preventDefault()
          document.getElementById('inputComponentKey').focus();
        } else if (currentInput === 'inputComponentKey') {
          handleAddComponent();
        }
      } else if (event.key === 'Backspace') {
        if (currentInput === 'inputComponentKey' && !inputComponentKey.trim()) {
          event.preventDefault();
          document.getElementById('inputComponentName').focus();
        }
      }
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (currentInput === 'inputComponentName' + index) {
        event.preventDefault()
        document.getElementById('inputComponentKey' + index).focus();
      } else if (currentInput === 'inputComponentKey' + index
        && getComponentErrorMessage(index) === null) {
        toggleEditing(index, true);
        const focusedElement = document.activeElement;
        if (focusedElement) {
          focusedElement.blur();
        }
      }
    } else if (event.key === 'Backspace') {
      if (currentInput === 'inputComponentKey' + index && !componentStates.find(component => component.id === index)?.intermediateKey.trim()) {
        event.preventDefault();
        document.getElementById('inputComponentName' + index).focus();
      }
    }
  };

  const getComponentErrorMessage = (idToCheck) => {
    const foundComponent = componentStates.find(component => component.id === idToCheck);

    if (foundComponent.intermediateName.trim().length === 0
      || foundComponent.intermediateKey.trim().length === 0) {
      return "Pro přidání komponenty vyplňte název i klíč!"
    } else if (componentStates.some(component=> (
      (!editing[component.id] &&
        component.newKey === foundComponent.intermediateKey.trim()) ||
      (editing[component.id] &&
        component.intermediateKey === foundComponent.intermediateKey.trim()) &&
      component.id !== idToCheck))) {
      return "Klíč komponenty musí být unikátní!"
    }
    return null
  }

  const form = useForm({
    mode: 'uncontrolled',
    validateInputOnBlur: true,
    initialValues: {
      name: appDetail.name,
      key: appDetail.key,
      environments: [],
      components: []
    },

    validate: {
      name: (value) => (value.length === 0 ? 'Název nesmí být prázdný' : null),
      key: (value) => (value.length === 0
        ? 'Klíč nesmí být prázdný'
        : componentStates.some(component=> (
          (!editing[component.id] &&
            component.newKey === componentStates.find(component => component.id === projectId).newKey) ||
          (editing[component.id] &&
            component.intermediateKey === componentStates.find(component => component.id === projectId).newKey))
        && component.id !== projectId)
        ? 'Klíč musí být unikátní' : null),
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

  const [editing, setEditing] = useState({});

  const toggleEditing = (idToToggle, accept = false) => {
    setEditing((prev) => {
      const newEditing = { ...prev, [idToToggle]: !prev[idToToggle] };
      const row = componentStates.find(component => component.id === idToToggle);

      setTimeout(() => {
        const input = document.getElementById(`inputComponentName${idToToggle}`);
        if (newEditing[idToToggle]) {
          input?.focus();
          input?.setSelectionRange(input.value.length, input.value.length);
        } else {
          input?.blur();
        }
      }, 0);

      if (!accept && (row.newKey !== row.intermediateKey || row.newName !== row.intermediateName)) {
        setComponentStates((prev) =>
          prev.map(component =>
            component.id === idToToggle ? { ...component, intermediateName: row.newName, intermediateKey: row.newKey } : component
          )
        );
      } else {
        setComponentStates((prev) =>
          prev.map(component =>
            component.id === idToToggle ? { ...component, newName: row.intermediateName, newKey: row.intermediateKey } : component
          )
        );
      }

      return newEditing;
    });
  };

  const [editingEnv, setEditingEnv] = useState({});

  const toggleEditingEnv = (idToToggle, accept = false) => {
    setEditingEnv((prev) => {
      const newEditing = { ...prev, [idToToggle]: !prev[idToToggle] };
      const row = environments.find(env => env.id === idToToggle);

      setTimeout(() => {
        const input = document.getElementById(`inputEnv${idToToggle}`);
        if (newEditing[idToToggle]) {
          input?.focus();
          input?.setSelectionRange(input.value.length, input.value.length);
        } else {
          input?.blur();
        }
      }, 0);

      if (!accept && (row.newKey !== row.intermediateKey || row.newName !== row.intermediateName)) {
        setEnvironments((prev) =>
          prev.map(env =>
            env.id === idToToggle ? { ...env, intermediateName: row.newName, intermediateKey: row.newKey } : env
          )
        );
      } else {
        setEnvironments((prev) =>
          prev.map(env =>
            env.id === idToToggle ? { ...env, newName: row.intermediateName, newKey: row.intermediateKey } : env
          )
        );
      }

      return newEditing;
    });
  };

  const getEnvErrorMessage = (idToCheck) => {
    const foundEnv = environments.find(env => env.id === idToCheck);

    if (foundEnv.intermediateName.trim().length === 0) {
      return "Pro přidání prostředí vyplňte název!"
    } else if (environments.some(env => (
      (!editing[env.id] &&
        env.newName === foundEnv.intermediateName.trim()) ||
      (editing[env.id] &&
        env.intermediateName === foundEnv.intermediateName.trim())) &&
      env.id !== idToCheck)) {
      return "Název prostředí musí být unikátní!"
    }
    return null
  }

  const handleRemoveProject = async () => {
    const requestOptions = {
      method: 'DELETE',
    };

    try {
      let response = await fetch(`${API_URL}/apps/${appDetail.key}?hard_delete=true`, requestOptions);
      if (!response.ok) {
        const error: ErrorBody = await response.json();
        notifications.show({
          color: "red",
          title: "Při přidávání došlo k chybě!",
          message: error.details,
          position: "top-center",
        });
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
      });
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

    let response

    const projectState = componentStates.find(component => component.id === projectId);

    const appsToRemove = formValues.components.filter(component => component.newKey === '');
    const envsToRemove = formValues.environments.filter(env => env.newName === '');

    const appsToAdd = formValues.components.filter(component => component.isNew);
    const envsToAdd = formValues.environments.filter(env => env.isNew);

    const appsToUpdate = formValues.components.filter(component => component.key !== component.newKey && component.newKey !== '' && !component.isNew && component.id !== projectId);
    const envsToUpdate = formValues.environments.filter(env => env.name !== env.newName && env.newName !== '' && !env.isNew);

    try {
      for (const app of appsToRemove) {
        response = await fetch(`${API_URL}/apps/${app.key}?hard_delete=true`, deleteOptions);
        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: `Při odebírání komponenty ${app.key} došlo k chybě!`,
            message: error.details,
            position: "top-center",
          });
          return;
        }
      }

      for (const env of envsToRemove) {
        response = await fetch(`${API_URL}/apps/${projectState.key}/envs/${env.name}?hard_delete=true`, deleteOptions);
        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: `Při odebírání prostředí ${env.name} došlo k chybě!`,
            message: error.details,
            position: "top-center",
          });
          return;
        }
      }

      if (projectState.key !== projectState.newKey || projectState.name !== projectState.newName) {
        putOptions.body = JSON.stringify({key: projectState.newKey, name: projectState.newName})
        response = await fetch(`${API_URL}/apps/${projectState.key}`, putOptions);
        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: `Při aktualizaci projektu ${projectState.key} došlo k chybě!`,
            message: error.details,
            position: "top-center",
          });
          return;
        }
      }

      for (const app of appsToAdd) {
        postOptions.body = JSON.stringify({ key: app.newKey, name: app.newName, parentKey: projectState.newKey });
        response = await fetch(`${API_URL}/apps`, postOptions);
        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: `Při přidávání komponenty ${app.key} došlo k chybě!`,
            message: error.details,
            position: "top-center",
          });
          return;
        }
      }

      for (const env of envsToAdd) {
        postOptions.body = JSON.stringify({appKey: projectState.newKey, name: env.newName});
        response = await fetch(`${API_URL}/apps/${projectState.newKey}/envs`, postOptions);
        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: `Při aktualizaci prostředí ${env.newName} došlo k chybě!`,
            message: error.details,
            position: "top-center",
          });
          return;
        }
      }

      for (const app of appsToUpdate) {
        putOptions.body = JSON.stringify({ key: app.newKey, name: app.newName, parentKey: projectState.newKey });
        response = await fetch(`${API_URL}/apps/${app.key}`, putOptions);
        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: `Při aktualizaci aplikace ${app.key} došlo k chybě!`,
            message: error.details,
            position: "top-center",
          });
          return;
        }
      }

      for (const env of envsToUpdate) {
        putOptions.body = JSON.stringify({appKey: projectState.newKey, name: env.newName});
        response = await fetch(`${API_URL}/apps/${projectState.newKey}/envs/${env.name}`, putOptions);
        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: `Při aktualizaci prostředí ${env.name} došlo k chybě!`,
            message: error.details,
            position: "top-center",
          });
          return;
        }
      }
      form.reset();
      initializeComponentStates();
      initializeEnvironments();
      await revalidate();
      navigate(`/projects/detail/${projectState.newKey}`);
      close();
    } catch (error) {
      console.error("Caught error: ", error);
      notifications.show({
        color: "red",
        title: "Při mazání projektu došlo k chybě!",
        message: "Nastala neočekávaná chyba.",
        position: "top-center",
      })
    }
  }

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

  const [opened, { open, close }] = useDisclosure(false);
  const [confirmOpened, confirmHandlers] = useDisclosure(false)

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
                ? `projekt ${componentStates.find(component => component.id === projectId).newName}`
                : objectToDelete.type === "env"
                  ? `prostředí ${environments.find(env => env.id === objectToDelete.id)?.intermediateName}`
                  : `komponentu ${componentStates.find(component => component.id === objectToDelete.id)?.intermediateName}`
          }?
          </Title>
      }
        opened={confirmOpened}
        onClose={() => { setTimeout(() => setObjectToDelete({ type: "", id: -1 }), 100); confirmHandlers.close(); }} zIndex={999}
        closeButtonProps={{icon: <IconX color="red"/>, variant: "subtle", color: "gray"}}
      >
        <Text mt="lg">
          Smazáním {objectToDelete.type === "project" ? "projektu" : objectToDelete.type === "env" ? "prostředí" : "komponenty"} budou odstraněna <br/> i všechna související data!
        </Text>
        <Group justify="flex-end" pt="xl">
          <Button variant="light" color="gray" rightSection={<IconX size={16}/>} onClick={() => { setTimeout(() => setObjectToDelete({ type: "", id: -1 }), 100); confirmHandlers.close(); }}>Zrušit akci</Button>
          <Button
            color="red"
            rightSection={<IconTrash size={16}/>}
            onClick={() => {
              confirmHandlers.close();
              setTimeout(() =>
                objectToDelete.type === "project" ?
                  handleRemoveProject() :
                objectToDelete.type === "env" ?
                  handleRemoveEnvironment(objectToDelete.id) :
                  handleRemoveComponent(objectToDelete.id),
                100)
            }}>Smazat</Button>
        </Group>
      </Modal>
      <Modal
        opened={opened}
        size="auto"
        onClose={() => {
          close();
          form.reset();
        }}
        closeButtonProps={{icon: <IconX color="red"/>, variant: "subtle", color: "gray"}}
        title={<Title mb="md" order={2}>Úprava projektu {appDetail.name}</Title>}
        styles={{
          header: {paddingBottom: 0}
        }}
      >
        <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
          <TextInput
            data-autofocus
            withAsterisk
            label="Název"
            placeholder="Zadejte název projektu..."
            value={componentStates.find(component => component.id === projectId).newName}
            onInput={(e) => handleComponentNameChange(projectId, e.target.value)}
            key={form.key('name')}
            {...form.getInputProps('name')}
          />

          <TextInput
            withAsterisk
            label="Klíč"
            placeholder="Zadejte klíč projektu..."
            value={componentStates.find(component => component.id === projectId).newKey.toUpperCase()}
            onInput={(e) => handleComponentKeyChange(projectId, e.target.value.toLowerCase())}
            key={form.key('key')}
            {...form.getInputProps('key')}
          />

          <Title order={3} mb="lg" mt="lg">
            Prostředí
          </Title>

          {environments.filter(env => env.newName !== "").map(environment => (
            <Group key={`envGroup${environment.id}`} mt="md">
              <TextInput
                id={`inputEnv${environment.id}`}
                w={300}
                placeholder="Zadejte název prostředí..."
                splitChars={[' ']}
                acceptValueOnBlur
                clearable
                value={environment.intermediateName.toUpperCase()}
                onInput={(e) => setEnvironments((prev) =>
                  prev.map(env =>
                    env.id === environment.id ? { ...env, intermediateName: e.target.value.toLowerCase() } : env
                  )
                )}
                style={{ minWidth: '300px', pointerEvents: editingEnv[environment.id] ? 'auto' : 'none' }} // Fix: allow interaction when editing
                tabIndex={editingEnv[environment.id] ? 0 : -1} // Fix: allow focus when editing
              />
            {!editingEnv[environment.id] ? (
              <>
                <ActionIcon
                  variant="light"
                  onClick={() => toggleEditingEnv(environment.id, true)}
                  style={{ alignSelf: 'flex-end', marginBottom: '5px' }}
                >
                  <IconPencil size="20" />
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={() => {
                    if (hasDeploymentEnv(environment.id)) {
                      setObjectToDelete({ type: "env", id: environment.id });
                    } else {
                      handleRemoveEnvironment(environment.id);
                    }
                  }}
                  style={{ alignSelf: 'flex-end', marginBottom: '5px' }}
                >
                  <IconTrash size="20" />
                </ActionIcon>
              </>) : (
              <>
                <Tooltip
                  label={getEnvErrorMessage(environment.id)}
                  disabled={getEnvErrorMessage(environment.id) === null}
                >
                  <ActionIcon
                    disabled={getEnvErrorMessage(environment.id) !== null}
                    onClick={() => toggleEditingEnv(environment.id, true)}
                    style={{ alignSelf: 'flex-end', marginBottom: '5px' }}
                  >
                    <IconCheck size="20" />
                  </ActionIcon>
                </Tooltip>
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={() => {
                    toggleEditingEnv(environment.id);
                  }}
                  style={{ alignSelf: 'flex-end', marginBottom: '5px' }}
                >
                  <IconX size="20" />
                </ActionIcon>
              </>)}
            </Group>
          ))}
          <Group mt="md">
            <TextInput
              id={"inputEnv"}
              w={300}
              placeholder="Zadejte název prostředí..."
              splitChars={[' ']}
              acceptValueOnBlur
              clearable
              value={inputEnvironment.toUpperCase()}
              onInput={(e) => {setInputEnvironment(e.target.value.toLowerCase());}}
              key={form.key('environments')}
            />
            <Tooltip label={environments.some(env => env.newName === inputEnvironment.trim()) ? "Název prostředí musí být unikátní!" : "Pro přidání prostředí vyplňte název!"} disabled={enabledEnv}>
              <ActionIcon
                disabled={!enabledEnv}
                variant="light"
                color="green"
                onClick={handleAddEnvironment}
                style={{ alignSelf: 'flex-end', marginBottom: '5px' }}
              >
                <IconPlus size="20" />
              </ActionIcon>
            </Tooltip>
            <ActionIcon
              disabled
              style={{ alignSelf: 'flex-end', marginBottom: '5px', visibility: "hidden" }}
            >
              <IconPlus size="20" />
            </ActionIcon>
          </Group>


          <Title order={3} mb="lg" mt="lg">
            Projektové komponenty
          </Title>

          {componentStates.filter(component => component.newKey !== "" && component.key !== appDetail.key).map((row, index) => (
              <Group
                mt="md"
                key={row.id}
                style={{ flexDirection: 'row', justifyContent: 'space-between'}}
              >
                <TextInput
                  id={`inputComponentName${row.id}`}
                  label={componentStates.length > 0 && index === 0 ? "Název" : ""}
                  readOnly={!editing[row.id]} // Fix: should be false when editing
                  placeholder="Zadejte název komponenty..."
                  value={row.intermediateName}
                  onInput={(e) => handleComponentNameChange(row.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDownComp(e, `inputComponentName${row.id}`, row.id)}
                  style={{ minWidth: '300px', pointerEvents: editing[row.id] ? 'auto' : 'none' }} // Fix: allow interaction when editing
                  tabIndex={editing[row.id] ? 0 : -1} // Fix: allow focus when editing
                />
                <TextInput
                  id={`inputComponentKey${row.id}`}
                  label={ componentStates.length > 0 && index === 0 ? "Klíč" : "" }
                  readOnly={!editing[row.id]}
                  placeholder="Zadejte klíč komponenty..."
                  value={row.intermediateKey.toUpperCase()}
                  onInput={(e) => handleComponentKeyChange(row.id, e.target.value.toLowerCase())}
                  onKeyDown={(e) => handleKeyDownComp(e, `inputComponentKey${row.id}`, row.id)}
                  style={{ minWidth: '300px', pointerEvents: editing[row.id] ? 'auto' : 'none' }} // Fix: allow interaction when editing
                  tabIndex={editing[row.id] ? 0 : -1} // Fix: allow focus when editing
                />
                {!editing[row.id] ? (
                  <>
                    <ActionIcon
                      variant="light"
                      onClick={() => toggleEditing(row.id, true)}
                      style={{ alignSelf: 'flex-end', marginBottom: '5px' }}
                    >
                      <IconPencil size="20" />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => {
                        if (hasDeploymentComp(row.id)) {
                          setObjectToDelete({ type: "app", id: row.id });
                        } else {
                          handleRemoveComponent(row.id);
                        }
                      }}
                      style={{ alignSelf: 'flex-end', marginBottom: '5px' }}
                    >
                      <IconTrash size="20" />
                    </ActionIcon>
                  </>) : (
                  <>
                    <Tooltip
                      label={getComponentErrorMessage(row.id)}
                      disabled={getComponentErrorMessage(row.id) === null}
                    >
                      <ActionIcon
                        disabled={getComponentErrorMessage(row.id) !== null}
                        onClick={() => toggleEditing(row.id, true)}
                        style={{ alignSelf: 'flex-end', marginBottom: '5px' }}
                      >
                        <IconCheck size="20" />
                      </ActionIcon>
                    </Tooltip>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => {
                        toggleEditing(row.id);
                      }}
                      style={{ alignSelf: 'flex-end', marginBottom: '5px' }}
                    >
                      <IconX size="20" />
                    </ActionIcon>
                  </>)}
              </Group>)
            )}

          <Group style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: "flex-start" }} mt="sm">
            <TextInput
              id='inputComponentName'
              label={ componentStates.length === 0 ? "Název" : "" }
              placeholder="Zadejte název komponenty..."
              value={inputComponentName}
              style={{ minWidth: '300px'}}
              onInput={(e) => {setInputComponentName(e.target.value);}}
              onKeyDown={(e) => handleKeyDownComp(e, 'inputComponentName')} // Add row on Enter key
            />
            <TextInput
              id='inputComponentKey'
              label={ componentStates.length === 0 ? "Klíč" : "" }
              placeholder="Zadejte klíč komponenty..."
              value={inputComponentKey.toUpperCase()}
              style={{ minWidth: '300px' }}
              onInput={(e) => {setInputComponentKey(e.target.value.toLowerCase());}}
              onKeyDown={(e) => handleKeyDownComp(e, 'inputComponentKey')}
            />
            <Tooltip label={componentStates.some(component => component.newKey === inputComponentKey.trim()) ? "Klíč komponenty musí být unikátní!" : "Pro přidání komponenty vyplňte název i klíč!"} disabled={enabledApp}>
              <ActionIcon
                disabled={!enabledApp}
                variant="light"
                color="green"
                onClick={handleAddComponent}
                style={{ alignSelf: 'flex-end', marginBottom: '5px' }}
              >
                <IconPlus size="20" />
              </ActionIcon>
            </Tooltip>
            <ActionIcon
              disabled
              style={{ alignSelf: 'flex-end', marginBottom: '5px', visibility: "hidden" }}
            >
              <IconPlus size="20" />
            </ActionIcon>
          </Group>
          <Group justify="flex-end" pt="xl">
            <Button variant="light" color="red" rightSection={<IconX size={16}/>}>Zahodit změny</Button>
            <Button type="submit" rightSection={<IconCheck size={16}/>}>Uložit</Button>
          </Group>
        </form>
      </Modal>
      <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
        <Group mr="2px" justify="space-between">
          <Button
            variant="outline"
            size="md"
            leftSection={<IconArrowBackUp size={16}/>}
            component={Link}
            to="/projects"
          >
            Zpět na přehled
          </Button>
          <Group style={{alignSelf: "flex-end"}}>
            <Button
              size="md"
              rightSection={<IconRocket size={16}/>}
              disabled
            >
              Nasadit
            </Button>
            <Button
              size="md"
              rightSection={<IconPencil size={16}/>}
              onClick={open}
            >
              Upravit
            </Button>
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
              <Title
                style={{color: "green"}}
              >
                Detail projektu {appDetail.name}
              </Title>
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
                  <Title
                    style={{color: "green"}}
                    order={2}
                  >
                    Verze komponent
                  </Title>
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
              </Card>) : null
            }
          </Stack>
        </ContentContainer>
      </div>
    </>
  );
}
