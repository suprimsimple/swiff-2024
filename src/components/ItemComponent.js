import React from "react";
import { Text } from "ink";
import { hexDefault, hexHighlight, hexMuted } from "../colors";
import Spinner from "ink-spinner";
const ItemComponent = ({
  value: id,
  label: title,
  description,
  isSelected,
  currentTask,
  isDisabled,
  isTaskRunning,
}) => {
  const isActive = currentTask && currentTask?.value === id && isTaskRunning;
  const normalColor = isSelected ? hexHighlight : hexDefault;

  return (
    <React.Fragment>
      <Text bold color={normalColor}>
        {`${title}`}
      </Text>
      {description && (
        <Text bold={false} color={hexMuted}>
          {description ? `: ${description} ` : ""}
        </Text>
      )}
      <Text>
        {isActive ? (
          <Text color="green">
            <Spinner type="clock" />
          </Text>
        ) : (
          ""
        )}
      </Text>
    </React.Fragment>
  );
};

export default ItemComponent;
