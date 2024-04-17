import React from "react";
import { Text } from "ink";
import { hexDefault, hexHighlight, hexMuted } from "../colors";
const ItemComponent = ({
  value: id,
  label: title,
  description,
  isSelected,
  currentTask,
  isDisabled,
}) => {
  const isActive =
    currentTask && currentTask.title === title && isTaskRunning(messages);
  const normalColor = isSelected ? hexHighlight : hexDefault;
  return (
    <React.Fragment>
      <Text bold color={normalColor}>
        {`${title}`}
      </Text>
      <Text bold={false} color={hexMuted}>
        {description ? `: ${description}` : ""}
      </Text>
    </React.Fragment>
  );
};

export default ItemComponent;
