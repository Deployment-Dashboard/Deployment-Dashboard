import {LoaderFunctionArgs, useLoaderData} from "react-router";
import {API_URL} from "~/constants";

import {
  Button,
  Center, Loader,
  MantineColor,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import ContentContainer from "~/components/global/content-container";
import {ReactElement, useEffect, useState} from "react";
import { IconCheck, IconExclamationMark, IconX } from "@tabler/icons-react";
import HomepageLink from "~/components/global/homepage-link";

//
// Potvrzovací stránka pro zaevidování nového nasazení
//

export async function loader({
                               request,
                             }: LoaderFunctionArgs) {
  const requestUrl = new URL(request.url)
  const requestPathname = requestUrl.pathname;
  const requestSearch = requestUrl.search;

  const backEndUrl = API_URL + requestPathname.replace("deploydash/new-deployment/", "") + requestSearch;
  const response = await fetch(backEndUrl);

  return await response.json();
}

export default function ProjectsTrackDeploymentAppKeyEnvVersion() {

  //
  // DATA
  //

  // obsah stránky
  const [pageContent, setPageContent] = useState<{
    icon: {
      resolvedColor: MantineColor;
      iconContent: ReactElement;
    };
    additionalText: ReactElement | null;
  }>({
    icon: { resolvedColor: "gray" as MantineColor, iconContent: (<></>) },
    additionalText: null
  });

  // data ze server loaderu
  let initialLoaderData = useLoaderData();
  const [loaderData, setLoaderData] = useState(initialLoaderData);

  // kontrola hydratace
  const [isHydrated, setIsHydrated] = useState(false);

  //
  // USE EFFECTS
  //

  // aktualizace obsahu podle odpovědi BE
  useEffect(() => {
    switch (loaderData.statusCode) {
      case 200:
        setPageContent({
          icon: {
            resolvedColor: "green" as MantineColor,
            iconContent: <IconCheck color="white" size={40} />
          },
          additionalText: null
        });
        break;
      case 400:
        setPageContent({
          icon: {
            resolvedColor: "yellow" as MantineColor,
            iconContent: <IconExclamationMark color="white" size={40} />
          },
          additionalText: (
            <Text size="lg">
              Pokud chcete nasazení přesto zaevidovat, klikněte{" "}
              <a
                onClick={async () => {
                  const response = await fetch(loaderData.forceDeploymentEvidenceUrl);
                  setIsHydrated(false)
                  const newData = await response.json();
                  setIsHydrated(true)
                  setLoaderData(newData);
                }}
                style={{ textDecoration: "underline", color: "green", cursor: "pointer" }}
              >
                zde
              </a>
              .
            </Text>
          )
        });
        break;
      default:
        setPageContent({
          icon: {
            resolvedColor: "red" as MantineColor,
            iconContent: <IconX color="white" size={40} />
          },
          additionalText: null
        });
        break;
    }
  }, [loaderData]);

  // hydratace
  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
    <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
      <Button
        size="md"
        style={{visibility: "hidden"}}
      />
      <ContentContainer>
          <Center>
          <Stack gap={0} mt="xl" align="center">
            <Center>
              <Paper radius="50px" p="30px" mt="xl" bg={ pageContent.icon.resolvedColor }>
                { pageContent.icon.iconContent }
              </Paper>
            </Center>
            <Title m="lg" order={2} size="h1" fw={700}>{loaderData.message}</Title>
            <Title order={3}>{loaderData.details}</Title>
            { pageContent.additionalText }
            <Text size="lg" mt="lg">
              Přejít na <HomepageLink/>.
            </Text>
          </Stack>
          </Center>
      </ContentContainer>
    </div>
  );
}
