import {useWindowScroll} from "@mantine/hooks";
import {Button} from "@mantine/core";
import {IconChevronUp} from "@tabler/icons-react"

//
// Tlačítko pro vyscrollování na začátek stránky
//

export default function ScrollToTopButton() {
  const [scroll, scrollTo] = useWindowScroll();

  return (
    <Button size="md" rightSection={<IconChevronUp size={16}/>} style={{
      position: "fixed",
      bottom: "20px",
      right: scroll.y > 400 ? "30px" : "-200px",
      zIndex: "99",
      transition: "right 0.5s ease-in-out",
    }} onClick={() => scrollTo({ y: 0 })}>Zpět nahoru</Button>
  )
}
