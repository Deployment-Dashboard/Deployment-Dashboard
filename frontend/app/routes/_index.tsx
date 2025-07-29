import { useEffect } from "react";
import { useNavigate } from "react-router";

//
// Root, přesměrovává na skutečnou domovskou stránku /projects
//

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/projects");
  }, [navigate]);

  return;
}
