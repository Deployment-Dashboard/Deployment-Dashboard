import React from "react";
import { Paper } from '@mantine/core';

export default function ContentContainer({ children }: { children: React.ReactNode }) {

  return (
    <Paper
      radius="md"
      p="xl"
      bg="dynamicBackground"
      shadow="xs"
      style={{
        height: "100%",
        minHeight: "calc(100vh - 220px)",
        borderTopLeftRadius: 'var(--mantine-radius-md)',
        borderTopRightRadius: 'var(--mantine-radius-md)',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      }}
    >
      {children}
    </Paper>
  );
}
