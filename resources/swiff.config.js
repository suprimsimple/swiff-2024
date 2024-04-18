/**
 * Swiff Project Configuration
 * Head to 'https://github.com/simple-integrated-marketing/swiff' for further information.
 */

// Remote SSH server details
export default {
  // set Default Environment  staging, production, etc !make sure server consits server with environment name
  environment: "staging",
  server: {
    staging: {
      // The SSH login username
      user: "",
      // The IP/hostname of the remote server
      // host: '100.100.100.100',
      host: "",
      // The working directory of the remote app folder
      // appPath: '/srv/users/[user]/apps/[app]',
      appPath: "",
      // The SSH port to connect on (22 is the SSH default)
      port: 22,
    },
    production: {
      // The SSH login username
      user: "",
      // The IP/hostname of the remote server
      // host: '100.100.100.100',
      host: "",
      // The working directory of the remote app folder
      // appPath: '/srv/users/[user]/apps/[app]',
      appPath: "",
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
    // 'config',
    // 'public/assets/build'
  ],
  // Folders to pull new or changed files from
  pullFolders: [
    // 'public/assets/volumes'
  ],
  disabled: ["databasePush"],
};
