import {Card, Text, Button, Group, Modal, Title, TextInput, PillsInput, Pill, ActionIcon} from '@mantine/core';
import {ProjectOverviewDto} from "~/types";

import {IconArrowsMaximize, IconCheck, IconPlus, IconRocket, IconX} from "@tabler/icons-react";
import {Link, NavLink} from "@remix-run/react";
import {useDisclosure} from "@mantine/hooks";


interface ProjectCardProps {
  data: ProjectOverviewDto
}

export default function ProjectCard({data : projectOverview} : ProjectCardProps) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal size="auto" opened={opened} onClose={close}
             closeButtonProps={{icon: <IconX color="red"/>, variant: "subtle", color: "gray"}}
      >
        <Title mb="md" order={2}>Přidání nového projektu do evidence</Title>
        <Text>TODO</Text>
      </Modal>

      <Card withBorder shadow="sm" radius="md" style={{minHeight: "400px", maxWidth: "320px"}}>
        <Card.Section withBorder inheritPadding py="xs">
          <Text fw={500} size="lg">{projectOverview.name}</Text>
        </Card.Section>

        <div style={{padding: "8px"}}>
          <Text mt="sm" size="lg" fw={500}>Poslední nasazení:</Text>

          {projectOverview.lastDeployedAt ? (
            <>
              <Text size="lg">
                {new Date(projectOverview.lastDeployedAt).toLocaleDateString("cs-CZ")}
              </Text>
              <Text mt="sm" size="lg" fw={500}>
                {"Ovlivněné aplikace:"}
              </Text>
              <Pill.Group>
                {projectOverview.versionedComponentsNames.map((key) => (
                  <Pill key={key} size="lg">
                    {key}
                  </Pill>
                ))}
              </Pill.Group>
              <Text mt="sm" size="lg" fw={500}>
                {"Prostředí:"}
              </Text>
              <Text size="lg">
                {projectOverview.lastDeployedToEnvName}
              </Text>
              <Link to="/projects" style={{justifySelf:"flex-end", textDecoration: "underline", color: "green"}}>Odkaz na Jira ticket</Link>
            </>
          ) : (
            <Text size="lg">
              Projekt zatím nebyl nasazen
            </Text>
          )}
        </div>


        <Group style={{flexDirection: "row", justifyContent: "space-evenly", marginTop: "auto"}}>
          <Button
            rightSection={<IconRocket size={16} />}
            component="a"
            onClick={open}
            style={{alignSelf: "flex-end"}}
          >
            Nasadit
          </Button>
          <Button
            variant="light"
            rightSection={<IconArrowsMaximize size={16} />}
            component={Link}
            to={`/projects/detail/${projectOverview.key}`}
            style={{alignSelf: "flex-end"}}
          >
            Zobrazit detail
          </Button>
        </Group>
      </Card>
    </>
  );
}
