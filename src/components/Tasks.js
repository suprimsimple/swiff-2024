import React, { useState } from "react";
import { Text, Box } from "ink";
import { Tabs, Tab } from "ink-tab";
import chalk from "chalk";
import { exec } from "child_process";
import SelectInput from "ink-select-input";
import { username as resolveUsername } from "username";
import {
  commaAmpersander,
  doesFileExist,
  executeCommands,
  isEmpty,
  replaceRsyncOutput,
} from "../utils";
import {
  createConfig,
  getConfig,
  getConfigIssues,
  pathConfigs,
  setupConfig,
} from "../config";
import { getRemoteEnv, setupLocalEnv } from "../env";
import ItemComponent from "./ItemComponent";
import {
  colourAttention,
  colourHighlight,
  colourMuted,
  colourNotice,
  hexHighlight,
} from "../colors";
import MessageTemplate from "./MessageTemplate";
import { getSshPullCommands, getSshTestCommand } from "../ssh";
// Get the latest task status to check if running
const isTaskRunning = (messages) => {
  const currentMessage =
    messages && messages.length > 0 && messages?.slice(-1)?.pop();
  console.log(messages);
  return currentMessage ? currentMessage.type === "working" : false;
};

const TaskFunctions = {
  folderPull: async ({
    stateconfig,
    handlesetMessage,
    stateremoteEnv,
    statelocalEnv,
    handlesetWorking,
  }) => {
    const { pullFolders, environment } = stateconfig;
    const { user, host, appPath, port } = stateconfig.server[`${environment}`]; // get Env
    // Check if the user has defined some pull folders
    if (!Array.isArray(pullFolders) || isEmpty(pullFolders.filter((i) => i))) {
      return handlesetMessage(
        `First specify some pull folders in your ${colourNotice(
          configFileName
        )}\n\nFor example:\n\n${colourMuted(
          `{\n  `
        )}pullFolders: [ '${colourNotice(
          "public/assets/volumes"
        )}' ]\n${colourMuted("}")}`
      );
    }
    // Remove empty values from the array so the user can’t accidentally download the entire remote
    const filteredPullFolders = pullFolders.filter((i) => i);
    // Share what's happening with the user
    handlesetWorking(
      `Pulling files from ${commaAmpersander(filteredPullFolders)}`
    );

    // Create the rsync commands required to pull the files
    const pullCommands = getSshPullCommands({
      pullFolders: filteredPullFolders,
      user: user,
      host: host,
      port: port,
      appPath: appPath,
      sshKeyPath: statelocalEnv?.SWIFF_CUSTOM_KEY,
    });

    // Get the remote env file via SSH
    const remoteEnv = await getRemoteEnv({
      serverConfig: server,
      isInteractive: isFlaggedStart,
      sshKeyPath: statelocalEnv?.SWIFF_CUSTOM_KEY,
    });

    // If the env can't be found then show a message
    if (remoteEnv instanceof Error) {
      handlesetWorking(
        colourNotice(
          `Consider adding an .env file on the remote server\n   at ${path.join(
            stateconfig.server[`${stateconfig.environment}`].appPath,
            ".env"
          )}`
        )
      );
    }
    // Set the name of the remote environment
    let remoteEnvironment = "";
    if (!(remoteEnv instanceof Error)) {
      remoteEnvironment = remoteEnv.ENVIRONMENT;
    }
    // Send the pull commands
    const pullStatus = await executeCommands(pullCommands);
    if (pullStatus instanceof Error) {
      return handlesetMessage(
        `There was an issue downloading the files${
          !isEmpty(remoteEnvironment)
            ? ` from ${colourAttention(remoteEnvironment)}`
            : ""
        }\n\n${colourMuted(
          String(pullStatus).replace(
            /No such file or directory/g,
            colourDefault("No such file or directory")
          )
        )}`,
        "error"
      );
    }
    const output = replaceRsyncOutput(pullStatus, filteredPullFolders);
    return handlesetMessage(
      isEmpty(output)
        ? `No pull required, ${colourHighlight(
            statelocalEnv.DB_SERVER
          )} is already up-to-date!`
        : `Success! These are the local files that changed:\n${output}\n\nThe file pull${
            !isEmpty(remoteEnvironment)
              ? ` from ${colourHighlight(remoteEnvironment)}`
              : ""
          } was successful`,
      "success"
    );
  },
};

const Tasks = ({ stateconfig, setConfig, isDisabled }) => {
  const [messages, setMessages] = useState([]);
  const [playSound, setPlaySound] = useState(false);
  const [statelocalEnv, setLocalEnv] = useState(null);
  const [stateremoteEnv, setRemoteEnv] = useState(null);
  const [activeTab, setActiveTab] = useState("");
  const [currentTask, setCurrenTask] = useState(null);
  const [isFlaggedStart, setisFlaggedStart] = useState(false);

  const handleSetup = async () => {
    try {
      const isInteractive = !isFlaggedStart;
      // Check if the config exists
      const doesConfigExist = await doesFileExist(pathConfigs.pathConfig);
      // If no config, create
      if (!doesConfigExist) await createConfig();
      // else get Config
      const config = await getConfig();
      // If there's any missing config options then open the config file and show the error
      const missingConfigSettings = getConfigIssues(
        {
          environment: stateconfig?.environment,
          ...config,
        },
        !doesConfigExist,
        isInteractive
      );
      if (missingConfigSettings) {
        return handlesetMessage(missingConfigSettings, "error");
      }
      // Add/Update the config to the global state
      setConfig((conf) => {
        return {
          environment: conf?.environment,
          ...config,
        };
      });
      // Get the users env file
      const localEnv = await setupLocalEnv(isInteractive);
      // If there's anything wrong with the env then return an error
      if (localEnv instanceof Error) return handlesetMessage(localEnv, "error");
      // Add the env to the global state
      setLocalEnv({ localEnv });
      // Get the users key we'll be using to connect with
      const user = await resolveUsername();
      // Check if the key file exists
      const sshKey = !isEmpty(localEnv.SWIFF_CUSTOM_KEY)
        ? localEnv.SWIFF_CUSTOM_KEY
        : `/Users/${user}/.ssh/id_rsa`;
      const doesSshKeyExist = await doesFileExist(sshKey);
      // If the key isn't found then show a message
      if (!doesSshKeyExist) {
        return handlesetMessage(
          `Your${
            !isEmpty(localEnv.SWIFF_CUSTOM_KEY) ? " custom" : ""
          } SSH key file wasn’t found at:\n  ${colourNotice(
            sshKey
          )}\n\nYou can either:\n\na) Create a SSH key with this command (leave passphrase empty):\n  ${colourNotice(
            `ssh-keygen -m PEM -b 4096 -f ${sshKey}`
          )}\n\nb) Or add an existing key path in your .env with:\n  ${colourNotice(
            `SWIFF_CUSTOM_KEY="/Users/${user}/.ssh/[your-key-name]"`
          )}${
            isInteractive ? `\n\nThen hit [ enter ↵ ] to rerun this task` : ""
          }`,
          "error"
        );
      }
      // Check the users SSH key has been added to the server
      const checkSshSetup = await executeCommands(
        getSshTestCommand(
          stateconfig.server[`${stateconfig.environment}`].user,
          stateconfig.server[`${stateconfig.environment}`].host,
          stateconfig.server[`${stateconfig.environment}`].port,
          !isEmpty(localEnv.SWIFF_CUSTOM_KEY) ? localEnv.SWIFF_CUSTOM_KEY : null
        )
      );
      // If there's an issue with the connection then give some assistance
      if (checkSshSetup instanceof Error) {
        return handlesetMessage(
          `A SSH connection couldn’t be made with these details:\n\nServer host: ${
            stateconfig.server[`${stateconfig.environment}`].server.host
          }\nServer user: ${
            stateconfig.server[`${stateconfig.environment}`].server.user
          }\nPort: ${
            stateconfig.server[`${stateconfig.environment}`].server.port
          }\nSSH key: ${sshKey}\n\n${getSshCopyInstructions(
            stateconfig.server[`${stateconfig.environment}`],
            sshKey
          )}\n\n${
            isEmpty(localEnv.SWIFF_CUSTOM_KEY)
              ? `${chalk.bold(
                  `Is the 'SSH key' path above wrong?`
                )}\nAdd the correct path to your project .env like this:\nSWIFF_CUSTOM_KEY="/Users/${user}/.ssh/id_rsa"`
              : ""
          }`
        );
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleEndTask = () => {
    if (!isTaskRunning(messages) && isFlaggedStart) {
      setTimeout(() => process.exit(), 500);
    }
  };

  const handlesetMessage = (message, type = "message") => {
    if (playSound) {
      // Play the message sound
      exec(`afplay ${pathConfigs.pathMedia}/message.wav`);
    }
    // Remove any unneeded error text
    setMessages((messages) => {
      return [...messages, { text: message, type: type }];
    });
  };

  const handlesetWorking = (message) => {
    // Add the message to the end of the current list
    // Remove any unneeded error text
    setMessages((messages) => {
      return [...messages, { text: message, type: "working" }];
    });
  };
  const handleSelectTask = async (item) => {
    try {
      handlesetMessage(item?.label, "heading");

      handlesetWorking("Performing pre-task checks");
      // Start the setup process
      setCurrenTask(item);

      const isSetup = await handleSetup();
      if (isSetup != true) {
        // End the process after 500 ticks if started with flags
        return handleEndTask();
      }
      // Start the chosen task
      await TaskFunctions[`${item.value}`]({
        stateconfig,
        statelocalEnv,
        stateremoteEnv,
        handlesetMessage,
        handlesetWorking,
      });
      // End the process after 500 ticks if started with flags
      // handleEndTask();
    } catch (error) {
      console.log(error);
    }
  };
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
  return (
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
        <Tab name="pull">
          <Text underline={activeTab == "pull"}>Pull</Text>
        </Tab>
        <Tab name="push">
          <Text underline={activeTab == "push"}>Push</Text>{" "}
        </Tab>
        <Tab name="backs">
          <Text underline={activeTab == "backs"}>Terminal/Backups</Text>
        </Tab>
      </Tabs>
      <Box marginTop={1}>
        {activeTab === "pull" && (
          <SelectInput
            items={pullitems}
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
                {...props}
              />
            )}
            onSelect={handleSelectTask}
          />
        )}
        {activeTab === "push" && (
          <SelectInput
            items={pushitems}
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
                {...props}
              />
            )}
            onSelect={handleSelectTask}
          />
        )}
        {activeTab === "backs" && (
          <SelectInput
            items={backsitems}
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
                {...props}
              />
            )}
            onSelect={handleSelectTask}
          />
        )}
      </Box>
      <Box marginTop={1}>
        {!isEmpty(messages) && (
          <MessageTemplate
            messages={messages}
            isFlaggedStart={isFlaggedStart}
          />
        )}
      </Box>
    </Box>
  );
};

export default Tasks;
