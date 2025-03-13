import { LoaderFunction } from "react-router";
import ProjectCard from "~/components/project-card"
import {ProjectOverviewDto, AppDto, ErrorBody} from "~/types";
import {useLoaderData, useRevalidator} from "react-router";
import {Button, Grid, Group, TextInput, Modal, Title, ActionIcon, TagsInput, Tooltip, Loader} from "@mantine/core";
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import {IconPlus, IconCheck, IconX, IconTrash} from "@tabler/icons-react";
import ContentContainer from "~/components/content-container";
import {isNotEmpty, useForm} from '@mantine/form';
import {useEffect, useState} from "react";
import {API_URL} from "~/constants"

export let loader: LoaderFunction = async () => {
  const response = await fetch(`${API_URL}/apps`);
  const projects: ProjectOverviewDto[] = await response.json();
  return projects;
};

export default function Projects() {
  // fetchnute prehledy o projektech
  const overviews = useLoaderData<ProjectOverviewDto[]>();
  const { revalidate } = useRevalidator();

  // state modalu pro pridani noveho projektu
  const [opened, { open, close }] = useDisclosure(false);

  // form values, validace a transformace
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      key: '',
      environments: [],
      components: []
    },

    validate: {
      name: isNotEmpty('Název nesmí být prázdný'),
      key: isNotEmpty('Klíč nesmí být prázdný'),
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

  // komponenty z TextInputu ve formu
  const [components, setComponents] = useState([]);
  const [inputComponentName, setInputComponentName] = useState('');
  const [inputComponentKey, setInputComponentKey] = useState('');

  // state pro button pridavajici komponenty
  const [enabled, handlers] = useDisclosure(false);

  useEffect(() => {
    if (inputComponentKey.trim()
      && inputComponentName.trim()
      && !components.some(component => component.key === inputComponentKey.trim())) {
      handlers.open();
    } else {
      handlers.close();
    }
  }, [inputComponentKey, inputComponentName]);

  // pridani komponenty
  const handleAddComponent = () => {
    if (inputComponentKey.trim() && inputComponentName.trim()) {
      setComponents([...components, { key: inputComponentKey.trim()
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
            key={form.key('name')}
            {...form.getInputProps('name')}
          />

          <TextInput
            withAsterisk
            label="Klíč"
            placeholder="Zadejte klíč projektu..."
            key={form.key('key')}
            {...form.getInputProps('key')}
          />
          <TagsInput
            label="Prostředí"
            placeholder="Zadejte název prostředí..."
            splitChars={[' ']}
            data={[ {group: 'Nejčastější názvy prostředí', items: ['MPSVPROD', 'MPSVTEST', 'OKTEST']}]}
            acceptValueOnBlur
            clearable
            value={environments}
            onChange={setEnvironments}
            key={form.key('environments')}
          />

          <Title order={3} mb="lg" mt="lg">
            Projektové komponenty
          </Title>

          {components.map((row, index) => (
            <Group
              mt="md"
              key={index}
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <TextInput
                id={`inputComponentName${index}`}
                label={ components.length > 0 && index === 0 ? "Název" : "" }
                readOnly={true}
                placeholder={`Název komponenty ${index}`}
                value={row.name}
                style={{ minWidth: '300px', pointerEvents: 'none', outline: 'none', boxShadow: 'none', borderColor: 'transparent' }}
                tabIndex={-1}
              />
              <TextInput
                id={`inputComponentKey${index}`}
                label={ components.length > 0 && index === 0 ? "Klíč" : "" }
                readOnly={true}
                placeholder={`Klíč komponenty ${index}`}
                value={row.key}
                style={{ minWidth: '300px', pointerEvents: 'none', outline: 'none', boxShadow: 'none', borderColor: 'transparent' }}
                tabIndex={-1}
              />
              <ActionIcon
                color="red"
                variant="light"
                onClick={() => handleRemoveComponent(index)}
                style={{ alignSelf: 'flex-end', marginBottom: '5px' }}
              >
                <IconTrash size="20"/>
              </ActionIcon>
            </Group>
          ))}
          <Group style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: "flex-start" }} mt="sm">
            <TextInput
              id='inputComponentName'
              label={ components.length === 0 ? "Název" : "" }
              placeholder="Zadejte název komponenty..."
              value={inputComponentName}
              style={{ minWidth: '300px'}}
              onInput={(e) => {setInputComponentName(e.target.value);}}
              onKeyDown={(e) => handleKeyDownComp(e, 'inputComponentName')} // Add row on Enter key
            />
            <TextInput
              id='inputComponentKey'
              label={ components.length === 0 ? "Klíč" : "" }
              placeholder="Zadejte klíč komponenty..."
              value={inputComponentKey}
              style={{ minWidth: '300px' }}
              onInput={(e) => {setInputComponentKey(e.target.value);}}
              onKeyDown={(e) => handleKeyDownComp(e, 'inputComponentKey')}
            />
            <Tooltip label={components.some(component => component.key === inputComponentKey.trim()) ? "Klíč komponenty musí být unikátní!" : "Pro přidání komponenty vyplňte název i klíč!"} disabled={enabled}>
              <ActionIcon
                style={{ alignSelf: 'flex-end', marginBottom: '5px' }}
                disabled={!enabled}
                variant="light"
                color="green"
                onClick={handleAddComponent}
              >
                <IconPlus size="20" />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Group justify="flex-end" mt="md">
            <Button type="submit" rightSection={<IconCheck size={16}/>}>Přidat</Button>
          </Group>
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
