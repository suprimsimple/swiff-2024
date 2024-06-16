#!/usr/bin/env node
"use strict";
import React, { useEffect, useState } from "react";
import { render, Text, Box } from "ink";
import chalk from "chalk";
import SelectInput from "ink-select-input";
import { hexHighlight } from "./colors.js";
import { doesFileExist } from "./utils.js";
import { lt } from "semver";
import { createConfig, getConfig, pathConfigs } from "./config.js";
import IntroText from "./components/IntroText.js";
import Tasks from "./components/Tasks.js";
import ItemComponent from "./components/ItemComponent.js";
import { createRequire } from "node:module";
import updateNotifier from "update-notifier";
import { initializeLogger } from "./logger.js";
const require = createRequire(import.meta.url);
const pkg = require("../package.json");
// Start with a blank slate
console.clear();

// Check Version
if (lt(process.version, "15.14.0")) {
  console.log(chalk.green(`Node Version: ${process.version}`))
  console.log(
    chalk.red(
      "unsupported node version, please use a version equal or greater than " +
        "15.14.0"
    )
  );
  process.exit();
}


// package update
updateNotifier({ pkg: pkg }).notify();

const App = () => {
  const [envOptions, setEnvOptions] = useState([]);
  const [stateconfig, setConfig] = useState(null);
  const [selectedEnv, setselectedEnv] = useState(false);
  const [statelogger, setStatelogger] = useState(null);
  const isDisabled = (taskId) =>
    stateconfig &&
    stateconfig?.disabled &&
    stateconfig?.disabled.includes(taskId);
  const handleSelectEnv = async (value) => {
    setselectedEnv(true);
    setConfig((config) => {
      return {
        defaultEnvironment: `${value}`,
        local: config.local,
        pushFolders: config.pushFolders,
        pullFolders: config.pullFolders,
        disabled: config.disabled,
        environments: config.environments,
      };
    });
  };
  useEffect(() => {
    (async () => {
      try {
        const logger = await initializeLogger();
        setStatelogger(logger);
        const doesConfigExist = await doesFileExist(pathConfigs.pathConfig);
        if (!doesConfigExist) {
          await createConfig();
          process.exit()  
        }
        const config = await getConfig();
        if (!config) {
            console.log(chalk.red.bold("❌ No config found, please check your root folder."));
            process.exit()  
        }
        setConfig(config);
        setselectedEnv(false);
        const mapEvns = Object.keys(config?.environments).map((key) => ({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          value: key,
          isSelected: key == `${config?.defaultEnvironment}` ?? false,
        }));
        if (mapEvns.length != 1) {
          setEnvOptions(
            mapEvns?.sort((a, b) => b?.isSelected - a?.isSelected)
          );
        } else {
          handleSelectEnv(mapEvns[0].value);
        }
      } catch (error) {
        console.log(error); // Better Error Handling
      }
    })();
  }, []);

  return (
    <>
      <IntroText stateconfig={stateconfig} />
      {!selectedEnv && (
        <Box flexDirection="column">
          <Text color="#ffffff">
            <Text>✅ </Text>Select an Environment:{" "}
          </Text>
          <Box marginLeft={4} marginTop={0.3}>
            <SelectInput
              items={envOptions}
              indicatorComponent={({ isSelected }) =>
                isSelected ? (
                  <Text color={hexHighlight}> {`>`} </Text>
                ) : (
                  <Text> {` `} </Text>
                )
              }
              itemComponent={(props) => (
                <ItemComponent
                  isDisabled={() => isDisabled(props.value)}
                  isSelected={false}
                  {...props}
                />
              )}
              onSelect={({ value }) => handleSelectEnv(value)}
            />
          </Box>
        </Box>
      )}
      {selectedEnv && (
        <Tasks
          stateconfig={stateconfig}
          setConfig={(config) => setConfig(config)}
          isDisabled={isDisabled}
          logger={statelogger}
        />
      )}
    </>
  );
};

// Catch unhandled rejections
process.on("unhandledRejection", (reason) => {
  process.exit();
});

// Catch uncaught exceptions
process.on("uncaughtException", (error) => {
  fs.writeSync(1, `${chalk.red(error)}\n\n`);
});

// End process on ctrl+c or ESC
process.stdin.on("data", (key) => {
  if (["\u0003", "\u001B"].includes(key)) process.exit();
});

render(<App />);
