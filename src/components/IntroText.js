import React from "react";
import BigText from "ink-big-text";
import { Text, Box } from "ink";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pkg = require("../package.json");
import { hexNotice } from "../colors";
const IntroTitle = () => {
  return (
    <>
      <BigText text="Swiff 2024" />
    </>
  );
};

const IntroText = ({ stateconfig }) => {
  return (
    <React.Fragment>
      <IntroTitle />
      <Text dimColor>Version {` ${pkg?.version}`}</Text>
      <Box marginBottom={1} flexDirection="column">
        <Text color="#ffffff">
          <Text color="#ffffff">
            <Text>🤌 </Text> Environment:{" "}
          </Text>
          <Text bold color={hexNotice}>
            {stateconfig?.environment} |
            {stateconfig && stateconfig["server"][`${stateconfig?.environment}`]
              ? null
              : ` 💩 sever not found for the ${stateconfig?.environment}`}
            {stateconfig &&
              stateconfig["server"] &&
              stateconfig["server"][`${stateconfig?.environment}`] &&
              ` ${
                stateconfig["server"][`${stateconfig?.environment}`]?.user != ""
                  ? stateconfig["server"][`${stateconfig?.environment}`]?.user
                  : " USER"
              }@${
                stateconfig["server"][`${stateconfig?.environment}`]?.host != ""
                  ? stateconfig["server"][`${stateconfig?.environment}`]?.host
                  : "HOST"
              } `}
          </Text>
        </Text>
      </Box>
    </React.Fragment>
  );
};

export default IntroText;
