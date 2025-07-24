import ContentContainer from "~/components/content-container";
import {Button, Center, Stack, Text, Title} from "@mantine/core";
import { Link } from "react-router";
import HomepageLink from "~/components/homepage-link";

export default function NotFoundPage() {
  return (
    <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
      <Button
        size="md"
        style={{visibility: "hidden"}}
      />
      <ContentContainer>
        <Center>
          <Stack gap={0} mt="xl">
            <Title order={2} size="h1" fw={700}>Error 404 - Page Not Found</Title>
            <Text mt="lg">
              Webová stránka, kterou hledáte, nebyla nalezena.<br/>Zkontrolujte prosím zadanou adresu, nebo se vraťte
              na <HomepageLink/>.
            </Text>
          </Stack>
        </Center>
      </ContentContainer>
    </div>
  );
}

