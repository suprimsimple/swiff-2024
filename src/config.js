import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "node:url";
import { appDirectory, resolveApp } from "./utils";
// import { createRequire } from "node:module";
import { colourNotice } from "./colors";
// const require = createRequire(import.meta.url);
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
  // const missingConfigSettings = getConfigIssues(
  //   config,
  //   hasNewConfig,
  //   isInteractive
  // );
  // missingConfigSettings ? new Error(missingConfigSettings) : config
  // Return the missing settings or the whole env
  return config;
};

const getConfig = async () => {
  try {
    const cacheBuster = Date.now();
    const configPath = `${path.resolve(
      appDirectory,
      configFileName
    )}?cacheBuster=${cacheBuster}`; // Removes cache get fresh config
    const configModule = await import(configPath);
    return configModule.default;
  } catch (error) {
    console.error("Error loading config:", error);
    throw error;
  }
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
  const missingSettings = Object.values(config.server[`${config?.environment}`])
    ?.map((item) => item == undefined || item.length <= 0)
    .includes(true);
  // Return the error if any
  return missingSettings
    ? `Add the following ${
        requiredSettings.length > 1 ? "values" : "value"
      } to your ${
        hasNewConfig
          ? `new config:\n${colourNotice(pathConfigs.pathConfig)}`
          : `${colourNotice(configFileName)}:`
      }\n\n${requiredSettings
        .map((s, i) => `${colourNotice(`— `)} ${s}`)
        .join("\n")}\n\n${
        isInteractive ? `Then hit [ enter ↵ ] to rerun this task` : ``
      }`
    : false;
};

export { setupConfig, getConfig, createConfig, getConfigIssues };
