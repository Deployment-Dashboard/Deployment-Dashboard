import {
  Card,
  Text,
  Button,
  Group,
  Modal,
  Title,
  Pill,
  List,
  ScrollArea,
  HoverCard,
  Stack, Badge, Loader
} from '@mantine/core';
import {ProjectOverviewDto} from "~/types";

import { IconArrowsMaximize, IconRocket, IconX} from "@tabler/icons-react";
import { Link } from "react-router";
import {useDisclosure, useIntersection} from "@mantine/hooks";
import {useEffect, useRef, useState} from "react";
import ContentContainer from "~/components/content-container";


interface ProjectCardProps {
  data: ProjectOverviewDto
}

export default function ProjectCard({data : projectOverview} : ProjectCardProps) {
  const [opened, { open, close }] = useDisclosure(false);

  const tagLabels = projectOverview.versionedComponentsNames.sort();

  const containerRef = useRef<HTMLDivElement>(null);
  const [hiddenTagsCount, setHiddenTagsCount] = useState(0);
  const entriesRef = useRef<IntersectionObserverEntry[]>([]);

// Store refs in an array
  const intersections = tagLabels.map(() => useIntersection({
    root: containerRef.current,
    threshold: 1,
  }));

  useEffect(() => {
    intersections.forEach(({ entry }, index) => {
      if (entry) {
        entriesRef.current[index] = entry;
      }
    });

    const hiddenCount = entriesRef.current.filter(e => !e?.isIntersecting).length;
    setHiddenTagsCount(hiddenCount);
  }, [intersections]);

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <Card withBorder shadow="sm" radius="md" style={{height: "490px", width: "320px"}}>
        <Loader size="md" m="auto" type="bars"/>
      </Card>
    )
  }

  return (
    <>
      <Modal
        size="auto" opened={opened} onClose={close}
        closeButtonProps={{icon: <IconX color="red"/>, variant: "subtle", color: "gray"}}
      >
        <Title mb="md" order={2}>Přidání nového projektu do evidence</Title>
        <Text>TODO</Text>
      </Modal>

      <Card withBorder shadow="sm" radius="md" style={{height: "490px", width: "320px"}}>
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
                <Link to={projectOverview.lastDeploymentJiraUrl}
                      style={{justifySelf: "flex-end", textDecoration: "underline", color: "green"}}>
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

              <Pill.Group mt="sm" ref={containerRef} style={{height: "100px", display: "flex"}}>
                {tagLabels.map((key, index) =>
                    <Badge
                      ref={intersections[index].ref}
                      key={key}
                      style={{
                        alignSelf: "flex-start",
                        visibility: intersections[index].entry?.isIntersecting ? "visible" : "hidden"
                      }}
                      size="lg">
                      {key}
                    </Badge>
                )}
              </Pill.Group>
              {hiddenTagsCount > 0 ? (
                <HoverCard withArrow position="top" width={430} shadow="sm">
                  <HoverCard.Target>
                    <Text
                      mt={5}
                      style={{justifySelf: "center", textDecoration: "underline", color: "green", cursor: "pointer"}}
                    >
                      + {hiddenTagsCount} {hiddenTagsCount < 5 ? "další" : "dalších"}
                    </Text>
                  </HoverCard.Target>
                  <HoverCard.Dropdown pt="0">
                    <Stack gap="xs">
                      <Text size="lg" fw={500} ta="center" pt="md">
                        Další ovlivněné komponenty:
                      </Text>
                      <ScrollArea
                        bg="dynamicBackground"
                        mb="5px"
                        w={400} h={155}
                        offsetScrollbars
                        shadow
                        style={{
                          overscrollBehavior: "contain",
                          borderRadius: 'var(--mantine-radius-sm)'
                      }}>
                        <Pill.Group mt="sm" ml="16px" style={{display: "inline-flex", justifySelf: "center"}}>
                          {tagLabels.slice(tagLabels.length - hiddenTagsCount - 1, tagLabels.length).map(component =>
                            <Badge
                              size="lg"
                              color="green"
                            >
                              {component}
                            </Badge>
                          )}
                        </Pill.Group>
                      </ScrollArea>
                    </Stack>
                  </HoverCard.Dropdown>
                </HoverCard>) : null}
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
            disabled
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
