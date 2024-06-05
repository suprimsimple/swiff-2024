import React from "react";
import { Text } from "ink";
import SelectInput from "ink-select-input";
import { hexHighlight } from "../colors.js";
import ItemComponent from "./ItemComponent.js";

const CustomSelectTaskInput = ({
  items,
  currentTask,
  isDisabled,
  isTaskRunning,
  handleSelectTask,
}) => {
  return (
    <SelectInput
      items={items}
      indicatorComponent={({ isSelected }) =>
        isSelected ? (
          <Text color={hexHighlight}> {`>`} </Text>
        ) : (
          <Text> {` `} </Text>
        )
      }
      itemComponent={(props) => (
        <ItemComponent
          currentTask={currentTask}
          isDisabled={() => isDisabled(props.value)}
          isTaskRunning={isTaskRunning()}
          {...props}
        />
      )}
      onSelect={handleSelectTask}
    />
  );
};

export default CustomSelectTaskInput;
