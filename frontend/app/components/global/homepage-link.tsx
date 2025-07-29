import {Link} from "react-router";

//
// Odkaz na domovskou stránku
//

export default function HomepageLink() {
  return (
    <Link to="/projects" style={{textDecoration: "underline", color: "green"}}>hlavní stránku</Link>
  )
}
