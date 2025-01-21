import type { MetaFunction } from "@remix-run/node";
import { useEffect } from "react";
import { useNavigate } from "@remix-run/react";


export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/projects");
  }, [navigate]);

  return null;
}
