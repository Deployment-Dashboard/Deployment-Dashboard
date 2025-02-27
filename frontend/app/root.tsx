import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { LinksFunction, MetaFunction } from "react-router";

import Header from "~/components/header";

import "./tailwind.css";

import "mantine-datatable/styles.css"

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import './styles.css'

import '@mantine/notifications/styles.css';
import {ColorSchemeScript, colorsTuple, createTheme, MantineProvider, virtualColor} from '@mantine/core';
import {Notifications} from "@mantine/notifications";
import ScrollToTopButton from "~/components/scroll-to-top-button";

export const meta: MetaFunction = () => {
  return [
    { title: "Deployment Dashboard" }
  ];
};

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inria+Sans:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap",
  },
];

const theme = createTheme({
    primaryColor: 'green',
    primaryShade: 9,
    colors: {
      'custom-light': colorsTuple('#f1f3f5'), // Single shade for light mode
      'custom-dark': colorsTuple('#141414'),
      dynamicBackground: virtualColor({
        name: 'dynamicBackground',
        dark: 'custom-dark',
        light: 'custom-light',
      }),
    }
});


export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="./favicon.ico"/>
        <Meta />
        <Links />
        <ColorSchemeScript defaultColorScheme="auto"/>
      </head>
      <body>
      <MantineProvider
        defaultColorScheme="auto"
        theme={theme}
      >
        <Notifications/>
        <div className="flex justify-center px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32">
          <div className="flex flex-col w-full">
            <Header/>
            <ScrollToTopButton/>
            {children}
          </div>
        </div>
      </MantineProvider>
      <ScrollRestoration/>
      <Scripts/>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet/>;
}
