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
import {IconCheck, IconInfoCircle, IconMinus, IconPlus, IconX} from "@tabler/icons-react";
import {useForm} from "@mantine/form";
import {useEffect, useRef, useState} from "react";
import {BROWSER_API_URL} from "~/constants";
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
    const handleRemoveComponent = (componentId) => {
      setComponents(components.filter(component => component.id !== componentId));
    }

  // změna jména komponenty
  const handleComponentNameChange = (idToChange, newValue) => {
    setComponents((prev) =>
      prev.map(component =>
        component.id === idToChange
          ? { ...component, name: newValue }
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
      let response = await fetch(`${BROWSER_API_URL}/apps`, requestOptions);
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

        response = await fetch(`${BROWSER_API_URL}/apps/${formValues.key}/envs`, requestOptions);

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
          key: component.key.toLowerCase(),
          name: component.name,
          parentKey: formValues.key
        });

        response = await fetch(`${BROWSER_API_URL}/apps`, requestOptions);

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
      onClose();
      form.reset();
      setProject({key: "", name: ""})
      setEnvironments([]);
      setComponents([]);

      await revalidate();
    } catch (error) {
      console.error("Caught error: ", error);
      notifications.show({
        color: "red",
        title: "Při přidávání došlo k chybě!",
        message: "Nastala neočekávaná chyba",
        position: "top-center",
      } as NotificationData);
    }
  };

  // formulář
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
          equalsCaseInsensitive(component.key, value)
        ))
          ? 'Klíč projektu je stejný jako klíč některé z komponent.' : null),
    },

    // transformace hodnot před submit
    transformValues: (values) => ({
      key: values.key.toLowerCase(),
      name: values.name,
      app: values.AppDto = {
        key: values.key.toLowerCase(),
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
    const currentProjectKey = form.getValues().key;

    if (!foundComp.key.trim()) {
      return "Klíč komponenty nesmí být prázdný."
    } else if (equalsCaseInsensitive(foundComp.key, currentProjectKey)) {
      form.validateField('key')
      return "Klíč komponenty je stejný jako klíč projektu."
    } else if (components.some(comp =>
      equalsCaseInsensitive(comp.key, foundComp.key) &&
      comp.id !== idToCheck)) {
      return "Klíč komponenty musí být unikátní."
    }
    if (form.getValues().key.trim()) {
      form.validateField('key')
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
    const currentProjectKey = form.getValues().key;

    if (!inputComponentKey.trim() || !inputComponentName.trim()) {
      setAdditionState({disabled: true, reason: "Pro přidání komponenty vyplňte název i klíč."});
    } else if (equalsCaseInsensitive(inputComponentKey, currentProjectKey)
      || (components.some(component => equalsCaseInsensitive(component.key, inputComponentKey)))) {
      setAdditionState({disabled: true, reason: ""})
    } else {
      setAdditionState({disabled: false, reason: ""});
    }
  }, [inputComponentKey, inputComponentName, components, form.getValues().key]);

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
              onInput={(e) => setProject((prev) => ({...prev, name: e.target.value}))}
              key={form.key('name')}
              {...form.getInputProps('name')}
            />
            <TextInput
              styles={{
                input: { textTransform: project.key ? "uppercase" : "initial" }
              }}
              id="inputProjectKey"
              w={322}
              withAsterisk
              label="Klíč"
              placeholder="Zadejte klíč projektu..."
              onInput={(e) => {
                const newKey = e.target.value;
                setProject((prev) => ({...prev, key: newKey}));
              }}
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
            style={{maxWidth: "660px"}}
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
              pill: { textTransform: "uppercase" }
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
                  styles={{
                    input: { textTransform: row.key ? "uppercase" : "initial" }
                  }}
                  id={`inputComponentKey${row.id}`}
                  w="300"
                  label={ components.length > 0 && index === 0 ? "Klíč" : "" }
                  placeholder="Zadejte klíč komponenty..."
                  value={row.key}
                  onInput={(e) => handleComponentKeyChange(row.id, e.target.value)}
                  error={getComponentErrorMessage(row.id)}
                />
                <ActionIcon
                  variant="light"
                  color="red"
                  mt={index === 0 ? 30 : 2}
                  onClick={() => handleRemoveComponent(row.id)}
                >
                  <IconMinus size="20" />
                </ActionIcon>
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
              styles={{
                input: { textTransform: inputComponentKey ? "uppercase" : "initial" }
              }}
              h={50}
              id='inputComponentKey'
              label={" "}
              placeholder="Zadejte klíč komponenty..."
              value={inputComponentKey}
              w={300}
              inputWrapperOrder={['label', 'input', 'description', 'error']}
              onInput={(e) => {setInputComponentKey(e.target.value);}}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !additionState.disabled) {
                  handleAddComponent();
                }
              }}
              description={inputComponentKey.trim() && components.some(component =>
                equalsCaseInsensitive(component.key, inputComponentKey))
                ? <Group gap={"6"} c={"yellow"}><IconInfoCircle size={16}/>Komponenta s tímto klíčem už je evidována.</Group>
                : form.getValues().key.trim() && equalsCaseInsensitive(form.getValues().key, inputComponentKey)
                  ? <Group gap={"6"} c={"yellow"}><IconInfoCircle size={16}/>Klíč komponenty je stejný jako klíč projektu.</Group>
                  : null
              }
            />
            <Tooltip
              label={additionState.reason}
              disabled={!additionState.reason}
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
