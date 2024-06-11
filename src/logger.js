import pino from "pino";
import pretty from 'pino-pretty';
import { createWriteStream } from "node:fs";
import path from "node:path";
import { appDirectory } from "./utils";
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);
// const logFile = pino.destination();
const logFilePath =resolveApp('swiff.log');
const logStream = createWriteStream(logFilePath, { flags: 'a' });
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      destination: logFilePath,
      mkdir: true,   
      colorize: false,  
    },
    level: 'info',   
  },
}, logStream);

export default logger;