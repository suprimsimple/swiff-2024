interface LoggingConfig {
    enabled: boolean;
    target?: string;
}

interface EnvironmentConfig {
    user: string;
    host: string;
    appPath: string;
    port: number;
    pushFolders?: Array<string | Object>;
    pullFolders?: Array<string>;
}

interface LocalConfig {
    ddev: boolean;
}
interface Environments  {
    staging: EnvironmentConfig;
    production: EnvironmentConfig;
};
type Actions  = "databasePush" | "foldersPush";
type defaultEnvironment  = "staging" | "production";

export interface Config {
    defaultEnvironment: defaultEnvironment;
    logging: LoggingConfig;
    environments: Environments;
    local: LocalConfig;
    pushFolders: Array<string | Object>;
    pullFolders: Array<string>;
    disabled: Actions[];
}

