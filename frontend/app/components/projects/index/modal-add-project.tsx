import {
  ActionIcon,
  Button,
  Fieldset,
  Flex,
  Group, Modal,
  Paper,
  ScrollArea,
  TagsInput, TagsInputProps,
  TextInput,
  Title,
  Tooltip
} from "@mantine/core";
import {IconCheck, IconInfoCircle, IconPlus, IconX} from "@tabler/icons-react";
import {useForm} from "@mantine/form";
import {useEffect, useRef, useState} from "react";
import {API_URL} from "~/constants";
import {ErrorBody} from "~/types";
import {NotificationData, notifications} from "@mantine/notifications";
import {useDisclosure} from "@mantine/hooks";
import {equalsCaseInsensitive} from "~/util-methods";
import {useRevalidator} from "react-router";

//
// Modal pro přidání projektu na domovské stránce
//

export default function ModalAddProject({opened: opened, onClose: onClose}) {

  //
  // DATA
  //

  // projekt
  const [project, setProject] = useState({key: "", name: ""});

  // komponenty
  const [components, setComponents] = useState([]);
  const [inputComponentName, setInputComponentName] = useState('');
  const [inputComponentKey, setInputComponentKey] = useState('');

  // prostředí
  const [environments, setEnvironments] = useState<string[]>([]);
  const [tagsInputSearchValue, setTagsInputSearchValue] = useState<string>('');

  // prostředí pro našeptávání v TagsInput
  const commonEnvsGroup = [
    {group: 'Nejčastější názvy prostředí', items: ['mpsvprod', 'mpsvtest', 'oktest']}
  ]

  // počítadlo počítadlo přidávaných komponent
  const appIdCounter = useRef(0);

  // state pro button přidávající komponenty
  const [additionState, setAdditionState] = useState(
    {
      disabled: true,
      reason: "Pro přidání komponenty vyplňte název i klíč."}
  );

  //
  // DATA/STATE HANDLING & SUBMIT
  //

  // přidání komponenty
  const handleAddComponent = () => {
    if (inputComponentKey.trim() && inputComponentName.trim()) {
      setComponents([
        ...components,
          { id: appIdCounter.current++,
            key: inputComponentKey.trim(),
            name: inputComponentName.trim()
          }
        ]);
      setInputComponentName('');
      setInputComponentKey('');
      document.getElementById('inputComponentName').focus();
    }
  };

  // odebrání komponenty
  const handleRemoveComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  }

  // změna jména komponenty
  const handleComponentNameChange = (idToChange, newValue) => {
    setComponents((prev) =>
      prev.map(component =>
        component.id === idToChange
          ? { ...component, newName: newValue }
          : component
      )
    );
  };

  // změna klíče komponenty
  const handleComponentKeyChange = (idToChange, newValue) => {
    setComponents((prev) =>
      prev.map(component =>
        component.id === idToChange
          ? { ...component, key: newValue }
          : component
      )
    );
  };

  // změna textu v TagsInput
  const handleEnvironmentsSearchChange = (search) => {
    setTagsInputSearchValue(search)
  }

  // změna pole prostředí
  const handleEnvironmentsOnChange = (newValues: string[]) => {
    const unique = Array.from(new Set(newValues.map(v => v.toLowerCase())));
    setEnvironments(unique);
  };
  const handleEnvironmentsOnBlur = (newValues: string[]) => {
    setTagsInputSearchValue('')
  }

  // odeslání formuláře
  const handleSubmit = async (formValues) => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formValues.app),
    };

    try {
      // přidání projektu
      let response = await fetch(`${API_URL}/apps`, requestOptions);
      if (!response.ok) {
        const error: ErrorBody = await response.json();
        notifications.show({
          color: "red",
          title: "Při přidávání došlo k chybě!",
          message: error.details,
          position: "top-center",
        } as NotificationData);
        if (response.status === 409) {
          form.setErrors({ key: 'Klíč již je v evidenci' });
        }
        return;
      }

      // prostředí
      for (const environment of formValues.environments) {
        requestOptions.body = JSON.stringify({
          appKey: formValues.key,
          name: environment.valueOf()
        });

        response = await fetch(`${API_URL}/apps/${formValues.key}/envs`, requestOptions);

        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: "Při přidávání došlo k chybě!",
            message: error.details,
            position: "top-center",
          } as NotificationData);
          return;
        }
      }

      // komponenty
      for (const component of formValues.components) {
        requestOptions.body = JSON.stringify({
          key: component.key,
          name: component.name,
          parentKey: formValues.key
        });

        response = await fetch(`${API_URL}/apps`, requestOptions);

        if (!response.ok) {
          const error: ErrorBody = await response.json();
          notifications.show({
            color: "red",
            title: "Při přidávání došlo k chybě!",
            message: error.details,
            position: "top-center",
          } as NotificationData);
          return;
        }
      }
      notifications.show({
        title: "Úspěch!",
        message: `Projekt ${formValues.name} přidán do evidence`,
        position: "top-center",
      })

      // obnovení formuláře, refresh stránky
      form.reset();
      setEnvironments([]);
      setComponents([]);

      await revalidate();
      onClose();
    } catch (error) {
      console.error("Caught error: ", error);
      notifications.show({
        color: "red",
        title: "Při přidávání došlo k chybě!",
        message: "Nastala neočekávaná chyba",
        position: "top-center",
      } as NotificationData);
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

  const form = useForm({
    mode: 'uncontrolled',
    validateInputOnChange: true,
    initialValues: {
      name: '',
      key: '',
      environments: [],
      components: []
    },

    // validace hodnot ve formuláři
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

  //
  // POMOCNÉ METODY
  //

  // znovuzavolání loaderu
  const { revalidate } = useRevalidator();

  // získání chybové hlášky pro TextInputs komponenty
  const getComponentErrorMessage = (idToCheck) => {
    const foundComp = components.find(comp => comp.id === idToCheck);

    if (!foundComp.key.trim()) {
      return "Klíč komponenty nesmí být prázdný."
    } else if (equalsCaseInsensitive(foundComp.key, project.key)) {
      return "Klíč komponenty je stejný jako klíč projektu."
    } else if (foundComp.key.trim() &&
      components.some(comp =>
        equalsCaseInsensitive(comp.key, foundComp.key.trim()) &&
        comp.id !== idToCheck
    )) {
      return "Klíč komponenty musí být unikátní."
    }
    return null
  }

  // úprava zobrazení možností v TagsInput
  const renderTagsInputOption: TagsInputProps['renderOption'] = ({ option }) => (
    option.value.toUpperCase()
  )

  //
  // USE EFFECTS
  //

  // kontrola, zda povolit tlačítko pro přidání komponenty
  useEffect(() => {
    if (!inputComponentKey.trim() || inputComponentName.trim()) {
      setAdditionState({disabled: true, reason: "Pro přidání komponenty vyplňte název i klíč."});
    } else {
      handlers.close();
    }
  }, [inputComponentKey, inputComponentName, components]);

  return (
    <Modal
      size="auto"
      opened={opened}
      onClose={() => {
        onClose();
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
    <form
      onKeyDown={(e) => {if (e.key === 'Enter') e.preventDefault();}}
      onSubmit={form.onSubmit((values) => handleSubmit(values))}
    >
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
              id="inputProjectKey"
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
            id='tagsInputEnvironments'
            placeholder="Zadejte název prostředí..."
            splitChars={[' ']}
            data={commonEnvsGroup}
            allowDuplicates={true}
            acceptValueOnBlur={false}
            clearable
            searchValue={tagsInputSearchValue}
            renderOption={renderTagsInputOption}
            value={environments}
            onSearchChange={handleEnvironmentsSearchChange}
            onChange={handleEnvironmentsOnChange}
            onBlur={handleEnvironmentsOnBlur}
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
                  error={!row.name.trim() ? "Název nesmí být prázdný." : null}
                />
                <TextInput
                  id={`inputComponentKey${row.id}`}
                  w="300"
                  label={ components.length > 0 && index === 0 ? "Klíč" : "" }
                  placeholder="Zadejte klíč komponenty..."
                  value={row.key.toUpperCase()}
                  onInput={(e) => handleComponentKeyChange(row.id, e.target.value.toLowerCase())}
                  error={getComponentErrorMessage(row.id)}
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
            />
            <Tooltip
              label={additionState.reason}
              disabled={!additionState.disabled}
            >
              <ActionIcon
                disabled={additionState.disabled}
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
  );
}
