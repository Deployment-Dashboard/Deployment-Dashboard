import { LoaderFunction } from "react-router";
import ProjectCard from "~/components/project-card"
import {ProjectOverviewDto, AppDto, ErrorBody} from "~/types";
import {useLoaderData, useRevalidator} from "react-router";
import {
  Button,
  Grid,
  Group,
  TextInput,
  Modal,
  Title,
  ActionIcon,
  TagsInput,
  Tooltip,
  Loader,
  ScrollArea, Fieldset, Flex, Indicator, Paper, TagsInputProps
} from "@mantine/core";
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import {IconPlus, IconCheck, IconX, IconTrash, IconHistory, IconInfoCircle} from "@tabler/icons-react";
import ContentContainer from "~/components/content-container";
import {isNotEmpty, useForm} from '@mantine/form';
import {useEffect, useRef, useState} from "react";
import {API_URL} from "~/constants"

export let loader: LoaderFunction = async () => {
  const response = await fetch(`${API_URL}/apps`);
  const projects: ProjectOverviewDto[] = await response.json();
  return projects;
};

export default function Projects() {
  const collator = new Intl.Collator(undefined, { sensitivity: "base" });

  const equalsCaseInsensitive = (str1: string, str2: string) => {
    return collator.compare(str1.trim(), str2.trim()) === 0;
  }

  // fetchnute prehledy o projektech
  const overviews = useLoaderData<ProjectOverviewDto[]>();
  const { revalidate } = useRevalidator();

  // state modalu pro pridani noveho projektu
  const [opened, { open, close }] = useDisclosure(false);

  // form values, validace a transformace
  const form = useForm({
    mode: 'uncontrolled',
    validateInputOnChange: true,
    initialValues: {
      name: '',
      key: '',
      environments: [],
      components: []
    },

    validate: {
      name: (value) => (value.length === 0 ? 'Název projektu nesmí být prázdný.' : null),
      key: (value) => (value.length === 0
        ? 'Klíč projektu nesmí být prázdný.'
        : components.some(component => (
          equalsCaseInsensitive(component.key, project.key)
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
      components: components,
    }),
  });

  // tagy prostredi z TagsInput ve formu
  const [environments, setEnvironments] = useState<string[]>([]);

  const handleEnvironmentsChange = (newValues: string[]) => {
    const unique = Array.from(new Set(newValues.map(v => v.toLowerCase())));
    setEnvironments(unique);
  };


  const commonEnvsGroup = [{group: 'Nejčastější názvy prostředí', items: ['mpsvprod', 'mpsvtest', 'oktest']}]

  const renderTagsInputOption: TagsInputProps['renderOption'] = ({ option }) => (
    option.value.toUpperCase()
  )

  const appIdCounter = useRef(0);

  const [project, setProject] = useState({key: "", name: ""});

  // komponenty z TextInputu ve formu
  const [components, setComponents] = useState([]);
  const [inputComponentName, setInputComponentName] = useState('');
  const [inputComponentKey, setInputComponentKey] = useState('');

  // state pro button pridavajici komponenty
  const [enabled, handlers] = useDisclosure(false);

  useEffect(() => {
    if (inputComponentKey.trim()
      && inputComponentName.trim()
      && !components.some(component=> equalsCaseInsensitive(component.key, inputComponentKey)))
    {
      handlers.open();
    } else {
      handlers.close();
    }
  }, [inputComponentKey, inputComponentName, components]);

  // pridani komponenty
  const handleAddComponent = () => {
    if (inputComponentKey.trim() && inputComponentName.trim()) {
      setComponents([...components, { id: appIdCounter.current++, key: inputComponentKey.trim()
        , name: inputComponentName.trim() }]);
      setInputComponentName('');
      setInputComponentKey('');
      document.getElementById('inputComponentName').focus();
    }
  };

  // odebrani komponenty
  const handleRemoveComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  }

  const handleComponentNameChange = (idToChange, newValue) => {
    setComponents((prev) =>
      prev.map(component =>
        component.id === idToChange
          ? { ...component, newName: newValue }
          : component
      )
    );
  };

  const handleComponentKeyChange = (idToChange, newValue) => {
    setComponents((prev) =>
      prev.map(component =>
        component.id === idToChange
          ? { ...component, key: newValue }
          : component
      )
    );
  };

  const getCompErrorMessage = (idToCheck) => {
    const foundComp = components.find(comp => comp.id === idToCheck);

    if (!foundComp.key.trim()) {
      return "Klíč komponenty nesmí být prázdný."
    } else if (equalsCaseInsensitive(foundComp.key, project.key)) {
      return "Klíč komponenty je stejný jako klíč projektu."
    } else if (components.some(comp =>
      equalsCaseInsensitive(comp.key, foundComp.key.trim())
      && comp.id !== idToCheck
    )) {
      return "Klíč komponenty musí být unikátní."
    }
    return null
  }

  // chovani pro enter a backspace
  const handleKeyDownComp = (event, currentInput) => {
    // pokud je stisknut enter a jsme v name inputu, preskocime na key input
    // jinak pokud jsme v key inputu, pokusime se pridat komponentu
    if (event.key === 'Enter') {
      event.preventDefault();
      if (currentInput === 'inputComponentName') {
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
  };

  const handleSubmit = async (formValues) => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formValues.app),
    };

    try {
      // Step 1: Add project
      let response = await fetch(`${API_URL}/apps`, requestOptions);
      if (!response.ok) {
        const error: ErrorBody = await response.json();
        notifications.show({
          color: "red",
          title: "Při přidávání došlo k chybě!",
          message: error.details,
          position: "top-center",
        });
        if (response.status === 409) {
          form.setErrors({ key: 'Klíč již je v evidenci' });
        }
        return;
      }

      for (const environment of formValues.environments) {
        requestOptions.body = JSON.stringify({appKey: formValues.key, name: environment.valueOf()});
        response = await fetch(`${API_URL}/apps/${formValues.key}/envs`, requestOptions);
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
      }

      for (const component of formValues.components) {
        requestOptions.body = JSON.stringify({ key: component.key, name: component.name, parentKey: formValues.key });
        response = await fetch(`${API_URL}/apps`, requestOptions);
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
      }
      notifications.show({
        title: "Úspěch!",
        message: `Projekt ${formValues.name} přidán do evidence`,
        position: "top-center",
      })
      form.reset();
      setEnvironments([]);
      setComponents([]);
      await revalidate();
      close();
    } catch (error) {
      console.error("Caught error: ", error);
      notifications.show({
        color: "red",
        title: "Při přidávání došlo k chybě!",
        message: "Nastala neočekávaná chyba",
        position: "top-center",
      });
    }

    useEffect(() => {
      form.setFieldValue('name', project.name);
      form.setFieldValue('key', project.key);
      form.validate();
    }, [project]);

    useEffect(() => {
      form.validate();
    }, [components]);
  };


  return (
    <>
      <Modal
        size="auto"
        opened={opened}
        onClose={() => {
          close();
          form.reset();
          setEnvironments([]);
          setComponents([]);
          setInputComponentKey('');
          setInputComponentName('');
        }}
        closeButtonProps={{icon: <IconX color="red"/>, variant: "subtle", color: "gray"}}
        title={<Title mb="md" order={2}>Přidání nového projektu do evidence</Title>}
        scrollAreaComponent={ScrollArea.Autosize}
        styles={{
          header: {paddingBottom: 8},
          body: {paddingBottom: 0}
        }}
      >
        <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
          <div style={{paddingLeft: 8, paddingRight: 8}}>
            <Fieldset pb="35">
              <Flex align="flex-start" direction="row" gap="md" h={55}>
                <TextInput
                  w={322}
                  data-autofocus
                  withAsterisk
                  label="Název"
                  placeholder="Zadejte název projektu..."
                  value={project.name}
                  onInput={(e) => setProject((prev) => ({...prev, name: e.target.value}))}
                  key={form.key('name')}
                  {...form.getInputProps('name')}
                />
                <TextInput
                  w={322}
                  withAsterisk
                  label="Klíč"
                  placeholder="Zadejte klíč projektu..."
                  value={project.key.toUpperCase()}
                  onInput={(e) => setProject((prev) => ({...prev, key: e.target.value}))}
                  key={form.key('key')}
                  {...form.getInputProps('key')}
                />
              </Flex>
            </Fieldset>
            <Fieldset w="100%" mt="lg" legend={
              <Title order={3}>
                Prostředí
              </Title>}
            >
            <TagsInput
              placeholder="Zadejte název prostředí..."
              splitChars={[' ']}
              data={commonEnvsGroup}
              acceptValueOnBlur
              clearable
              renderOption={renderTagsInputOption}
              value={environments}
              onChange={handleEnvironmentsChange}
              styles={{
                pill: { textTransform: "upperCase" }
              }}
              key={form.key('environments')}
            />
            </Fieldset>

            <Fieldset mt="lg" pb="35" mb="8" legend={
              <Title order={3} >
                Projektové komponenty
              </Title>}
            >
              <Flex align="flex-start" direction="column" gap="md">
                {components.map((row, index) => (
                  <Group align="flex-start" key={row.id} h={index === 0 ? 75 : 50}>
                    <TextInput
                      id={`inputComponentName${row.id}`}
                      w="300"
                      label={components.length > 0 && index === 0 ? "Název" : ""}
                      placeholder="Zadejte název komponenty..."
                      value={row.name}
                      onInput={(e) => handleComponentNameChange(row.id, e.target.value)}
                      //                  onKeyDown={(e) => handleKeyDownComp(e, `inputComponentName${row.id}`, row.id)}
                      error={!row.name.trim() ? "Název nesmí být prázdný." : null}
                    />
                    <TextInput
                      id={`inputComponentKey${row.id}`}
                      w="300"
                      label={ components.length > 0 && index === 0 ? "Klíč" : "" }
                      placeholder="Zadejte klíč komponenty..."
                      value={row.key.toUpperCase()}
                      onInput={(e) => handleComponentKeyChange(row.id, e.target.value.toLowerCase())}
                      //                onKeyDown={(e) => handleKeyDownComp(e, `inputComponentKey${row.id}`, row.id)}
                      error={getCompErrorMessage(row.id)}
                    />
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
                  //          onKeyDown={(e) => handleKeyDownComp(e, 'inputComponentName')} // Add row on Enter key
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
                  //          onKeyDown={(e) => handleKeyDownComp(e, 'inputComponentKey')}
                  description={components.some(component =>
                    equalsCaseInsensitive(component.key, inputComponentKey.trim()))
                    ? equalsCaseInsensitive(project.key, inputComponentKey)
                      ? <Group gap={"6"} c={"yellow"}><IconInfoCircle size={16}/>Klíč komponenty je stejný jako klíč projektu.</Group>
                      : <Group gap={"6"} c={"yellow"}><IconInfoCircle size={16}/>Komponenta s tímto klíčem už je evidována.</Group>
                    : null
                  }
                />
                <Tooltip
                  label={"Pro přidání komponenty vyplňte název i klíč."}
                  disabled={inputComponentKey.trim().length !== 0 && inputComponentName.trim().length !== 0}
                >
                  <ActionIcon
                    disabled={!enabled}
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
              <Button type="submit" rightSection={<IconCheck size={16}/>}>Přidat</Button>
            </Group>
          </Paper>
        </form>
      </Modal>

      <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
        <Group style={{alignSelf: "flex-end"}}>
          <Button
            mr="2px"
            size="md"
            leftSection={<IconPlus size={16}/>}
            component="a"
            onClick={open}
          >
            Nový projekt
          </Button>
        </Group>

        <ContentContainer>
          <Grid align="stretch" gutter="lg">
            {overviews.map((overview) => (
              <Grid.Col key={overview.key} span="content">
                <ProjectCard data={overview}/>
              </Grid.Col>
            ))}
          </Grid>
        </ContentContainer>
      </div>
    </>
);
}
