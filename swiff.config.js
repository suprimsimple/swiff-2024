/**
 * Swiff Project Configuration
 * Head to 'https://github.com/simple-integrated-marketing/swiff' for further information.
 */
// Remote SSH server details
/** @typedef {import("./resources/swiff.config").Config}  Config */
/** @type {Config} */
export default {
  // set Default Environment  | staging or production
  defaultEnvironment: "staging",
  logging:{
    enabled: true,      // Logging Enabled default
    //   target: '/'   // example  target: "./logs/"
  },
  environments: {
    staging: {
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
  pushFolders: [
    // 'templates',
    // { path: "config", exclude: "/project/*" },
    // 'public/dist'
  ],
  // Folders to pull new or changed files from
  pullFolders: [
    // 'public/assets/volumes'
  ],
  disabled: ["databasePush"],
};
