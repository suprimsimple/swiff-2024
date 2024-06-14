/** @typedef {import("./resources/swiff.config").Config}  Config */
/** @type {Config} */
export default {
  defaultEnvironment: "staging",
  logging:{
      enabled: false,
  },
  environments: {
    staging: {
        // The SSH login username
        user: "sterlinghomes",
        // The IP/hostname of the remote server
        // host: '100.100.100.100',
        host: "139.180.178.70",
        // The working directory of the remote app folder
        // appPath: '/srv/users/[user]/apps/[app]',
        appPath: "/srv/users/sterlinghomes/apps/sterlinghomes",
        // The SSH port to connect on (22 is the SSH default)
        port: 22,
    },
    production: {
      // The SSH login username
      user: "sterlinghomes",
      // The IP/hostname of the remote server
      // host: '100.100.100.100',
      host: "139.180.178.70",
      // The working directory of the remote app folder
      // appPath: '/srv/users/[user]/apps/[app]',
      appPath: "/srv/users/sterlinghomes/apps/sterlinghomes",
      // The SSH port to connect on (22 is the SSH default)
      port: 22,
    },
  },
  local: {
    ddev: true,
  },
  // Folders to upload and sync with the server
  pushFolders: ["test"],
  // Folders to pull new or changed files from
  pullFolders: ["templates"],
  disabled: ["databasePush","foldersPush"],
};
