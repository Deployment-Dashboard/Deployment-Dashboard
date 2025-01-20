import {LoaderFunctionArgs} from "@remix-run/node";
import {fetch} from "@remix-run/web-fetch";
import {App, ProjectOverviewDto} from "~/types";
import ContentContainer from "~/components/content-container";
import {ActionIcon, Button, Grid, Group, Modal, Pill, PillsInput, TextInput, Title} from "@mantine/core";
import {IconArrowBackUp, IconRocket, IconCheck, IconPlus, IconX} from "@tabler/icons-react";
import ProjectCard from "~/components/project-card";
import {Link} from "@remix-run/react";
import {useLoaderData} from "react-router";
import {API_URL} from "../constants"

export async function loader({
                               params,
                             }: LoaderFunctionArgs) {
  console.log(`fetching data for: ${params.appKey}`);
  const response = await fetch(`${API_URL}/apps/${params.appKey}`);
  const projects: App[] = await response.json();
  return projects;
}

export default function ProjectDetail() {
  const project = useLoaderData<App>()

  return (
    <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
      <Group style={{alignSelf: "flex-end"}}>
        <Button
          variant="outline"
          size="md"
          leftSection={<IconArrowBackUp size={16}/>}
          component={Link}
          to="/projects"
        >
          Zpět na přehled
        </Button>
        <Button
          size="md"
          rightSection={<IconRocket size={16}/>}
          component={Link}
          to="/projects"
        >
          Nasadit
        </Button>
      </Group>
      <ContentContainer>
        <p>Detail projektu {project.key}</p>
      </ContentContainer>

    </div>
  );
}
