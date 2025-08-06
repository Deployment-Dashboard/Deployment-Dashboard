import { LoaderFunction } from "react-router";
import ProjectCard from "~/components/projects/index/project-card"
import {ProjectOverviewDto} from "~/types";
import {useLoaderData} from "react-router";
import {
  Button,
  Grid,
  Group,
  Flex,
  Stack,
  Text
} from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import {IconPlus, IconWind} from "@tabler/icons-react";
import ContentContainer from "~/components/global/content-container";
import {DOCKER_API_URL} from "~/constants"
import ModalAddProject from "~/components/projects/index/modal-add-project";

//
// Domovská stránka
//

export let loader: LoaderFunction = async () => {
  const response = await fetch(`${DOCKER_API_URL}/apps-overview`);
  const projects: ProjectOverviewDto[] = await response.json();
  return projects;
};

export default function Projects() {
  const overviews = useLoaderData<ProjectOverviewDto[]>();

  // state modalu
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <ModalAddProject opened={opened} onClose={close}/>
      <Flex direction="column" gap="10px">
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
          {overviews && overviews?.length ? (
            <Grid align="stretch" gutter="lg">
              {overviews?.map((overview) => (
                <Grid.Col key={overview.key} span="content">
                  <ProjectCard data={overview}/>
                </Grid.Col>
              ))}
            </Grid>) : (
              <Stack pt="10em" gap={0} align="center">
                <IconWind size={40} strokeWidth={1.5}/>
                <Text pt="1em" size="xl">V evidenci není žádný projekt.</Text>
              </Stack>)}
        </ContentContainer>
      </Flex>
    </>
  );
}
