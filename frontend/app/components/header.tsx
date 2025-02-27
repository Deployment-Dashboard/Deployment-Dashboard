import { Link, NavLink } from "react-router";
import {Box, Flex, Paper} from "@mantine/core";
import {Container} from "@mantine/core";

export default function Header() {
  return (
    <Paper
      p="24px"
      mb="64px"
      bg="dynamicBackground"
      shadow="xs"
      style={{
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 'var(--mantine-radius-md)',
        borderBottomRightRadius: 'var(--mantine-radius-md)',
      }}
    >
      <header>
        <Flex justify="space-between" align="center">
          <Box darkHidden>
            <Link to="/projects">
              <img src="./logo.png" alt="Logo" className="h-14"/>
            </Link>
          </Box>
          <Box lightHidden>
            <Link to="/projects">
              <img src="./logo-dark.png" alt="Logo" className="h-14"/>
            </Link>
          </Box>


          <Box darkHidden>
            <nav className="flex gap-4 items-center whitespace-nowrap text-xl font-semibold">
              <NavLink
                to="/projects"
                className="rounded-md pt-2 pb-2 px-4 hover:bg-gray-200"
                style={({ isActive }) => {
                  return {
                    textDecoration: isActive ? "underline" : "",
                    textDecorationColor: isActive ? "green" : "",
                    textDecorationThickness: isActive ? "4px" : "",
                    textUnderlineOffset: "10px"
                  };
                }}>
                Projekty
              </NavLink>
              <NavLink
                to="/deployment-history"
                className="rounded-md pt-2 pb-2 px-4 hover:bg-gray-200"
                style={({ isActive, isPending }) => {
                  return {
                    textDecoration: isActive ? "underline" : "",
                    textDecorationColor: isActive ? "green" : "",
                    textDecorationThickness: isActive ? "4px" : "",
                    textUnderlineOffset: "10px"
                  };
                }}>
                Historie nasazení
              </NavLink>
            </nav>
          </Box>
          <Box lightHidden>
            <nav className="flex gap-4 items-center whitespace-nowrap text-xl font-semibold">
              <NavLink
                to="/projects"
                className="rounded-md pt-2 pb-2 px-4"
                style={({ isActive }) => {
                  return {
                    textDecoration: isActive ? "underline" : "",
                    textDecorationColor: isActive ? "green" : "",
                    textDecorationThickness: isActive ? "4px" : "",
                    textUnderlineOffset: "10px"
                  };
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--mantine-color-dark-6)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                Projekty
              </NavLink>
              <NavLink
                to="/deployment-history"
                className="rounded-md pt-2 pb-2 px-4"
                style={({ isActive, isPending }) => {
                  return {
                    textDecoration: isActive ? "underline" : "",
                    textDecorationColor: isActive ? "green" : "",
                    textDecorationThickness: isActive ? "4px" : "",
                    textUnderlineOffset: "10px"
                  };
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--mantine-color-dark-6)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
              >
                Historie nasazení
              </NavLink>
            </nav>
          </Box>
        </Flex>
      </header>
    </Paper>
  );
}
