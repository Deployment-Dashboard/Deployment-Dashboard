import type { MetaFunction } from "@remix-run/node";
import { useEffect } from "react";
import { useNavigate } from "@remix-run/react";
export const meta: MetaFunction = () => {
  return [
    { title: "Deployment Dashboard" }
  ];
};

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/projects");
  }, [navigate]);

  return null;
}
