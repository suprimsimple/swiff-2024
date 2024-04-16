#!/usr/bin/env node
import React, { useEffect, useState } from "react";
import { render, Text, Box } from "ink";
import SelectInput from "ink-select-input";
import { Tabs, Tab } from "ink-tab";
import Spinner from 'ink-spinner'
import chalk from "chalk"
import {username as resolveUsername} from 'username'
import { hexDefault, hexHighlight, hexMuted, hexNotice } from "./colors";
import { doesFileExist, executeCommands, isEmpty } from "./utils";
import { createConfig, getConfig, pathConfigs, setupConfig } from "./config";
import { setupLocalEnv } from "./env";

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

const MessageTemplate = ({ messages, isFlaggedStart }) => (
  <Box flexDirection="column">
      {!isEmpty(messages) &&
          messages.map(({ text, type }, i) => (
              <Box key={`msg${i}`}>
                  {type === 'heading' && !isFlaggedStart && (
                      <Box marginBottom={1}>
                          <Text bold>{`—— ${text} ——`}</Text>
                      </Box>
                  )}
                  {type === 'heading' && isFlaggedStart && (
                      <Text bold>{`${text}\n`}</Text>
                  )}
                  <Text dim={messages.length - 1 !== i}>
                      {type === 'error' && `💩  ${text}`}
                      {type === 'success' && `👌  ${text}`}
                      {type === 'message' && `💁‍  ${text}`}
                      {type === 'working' &&
                          (messages.length - 1 === i ? (
                              <Spinner type="runner" />
                          ) : (
                              `🏃 `
                          ))}
                      {type === 'working' && ` ${text}`}
                  </Text>
              </Box>
          ))}
  </Box>
)

const App = () => {
  const [message,setMessage] = useState(null);
  const [locaEnv,setLocalEnv] = useState(null)
  const [isFlaggedStart,setisFlaggedStart] = useState(false)
  const [activeTab, setActiveTab] = useState("");
  const [currentTask, setCurrenTask] = useState(null);
  const [config, setConfig] = useState({
    environment:"staging"
  });


  const pullitems = [
    {
      label: "Folder Pull",
      description: "Update your folders with the remote pull folders",
      value: "folderPull",
    },
    {
      label: "Database Pull",
      description: "Replace your database with the remote database",
      value: "databasePull",
    },
    {
      label: "Composer Pull",
      description: "Update your project with the remote composer files",
      value: "composerPull",
    },
  ];
  const pushitems = [
    {
      label: "Folder Push",
      description: "Update the remote folders with your push folders",
      value: "folderPush",
    },
    {
      label: "Database Push",
      description: "Replace the remote database with your local database",
      value: "databasePush",
    },
    {
      label: "Composer Push",
      description: "Update the remote with your local composer files",
      value: "composerPush",
    },
  ];

  const backsitems = [
    {
      label: "View Backups",
      description: "View your gzipped database and composer backups",
      value: "view_backups",
    },
    {
      label: "Terminal",
      description:
        "Launch a remote terminal session into the remote app folder",
      value: "termninal",
    },
  ];
  const handleTabChange = (name) => {
    setActiveTab(name);
  };
  const isDisabled = (taskId) =>
    config && config.disabled && config.disabled.includes(taskId);

  const  handleSetup = async () => {
      // Check if the config exists
      const doesConfigExist = await doesFileExist(pathConfigs.pathConfig)
      // If no config, create it
      if (!doesConfigExist) await createConfig()
      const isInteractive = !isFlaggedStart
      // Get the config
      const config = await setupConfig(!doesConfigExist, isInteractive)
      // If there's any missing config options then open the config file and show the error
      if (config instanceof Error) return setMessage(config)
      // Add the config to the global state
      setConfig({ config })
      // Get the users env file
      const localEnv = await setupLocalEnv(isInteractive)
      // If there's anything wrong with the env then return an error
      if (localEnv instanceof Error) return setMessage(localEnv)
      // Add the env to the global state
      setLocalEnv({ localEnv })
      // Get the users key we'll be using to connect with
      const user = await resolveUsername()
      // Check if the key file exists
      const sshKey = !isEmpty(localEnv.SWIFF_CUSTOM_KEY)
          ? localEnv.SWIFF_CUSTOM_KEY
          : `/Users/${user}/.ssh/id_rsa`
      const doesSshKeyExist = await doesFileExist(sshKey)
      // If the key isn't found then show a message
      if (!doesSshKeyExist)
          return setMessage(
              `Your${
                  !isEmpty(localEnv.SWIFF_CUSTOM_KEY) ? ' custom' : ''
              } SSH key file wasn’t found at:\n  ${colourNotice(
                  sshKey
              )}\n\nYou can either:\n\na) Create a SSH key with this command (leave passphrase empty):\n  ${colourNotice(
                  `ssh-keygen -m PEM -b 4096 -f ${sshKey}`
              )}\n\nb) Or add an existing key path in your .env with:\n  ${colourNotice(
                  `SWIFF_CUSTOM_KEY="/Users/${user}/.ssh/[your-key-name]"`
              )}${
                  isInteractive
                      ? `\n\nThen hit [ enter ↵ ] to rerun this task`
                      : ''
              }`
          )
      // Check the users SSH key has been added to the server
      const checkSshSetup = await executeCommands(
          getSshTestCommand(
              config[`${config.environment}`].server.user,
              config[`${config.environment}`].server.host,
              config[`${config.environment}`].server.port,
              !isEmpty(localEnv.SWIFF_CUSTOM_KEY)
                  ? localEnv.SWIFF_CUSTOM_KEY
                  : null
          )
      )
      // If there's an issue with the connection then give some assistance
      if (checkSshSetup instanceof Error) {
          return setMessage(
              `A SSH connection couldn’t be made with these details:\n\nServer host: ${
                  config[`${config.environment}`].server.host
              }\nServer user: ${config[`${config.environment}`].server.user}\nPort: ${
                  config[`${config.environment}`].server.port
              }\nSSH key: ${sshKey}\n\n${getSshCopyInstructions(
                  config[`${config.environment}`],
                  sshKey
              )}\n\n${
                  isEmpty(localEnv.SWIFF_CUSTOM_KEY)
                      ? `${chalk.bold(
                            `Is the 'SSH key' path above wrong?`
                        )}\nAdd the correct path to your project .env like this:\nSWIFF_CUSTOM_KEY="/Users/${user}/.ssh/id_rsa"`
                      : ''
              }`
          )
      }
      return true
  }

  const handleSelect = async (item) => {
    // Cheack Config
    await  handleSetup()
  };
  useEffect(()=>{
   (async()=>{
      // Setup Config
      const doesConfigExist = await doesFileExist(pathConfigs.pathConfig);
      if (doesConfigExist) {
        const { disabled, environment } = await getConfig();
        if (disabled){
          setConfig({ 
            ...config,
            environment: environment ?? "staging", disabled: disabled })
        }
      }else{
       return
      }
   })()

  },[])
  return (
    <>
      <Box marginBottom={1} flexDirection="column">
        <Text color={hexHighlight}>Welcome to Swiff 2024! Please select a task:</Text>
        <Text color="#ffffff">!! Environment: <Text bold color={hexNotice}> {config?.environment} </Text></Text>
      </Box>

      <Box flexDirection="column">
        <Tabs
          onChange={handleTabChange}
          colors={{
            activeTab: {
              color: "transparent",
              backgroundColor: hexHighlight,
            },
          }}
        >
          <Tab name="pull">Pull</Tab>
          <Tab name="push">Push</Tab>
          <Tab name="backs">Terminal/Backups</Tab>
        </Tabs>
        <Box marginTop={1}>
          {activeTab === "pull" && (
            <SelectInput
              items={pullitems}
              itemComponent={(props) => (
                <ItemComponent
                  currentTask={currentTask}
                  isDisabled={() => isDisabled(props.value)}
                  {...props}
                />
              )}
              onSelect={handleSelect}
            />
          )}
          {activeTab === "push" && (
            <SelectInput
              items={pushitems}
              itemComponent={(props) => (
                <ItemComponent
                  currentTask={currentTask}
                  isDisabled={() => isDisabled(props.value)}
                  {...props}
                />
              )}
              onSelect={handleSelect}
            />
          )}
          {activeTab === "backs" && (
            <SelectInput
              items={backsitems}
              itemComponent={(props) => (
                <ItemComponent
                  currentTask={currentTask}
                  isDisabled={() => isDisabled(props.value)}
                  {...props}
                />
              )}
              onSelect={handleSelect}
            />
          )}
        </Box>
      </Box>
    </>
  );
};

render(<App />);
