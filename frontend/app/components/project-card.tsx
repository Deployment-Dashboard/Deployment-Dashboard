import {Card, Text, Button, Group, Modal, Title, TextInput, PillsInput, Pill, ActionIcon} from '@mantine/core';
import {ProjectOverviewDto} from "~/types";

import {IconArrowsMaximize, IconCheck, IconPlus, IconRocket, IconX} from "@tabler/icons-react";
import { Link, NavLink } from "react-router";
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
              <Text mt="sm" mb="sm" fw={500}>
                <Link  to={projectOverview.lastDeploymentJiraUrl} style={{justifySelf:"flex-end", textDecoration: "underline", color: "green"}}>
                  Odkaz na Jira ticket
                </Link>
              </Text>
              <Text mt="sm" size="lg" fw={500}>
                {"Prostředí:"}
              </Text>
              <Text size="lg">
                {projectOverview.lastDeployedToEnvName}
              </Text>
              <Text mt="sm" size="lg" fw={500}>
                {"Ovlivněné komponenty:"}
              </Text>
              <Pill.Group style={{height: "100px", display: "flex"}}>
                {projectOverview.versionedComponentsNames.map((key) => (
                  <Pill key={key} style={{alignSelf: "flex-start"}} size="lg">
                    {key}
                  </Pill>
                ))}
              </Pill.Group>
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
