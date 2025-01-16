import {Link, NavLink} from "@remix-run/react";

export default function Header() {
  return (
    <header
      className="flex items-center justify-between rounded-b-md p-6 bg-gray-100 mb-16">
      <Link to="/projects">
        <img src="/logo.png" alt="Logo" className="h-14"/>
      </Link>


      <nav className="flex gap-4 items-center whitespace-nowrap text-xl font-semibold">
        <NavLink
          to="/projects"
          className="rounded-md pt-2 pb-2 px-4 hover:bg-gray-200"
          style={({ isActive, isPending }) => {
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
    </header>
  );
}
