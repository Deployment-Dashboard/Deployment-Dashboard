import ContentContainer from "~/components/content-container";
import {Button, Text, Title} from "@mantine/core";
import {Link} from "@remix-run/react";

export default function NotFoundPage() {
  return (
    <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
      <Button
        size="md"
        style={{visibility: "hidden"}}
      >
      </Button>
      <ContentContainer>
        <Title order={2} size="h1" fw={700}>Error 404 - Page Not Found</Title>
        <Text mt="lg">Webová stránka, kterou hledáte, nebyla nalezena.<br/>Zkontrolujte prosím zadanou adresu, nebo se vraťte na <Link to="/projects" style={{textDecoration: "underline", color: "green"}}>hlavní stránku</Link>.</Text>
      </ContentContainer>
    </div>
  );
}

