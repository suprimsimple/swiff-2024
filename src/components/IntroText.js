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
      <BigText text="Swiff 2024" space={true} />
    </>
  );
};

const IntroText = ({ stateconfig }) => {
  return (
    <>
      <IntroTitle />
      <Text dimColor>Version {` ${pkg?.version}`}</Text>
      <Box marginBottom={1} flexDirection="column">
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
