import React from "react";
import BigText from "ink-big-text";
import { Text, Box } from "ink";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pkg = require("../package.json");
import { hexNotice } from "../colors.js";
const IntroTitle = () => {
  return (
    <>
      <BigText font="tiny"  text="Swiff 2024" space={false}  />
    </>
  );
};

const IntroText = ({ stateconfig }) => {
  return (
    <>
     <Box marginTop={0.5} marginBottom={0.2} flexDirection="column">
        <IntroTitle />
        <Box marginTop={0.3} alignItems="flex-end" justifyContent="flex-end">
        <Text dimColor> version {` ${pkg?.version}`}</Text>
        </Box>
     </Box>
      <Box marginTop={0.3} marginBottom={1} flexDirection="column">
        <Text color="#ffffff">
          <Text color="#ffffff">
            <Text>🤌 </Text> Environment:{" "}
          </Text>
          <Text bold color={hexNotice}>
            {stateconfig?.defaultEnvironment} |
            {stateconfig && stateconfig["environments"][`${stateconfig?.defaultEnvironment}`]
              ? null
              : ` 💩 sever not found for the ${stateconfig?.defaultEnvironment}`}
            {stateconfig &&
              stateconfig["environments"] &&
              stateconfig["environments"][`${stateconfig?.defaultEnvironment}`] &&
              ` ${
                stateconfig["environments"][`${stateconfig?.defaultEnvironment}`]?.user != ""
                  ? stateconfig["environments"][`${stateconfig?.defaultEnvironment}`]?.user
                  : " USER"
              }@${
                stateconfig["environments"][`${stateconfig?.defaultEnvironment}`]?.host != ""
                  ? stateconfig["environments"][`${stateconfig?.defaultEnvironment}`]?.host
                  : "HOST"
              } `}
          </Text>
        </Text>
      </Box>
    </>
  );
};

export default IntroText;
