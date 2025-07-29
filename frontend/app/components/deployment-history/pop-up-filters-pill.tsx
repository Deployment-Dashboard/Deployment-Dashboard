import {Pill} from "@mantine/core";
import React from "react";

//
// Pill pro filtry
//

export default function PopUpFiltersPill({onRemove: onRemove, children }: { children: React.ReactNode }) {

  return (
    <Pill
      styles={{
        remove: {marginLeft: "2px", marginRight: "2px"}
      }}
      c="white"
      style={{backgroundColor: "green"}}
      size="md"
      withRemoveButton
      onRemove={onRemove}
    >
      {children}
    </Pill>
  );
}
