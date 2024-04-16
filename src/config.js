import fs from "fs-extra";
import * as _ from "lodash";
import path from "path";
import { fileURLToPath } from "url";
import { resolveApp } from "./utils";

export const configFileName = "swiff.config.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const pathConfigs = {
  pathApp: resolveApp(""),
  pathConfig: resolveApp(`${configFileName}`),
  pathLocalEnv: resolveApp(".env"),
  pathConfigTemplate: path.resolve(__dirname, `../resources/${configFileName}`),
  pathLocalEnvTemplate: path.resolve(__dirname, "../resources/.env"),
  pathBackups: path.resolve(__dirname, "../backups"),
  pathMedia: path.resolve(__dirname, "../resources"),
};

const createConfig = (
  fromPath = pathConfigs.pathConfigTemplate,
  toPath = pathConfigs.pathConfig
) => fs.copy(fromPath, toPath);

const setupConfig = async (hasNewConfig, isInteractive) => {
  // Get config contents
  const config = await getConfig();
  // Build a list of any missing config options
  const missingConfigSettings = getConfigIssues(
    config,
    hasNewConfig,
    isInteractive
  );
  // Return the missing settings or the whole env
  return missingConfigSettings ? new Error(missingConfigSettings) : config;
};

const getConfig = async () => {
  // Make sure we pull a config freshie if user happens to update the options
  delete require.cache[require.resolve(pathConfigs.pathConfig)];
  // Load the user config and extract data
  const config = await new Promise((resolve) =>
    resolve(require(pathConfigs.pathConfig))
  );
  return config;
};

// Check that the required config settings exist
const getConfigIssues = (config, hasNewConfig, isInteractive = false) => {
  const requiredSettings = [
    "server.user",
    "server.host",
    "server.appPath",
    "server.port",
  ];
  // Loop over the array and match against the keys in the users config
  const missingSettings = requiredSettings.filter(
    (setting) =>
      _.get(config, setting) === undefined ||
      _.get(config, setting).length === 0
  );
  // Return the error if any
  return !isEmpty(missingSettings)
    ? `Add the following ${
        missingSettings.length > 1 ? "values" : "value"
      } to your ${
        hasNewConfig
          ? `new config:\n${colourNotice(pathConfigs.pathConfig)}`
          : `${colourNotice(configFileName)}:`
      }\n\n${missingSettings
        .map((s, i) => `${colourNotice(`— `)} ${s}`)
        .join("\n")}\n\n${
        isInteractive ? `Then hit [ enter ↵ ] to rerun this task` : ``
      }
        `
    : null;
};

export { setupConfig, getConfig, createConfig };
