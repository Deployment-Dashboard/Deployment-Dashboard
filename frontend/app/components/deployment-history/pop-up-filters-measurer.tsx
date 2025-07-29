import {ActionIcon, Badge, Button, Collapse, Group, Popover, ScrollArea, Stack, Text} from "@mantine/core";
import {IconChevronUp, IconX} from "@tabler/icons-react";

//
// Pomocná komponenta pro změření délky Popoveru pro filtr aplikací
//

export default function PopUpFiltersMeasurer({measureRef: measureRef, componentGroups: componentGroups, details: details}) {

  return (
    <div
      style={{
        position: "absolute",
        top: "-9999px",
        left: "-9999px",
        pointerEvents: "none"
      }}
    >
      <Popover defaultOpened>
        <Popover.Target>
          <Text>
          </Text>
        </Popover.Target>
        <Popover.Dropdown ref={measureRef}>
          <div style={{width: "100%"}}>
            <Stack w="100%">
              <ScrollArea.Autosize
                w="100%" mah={500}
                offsetScrollbars
              >
                <Stack ml="md" mt="md">
                  {componentGroups.map(group => {
                    const detail = details.find(detail => detail.key === group.key);

                    return (
                      <>
                        <Group gap={5}>
                          <Button
                            flex={1}
                            w="100%"
                            size="sm"
                            justify="space-between"
                            variant="subtle"
                            leftSection={
                              <Group>
                                <IconChevronUp/>
                                <Text>
                                  {detail.name}
                                </Text>
                              </Group>
                            }
                          />
                          <ActionIcon ml="auto" mr={2} color="red" variant="light" size={20}>
                            <IconX/>
                          </ActionIcon>
                        </Group>
                        <Collapse in={true}>
                          {group.components.map(component => (
                            <Group
                              mt="xs"
                              ml={33}
                            >
                              <Text>
                                {detail.componentKeysAndNamesMap[component]}
                              </Text>
                              <Badge color="green">
                                {component}
                              </Badge>
                              <ActionIcon mr={2} ml="auto" color="red" variant="light" size={20}>
                                <IconX/>
                              </ActionIcon>
                            </Group>
                          ))}
                        </Collapse>
                      </>
                    )
                  })}
                </Stack>
              </ScrollArea.Autosize>
            </Stack>
          </div>
        </Popover.Dropdown>
      </Popover>
    </div>);
}
