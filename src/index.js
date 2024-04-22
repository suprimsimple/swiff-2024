#!/usr/bin/env node

import "core-js/stable";
import "regenerator-runtime/runtime";
import React, { useEffect, useState } from "react";
import { render, Text, Box } from "ink";
import SelectInput from "ink-select-input";
// import updateNotifier from "update-notifier";
import { colourHighlight, hexHighlight } from "./colors";
import { doesFileExist } from "./utils";
import { getConfig, pathConfigs } from "./config";
import IntroText from "./components/IntroText";
import Tasks from "./components/Tasks";
import ItemComponent from "./components/ItemComponent";

// Start with a blank slate
// console.clear();

// package update
// updateNotifier({ pkg: pkg }).notify();

const App = () => {
  const [envOptions, setEnvOptions] = useState([]);
  const [stateconfig, setConfig] = useState(null);
  const [selectedEnv, setselectedEnv] = useState(false);
  const isDisabled = (taskId) =>
    stateconfig &&
    stateconfig?.disabled &&
    stateconfig?.disabled.includes(taskId);
  const handleSelectEnv = async (value) => {
    setselectedEnv(true);

    setConfig((config) => {
      return {
        environment: `${value}`,
        local: config.local,
        pushFolders: config.pushFolders,
        pullFolders: config.pullFolders,
        disabled: config.disabled,
        server: config.server,
      };
    });
  };
  useEffect(() => {
    (async () => {
      const doesConfigExist = await doesFileExist(pathConfigs.pathConfig);
      if (doesConfigExist) {
        try {
          const config = await getConfig();
          if (config) {
            setConfig(config);
            setselectedEnv(false);
            const mapEvns = Object.keys(config?.server).map((key) => ({
              label: key.charAt(0).toUpperCase() + key.slice(1),
              value: key,
              isSelected: key == `${config?.environment}` ?? false,
            }));
            if (mapEvns.length != 1) {
              setEnvOptions(
                mapEvns?.sort((a, b) => b?.isSelected - a?.isSelected)
              );
            } else {
              handleSelectEnv(mapEvns[0].value);
            }
          }
        } catch (error) {
          console.log(error);
        }
      }
    })();
  }, []);

  return (
    <>
      <IntroText stateconfig={stateconfig} />
      {!selectedEnv && (
        <Box flexDirection="column">
          <Text color="#ffffff">
            {" "}
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
        />
      )}
    </>
  );
};

// // Catch unhandled rejections
// process.on('unhandledRejection', reason => {
//   process.exit()
// })

// // Catch uncaught exceptions
// process.on('uncaughtException', error => {
//   fs.writeSync(1, `${chalk.red(error)}\n\n`)
// })

// // End process on ctrl+c or ESC
// process.stdin.on('data', key => {
//   if (['\u0003', '\u001B'].includes(key)) process.exit()
// })

render(<App />);
