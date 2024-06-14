import pino from "pino";
import pretty from 'pino-pretty';
import { createWriteStream, existsSync, mkdir } from "node:fs";
import path from "node:path";
import { appDirectory } from "./utils";
import { getConfig } from "./config";

const initializeLogger = async ()=>{
  const config = await getConfig();
  if (!config) {
      return
  }
  const resolveApp = (relativePath) => path.resolve(appDirectory,  relativePath);
  // const logFile = pino.destination();
  if(!existsSync(`${config?.logging?.target}`)){
    if(config?.logging?.target){
        mkdir(resolveApp(`${config?.logging?.target ?? "./"}`), (err) => {
            if (err) {
               process.exitCode(1);
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

const logger = await initializeLogger();

export default logger;