import pino from "pino";
import { createWriteStream, existsSync, mkdir } from "node:fs";
import path from "node:path";
import chalk from 'chalk'
import { appDirectory, doesFileExist } from "./utils";
import { createConfig, getConfig, pathConfigs } from "./config";

const initializeLogger = async ()=>{
    // Config Checks
    const doesConfigExist = await doesFileExist(pathConfigs.pathConfig);
    if (!doesConfigExist) {
        await createConfig();
        console.log(chalk.green.bold("✅ Config has been created, please update the config file."));
        process.exit();
    }
    const config = await getConfig();
    if (!config) {
        console.log(chalk.red.bold("❌ No config found, please check your root folder."));
        process.exit(); 
    }
  const resolveApp = (relativePath) => path.resolve(appDirectory,  relativePath);
  // const logFile = pino.destination();
  if(!existsSync(`${config?.logging?.target}`)){
    if(config?.logging?.target){
        mkdir(resolveApp(`${config?.logging?.target ?? "./"}`), (err) => {
            if (err) {
               process.exit();
            }
        });
    }
  };
  const logFilePath = resolveApp(`${config?.logging?.target ?? "./"}swiff.log`);
  const logStream = createWriteStream(logFilePath, { flags: 'a' });
  const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            destination: logFilePath,
            mkdir: true,   
            colorize: false, 
        },
    },
    enabled: config?.logging?.enabled ?? true
}, logStream);

return logger;
}



export  {initializeLogger}