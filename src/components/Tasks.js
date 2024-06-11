import React from "react";
import { Text, Box } from "ink";
import { Tabs, Tab } from "ink-tab";
import chalk from "chalk";
import { exec } from "node:child_process";
import timersPromises from "timers-promises";
import { username as resolveUsername } from "username";
import path from "node:path";
import logger from "../logger.js";
import {
  cmdPromise,
  commaAmpersander,
  doesFileExist,
  executeCommands,
  getMissingPaths,
  isEmpty,
  replaceRsyncOutput,
  validatePushFolderOptions,
} from "../utils.js";
import {
  configFileName,
  createConfig,
  getConfig,
  getConfigIssues,
  pathConfigs,
  setupConfig,
} from "../config.js";
import { getRemoteEnv, setupLocalEnv } from "../env.js";
import {
  colourAttention,
  colourDefault,
  colourHighlight,
  colourMuted,
  colourNotice,
  hexHighlight,
} from "../colors.js";
import MessageTemplate from "./MessageTemplate.js";
import {
  getSshCopyInstructions,
  getSshDatabase,
  getSshFile,
  getSshInit,
  getSshPullCommands,
  getSshPushCommands,
  getSshTestCommand,
} from "../ssh.js";
import CustomSelectTaskInput from "./CustomSelectTaskInput.js";
import {
  doDropAllDbTables,
  doImportDb,
  doLocalDbDump,
  doddevlocalDump,
} from "../database.js";

// Get the latest task status to check if running
const isTaskRunning = (messages) => {
  const currentMessage =
    messages && messages.length > 0 && messages?.slice(-1)?.pop();
  return currentMessage ? currentMessage.type === "working" : false;
};

const TaskFunctions = {
  folderPull: async ({
    stateconfig,
    handlesetMessage,
    stateremoteEnv,
    statelocalEnv,
    handlesetWorking,
    isFlaggedStart,
  }) => {
    const { pullFolders, defaultEnvironment } = stateconfig;
    const { user, host, appPath, port } = stateconfig.environments[`${defaultEnvironment}`]; // get Env

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
    let filteredPullFolders = pullFolders?.filter((i) => i);
    // Override Push or Pull Folders is set 
    if(stateconfig?.environments[`${defaultEnvironment}`]?.pullFolders){
      console.log(stateconfig?.environments[`${defaultEnvironment}`]?.pullFolders?.filter((i) => i))
      filteredPullFolders = stateconfig?.environments[`${defaultEnvironment}`]?.pullFolders?.filter((i) => i);
    }
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
      serverConfig: stateconfig?.environments[`${defaultEnvironment}`],
      isInteractive: isFlaggedStart,
      sshKeyPath: statelocalEnv?.SWIFF_CUSTOM_KEY,
    });

    // If the env can't be found then show a message
    if (remoteEnv instanceof Error) {
      handlesetMessage(
        colourNotice(
          `Consider adding an .env file on the remote server\n   at ${path.join(
            stateconfig?.environments[`${defaultEnvironment}`]?.appPath,
            ".env"
          )}`
        ),
        "message"
      );
    }
    // Set the name of the remote environment
    let remoteEnvironment = "";
    if (!(remoteEnv instanceof Error)) {
      remoteEnvironment = remoteEnv?.ENVIRONMENT;
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
    logger.info(`${output}`)
    return handlesetMessage(
      isEmpty(output)
        ? `No pull required, ${colourHighlight(
            remoteEnv?.DB_SERVER
          )} is already up-to-date!`
        : `Success! These are the local files that changed:\n${output}\n\nThe file pull${
            !isEmpty(remoteEnvironment)
              ? ` from ${colourHighlight(remoteEnvironment)}`
              : ""
          } was successful`,
      "success"
    );
  },
  composerPull: async ({
    stateconfig,
    handlesetMessage,
    stateremoteEnv,
    statelocalEnv,
    handlesetWorking,
    isFlaggedStart,
  }) => {
    const { environment } = stateconfig;
    const { user, host, appPath, port } = stateconfig.environments[`${environment}`]; // get Env
    // Share what's happening with the user
    handlesetWorking(`Backing up your local composer files`);
    // Backup the local composer files this command fail silently if the user doesn’t have composer files locally just yet
    await executeCommands(
      `cp composer.json ${pathConfigs.pathBackups}/${statelocalEnv?.DB_DATABASE}-local-composer.json && cp composer.lock ${pathConfigs.pathBackups}/${statelocalEnv?.DB_DATABASE}-local-composer.lock`
    );
    // Connect to the remote server
    const ssh = await getSshInit({
      host: host,
      user: user,
      port: port,
      sshKeyPath: statelocalEnv?.SWIFF_CUSTOM_KEY,
    });
    // If there's connection issues then return the messages
    if (ssh instanceof Error) return handlesetMessage(`${ssh}`, "error");
    // Share what's happening with the user
    handlesetWorking(
      `Fetching the composer files from the remote server at ${colourHighlight(
        host
      )}`
    );
    // Download composer.json from the remote server
    const sshDownload1 = await getSshFile({
      connection: ssh,
      from: path.join(appPath, "composer.json"),
      to: path.join(pathConfigs.pathApp, "composer.json"),
    });
    // If there's download issues then end the connection and return the messages
    if (sshDownload1 instanceof Error) {
      ssh.dispose();
      return handlesetMessage(
        `Error downloading composer.json\n\n${colourNotice(sshDownload1)}`,
        "error"
      );
    }
    // Download composer.lock from the remote server
    const sshDownload2 = await getSshFile({
      connection: ssh,
      from: path.join(appPath, "composer.lock"),
      to: path.join(pathConfigs.pathApp, "composer.lock"),
    });
    // If there's download issues then end the connection and return the messages
    if (sshDownload2 instanceof Error) {
      ssh.dispose();
      return handlesetMessage(
        `Error downloading composer.lock\n\n${colourNotice(sshDownload2)}`,
        "error"
      );
    }
    // Close the connection
    ssh.dispose();
    // Show a success message
    return handlesetMessage(
      `Your composer files were updated from ${colourHighlight(host)}`,
      "success"
    );
  },
  databasePull: async ({
    stateconfig,
    handlesetMessage,
    stateremoteEnv,
    statelocalEnv,
    handlesetWorking,
    isFlaggedStart,
  }) => {
    // Set some variables for later
    const { defaultEnvironment } = stateconfig;
    const { user, host, appPath, port } = stateconfig.environments[`${defaultEnvironment}`];
    const serverConfig = stateconfig.environments[`${defaultEnvironment}`];
    const localConfig = stateconfig?.local;
    const {
      SWIFF_CUSTOM_KEY,
      DB_SERVER,
      DB_PORT,
      DB_DATABASE,
      DB_USER,
      DB_PASSWORD,
    } = statelocalEnv;
    // Get the remote env file via SSH
    const remoteEnv = await getRemoteEnv({
      serverConfig: serverConfig,
      isInteractive: isFlaggedStart,
      sshKeyPath: SWIFF_CUSTOM_KEY,
    });
    // If the env can't be found then return a message
    if (remoteEnv instanceof Error) return handlesetMessage(remoteEnv);
    // Share what's happening with the user
    handlesetWorking(
      `Fetching ${colourHighlight(
        remoteEnv?.DB_DATABASE
      )} from ${colourHighlight(remoteEnv?.ENVIRONMENT)}`
    );
    // Set the remote database variables
    const remoteDbName = `${remoteEnv?.DB_DATABASE}-remote.sql`;
    const remoteDbNameZipped = `${remoteDbName}.gz`;
    const importFile = `${pathConfigs.pathBackups}/${remoteDbName}`;
    // Download and store the remote DB via SSH
    const dbSsh = await getSshDatabase({
      remoteEnv: remoteEnv,
      host: serverConfig.host,
      user: serverConfig.user,
      port: serverConfig.port,
      sshAppPath: serverConfig.appPath,
      gzipFileName: remoteDbNameZipped,
      sshKeyPath: SWIFF_CUSTOM_KEY,
      unzip: true,
    });
    // If there's any env issues then return the messages
    if (dbSsh instanceof Error) return handlesetMessage(dbSsh, "error");
    // Backup the existing local database
    const localBackupFilePath = `${pathConfigs.pathBackups}/${DB_DATABASE}-local.sql.gz`;
    const localDbDump = await doLocalDbDump({
      host: DB_SERVER,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_DATABASE,
      gzipFilePath: localBackupFilePath,
    });
    // If there's any local db backup issues then return the messages
    if (localDbDump instanceof Error) {
      return handlesetMessage(localDbDump, "error");
    }

    // Share what's happening with the user
    handlesetWorking(
      `Updating ${colourHighlight(DB_DATABASE)} on ${colourHighlight(
        DB_SERVER
      )}`
    );
    // Check if the user is running ddev, otherwise assume local database
    if (localConfig && localConfig?.ddev === true) {
      const importyDbtolocal = await doddevlocalDump(importFile);
      if (!isEmpty(importyDbtolocal?.err)) {
        return handlesetMessage(`${importyDbtolocal?.err}`, "error");
      }
    } else {
      // Drop the tables from the local database
      const dropTables = await doDropAllDbTables({
        host: DB_SERVER,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_DATABASE,
      });
      // If there's any dropping issues then return the messages
      if (dropTables instanceof Error)
        return String(dropTables).includes("ER_BAD_DB_ERROR: Unknown database ")
          ? handlesetMessage(
              `First create a database named ${colourNotice(
                DB_DATABASE
              )} on ${colourNotice(
                DB_SERVER
              )} with these login details:\n\nUsername: ${DB_USER}\nPassword: ${DB_PASSWORD}`,
              "error"
            )
          : handlesetMessage(
              `There were issues connecting to your local ${colourAttention(
                DB_DATABASE
              )} database\n\nCheck these settings are correct in your local .env file:\n\n${colourAttention(
                `DB_SERVER="${DB_SERVER}"\nDB_PORT="${DB_PORT}"\nDB_USER="${DB_USER}"\nDB_PASSWORD="${DB_PASSWORD}"\nDB_DATABASE="${DB_DATABASE}"`
              )}\n\n${colourMuted(String(dropTables).replace("Error: ", ""))}`,
              "error"
            );
      // Import the remote .sql into the local database
      const importDatabase = await doImportDb({
        host: DB_SERVER,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_DATABASE,
        importFile: importFile,
      });
      // If there's any import issues then return the messages
      if (importDatabase instanceof Error) {
        return handlesetMessage(
          `There were issues refreshing your local ${colourAttention(
            DB_DATABASE
          )} database\n\n${colourMuted(importDatabase)}`,
          "error"
        );
      }
      // Remove remote .sql working file
      await cmdPromise(`rm ${importFile}`);
    }
    // Show a success message
    return handlesetMessage(
      `Your ${colourHighlight(
        DB_DATABASE
      )} database was updated with the ${colourHighlight(
        remoteEnv.ENVIRONMENT
      )} database`,
      "success"
    );
  },
  folderPush: async ({
    stateconfig,
    handlesetMessage,
    stateremoteEnv,
    statelocalEnv,
    handlesetWorking,
    isFlaggedStart,
  }) => {
    // Set some variables for later
    const { defaultEnvironment, pushFolders } = stateconfig;
    const localEnv = statelocalEnv;
    const { SWIFF_CUSTOM_KEY } = localEnv;
    const serverConfig = stateconfig.environments[`${defaultEnvironment}`];
    const { user, host, appPath, port } = serverConfig;
    // Get the remote env file via SSH
    const remoteEnv = await getRemoteEnv({
      serverConfig,
      isInteractive: isFlaggedStart,
      sshKeyPath: SWIFF_CUSTOM_KEY,
    });
    // If the env can't be found then show a message
    if (remoteEnv instanceof Error) {
      handlesetWorking(
        colourNotice(
          `Consider adding an .env file on the remote server\n   at ${path.join(
            appPath,
            ".env"
          )}`
        )
      );
    }
    // Set the name of the remote environment
    let remoteEnvironment = "";
    if (!(remoteEnv instanceof Error))
      remoteEnvironment = remoteEnv.ENVIRONMENT;
    // Shame the user if they are pushing to production
    if (
      !isEmpty(remoteEnvironment) &&
      (remoteEnvironment === "production" || remoteEnvironment === "live")
    )
      handlesetWorking(
        colourNotice(
          `You’re pushing files straight to production,\nplease consider a more reliable way to deploy changes in the future`
        )
      );
    // Create a list of paths to push
    if (
      pushFolders === undefined ||
      !Array.isArray(pushFolders) ||
      isEmpty(pushFolders.filter((i) => i))
    )
      return handlesetMessage(
        `First specify some push folders in your ${colourNotice(
          configFileName
        )}\n\nFor example:\n\n${colourMuted(
          `{\n  `
        )}pushFolders: [ '${colourNotice("templates")}', '${colourNotice(
          "config"
        )}', '${colourNotice("public/assets/build")}' ]\n${colourMuted("}")}`,
        "error"
      );
    // Remove empty values from the array so users can’t accidentally upload the entire project
    const filteredPushFolders = pushFolders?.filter((i) => i);
    // Check if the defined local paths exist
    const hasMissingPaths = await getMissingPaths(
      filteredPushFolders,
      "pushFolders"
    );
    // If any local paths are missing then return the messages
    if (hasMissingPaths instanceof Error)
      return handlesetMessage(`${hasMissingPaths}`, "error");
    // Check if push folder option is valid
    const isPushFolderOptionsValid = validatePushFolderOptions(
      filteredPushFolders,
      "pushFolders"
    );
    // If any local paths are missing then return the messages
    if (isPushFolderOptionsValid instanceof Error)
      return handlesetMessage(`${isPushFolderOptionsValid}`, "error");
    // Share what's happening with the user
    handlesetWorking(
      `Pushing files in ${commaAmpersander(
        filteredPushFolders?.map((f) => (typeof f === "string" ? f : f.path))
      )}`
    );
    // Get the rsync push commands
    const pushCommands = getSshPushCommands({
      pushFolders: filteredPushFolders,
      user: user,
      host: host,
      port: port,
      workingDirectory: appPath,
      sshKeyPath: SWIFF_CUSTOM_KEY,
    });
    // Send the commands to the push task
    const pushStatus = await executeCommands(pushCommands);
    // Return the result to the user
    if (pushStatus instanceof Error) {
      return handlesetWorking(
        `There was an issue uploading the files\n\n${pushStatus}`,
        "error"
      );
    }
    const output = replaceRsyncOutput(pushStatus, stateconfig.pushFolders);
    return handlesetMessage(
      isEmpty(output)
        ? `No push required, ${
            !isEmpty(remoteEnvironment)
              ? `${colourHighlight(remoteEnvironment)}`
              : "the remote"
          } is already up-to-date`
        : `Success! These are the remote files that changed:\n${output}\n\nThe file push${
            !isEmpty(remoteEnvironment)
              ? ` to ${colourHighlight(remoteEnvironment)}`
              : ""
          } was successful`,
      "success"
    );
  },
};

const Tasks = ({ stateconfig, setConfig, isDisabled }) => {
  const [messages, setMessages] = React.useState([]);
  const [playSound, setPlaySound] = React.useState(false);
  const [statelocalEnv, setstatelocalEnv] = React.useState(null);
  const [stateremoteEnv, setRemoteEnv] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("");
  const [currentTask, setCurrenTask] = React.useState(null);
  const [isFlaggedStart, setisFlaggedStart] = React.useState(false);

  const handleSetup = async () => {
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
        defaultEnvironment: stateconfig?.defaultEnvironment,
        ...config,
      },
      !doesConfigExist,
      isInteractive
    );
    if (missingConfigSettings) {
      handlesetMessage(missingConfigSettings, "error");
      return false;
    }
    // Add/Update the config to the global state
    setConfig(() => {
      return {
        defaultEnvironment: stateconfig?.defaultEnvironment,
        local: config?.local,
        pushFolders: config?.pushFolders,
        pullFolders: config?.pullFolders,
        disabled: config?.disabled,
        environments: config?.environments,
      };
    });
    // Get the users env file
    const localEnv = await setupLocalEnv(isInteractive);
    // If there's anything wrong with the env then return an error
    if (localEnv instanceof Error) {
      handlesetMessage(`${localEnv}`, "error");
      return false;
    }
    if (!isEmpty(localEnv)) {
      setstatelocalEnv(localEnv);
    }
    // Get the users key we'll be using to connect with
    const user = await resolveUsername();
    // Check if the key file exists
    const sshKey = !isEmpty(localEnv?.SWIFF_CUSTOM_KEY)
      ? localEnv?.SWIFF_CUSTOM_KEY
      : `/Users/${user}/.ssh/id_rsa`;
    const doesSshKeyExist = await doesFileExist(sshKey);
    // If the key isn't found then show a message
    if (!doesSshKeyExist) {
      handlesetMessage(
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
      return false;
    }
    // Check the users SSH key has been added to the server
    const checkSshSetup = await executeCommands(
      getSshTestCommand(
        stateconfig?.environments[`${stateconfig?.defaultEnvironment}`].user,
        stateconfig?.environments[`${stateconfig?.defaultEnvironment}`].host,
        stateconfig?.environments[`${stateconfig?.defaultEnvironment}`].port,
        !isEmpty(localEnv.SWIFF_CUSTOM_KEY) ? localEnv.SWIFF_CUSTOM_KEY : null
      )
    );
    // If there's an issue with the connection then give some assistance
    if (checkSshSetup instanceof Error) {
      handlesetMessage(
        `A SSH connection couldn’t be made with these details:\n\nServer host: ${
          stateconfig?.environments[`${stateconfig?.defaultEnvironment}`]?.host
        }\nServer user: ${
          stateconfig?.environments[`${stateconfig?.defaultEnvironment}`]?.user
        }\nPort: ${
          stateconfig?.environments[`${stateconfig?.defaultEnvironment}`]?.port
        }\nSSH key: ${sshKey}\n\n${getSshCopyInstructions(
          {
            server: stateconfig?.environments[`${stateconfig?.defaultEnvironment}`],
          },
          sshKey
        )}\n\n${
          isEmpty(localEnv?.SWIFF_CUSTOM_KEY)
            ? `${chalk.bold(
                `Is the 'SSH key' path above wrong?`
              )}\nAdd the correct path to your project .env like this:\nSWIFF_CUSTOM_KEY="/Users/${user}/.ssh/id_rsa"`
            : ""
        }`
      );
      return false;
    }
    return { localEnv };
  };
  const handleEndTask = () => {
    if (!isTaskRunning(messages) && isFlaggedStart) {
      timersPromises.setTimeout(() => process.exit(), 500);
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
    setMessages((messages) => {
      return [...messages, { text: message, type: "working" }];
    });
  };
  const handleSelectTask = async (item) => {
    try {
      // if task is Disabled return
      if (isDisabled(item.value)) return;
      // do not run if task already runnning
      if (isTaskRunning(messages)) return;
      // Clear message for each task
      setMessages([]);
      // Headign for start task heading for each task
      handlesetMessage(item?.label, "heading");
      // Performing pre checks
      handlesetWorking("Performing pre-task checks");
      // Start the setup process
      setCurrenTask(item);
      // Start Setup
      const isSetup = await handleSetup();
      if (isSetup instanceof Error || isSetup == false) {
        // End the process after 500 ticks if started with flags
        return handleEndTask();
      }
      // check if chosen task not exist
      if (!TaskFunctions[`${item.value}`]) {
        return handlesetMessage(`No function found `, "error");
      }
      const user = await resolveUsername();
      logger.info(`${user} started Task : ${item.value}`);
      // // if exist start the chosen task
      await TaskFunctions[`${item.value}`]({
        stateconfig,
        stateremoteEnv,
        statelocalEnv: isSetup?.localEnv,
        isFlaggedStart,
        handlesetMessage,
        handlesetWorking,
      });
      // End the process after 500 ticks if started with flags
      return handleEndTask();
    } catch (error) {
      console.log(error);
    }
  };
  const handleTabChange = (name) => {
    if (isTaskRunning(messages)) {
      return false;
    }
    if (messages.length > 0) {
      setMessages([]);
    }
    setActiveTab(name);
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


  return (
    <Box flexDirection="column">
      <Tabs
        colors={{
          activeTab: {
            color: "none",
            backgroundColor: "none",
          },
        }}
        onChange={handleTabChange}
      >
        <Tab name="pull">
          <Text
            color={activeTab == "pull" ? hexHighlight : "`"}
            underline={activeTab == "pull"}
          >
            Pull
          </Text>
        </Tab>
        <Tab name="push">
          <Text
            color={activeTab == "push" ? hexHighlight : "`"}
            underline={activeTab == "push"}
          >
            Push
          </Text>
        </Tab>
        <Tab name="backs">
          <Text
            color={activeTab == "backs" ? hexHighlight : "`"}
            underline={activeTab == "backs"}
          >
            Terminal/Backups
          </Text>
        </Tab>
      </Tabs>
      <Box marginTop={1}>
        {activeTab === "pull" && (
          <CustomSelectTaskInput
            items={pullitems}
            currentTask={currentTask}
            isDisabled={(val) => isDisabled(val)}
            isTaskRunning={() => isTaskRunning(messages)}
            handleSelectTask={handleSelectTask}
          />
        )}
        {activeTab === "push" && (
          <CustomSelectTaskInput
            items={pushitems}
            currentTask={currentTask}
            isDisabled={(val) => isDisabled(val)}
            isTaskRunning={() => isTaskRunning(messages)}
            handleSelectTask={handleSelectTask}
          />
        )}
        {activeTab === "backs" && (
          <CustomSelectTaskInput
            items={backsitems}
            currentTask={currentTask}
            isDisabled={(val) => isDisabled(val)}
            isTaskRunning={() => isTaskRunning(messages)}
            handleSelectTask={handleSelectTask}
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
