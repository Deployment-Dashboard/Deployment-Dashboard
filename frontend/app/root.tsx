import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { LinksFunction, MetaFunction } from "react-router";

import Header from "~/components/header";

import "./tailwind.css";

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import {AppShell, Button, ColorSchemeScript, MantineProvider, SimpleGrid} from '@mantine/core';
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



export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body>
      <MantineProvider>
        <Scripts/>
        <Notifications/>
        <AppShell>
          <AppShell.Main>
        <div id="root" className="flex justify-center px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32">
          <div className="flex flex-col w-full">
            <Header/>
            <ScrollToTopButton/>
            {children}
          </div>
        </div>
          </AppShell.Main>
        </AppShell>
      </MantineProvider>
      <ScrollRestoration/>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet/>;
}
