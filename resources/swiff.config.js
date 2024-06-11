/**
 * Swiff Project Configuration
 * Head to 'https://github.com/simple-integrated-marketing/swiff' for further information.
 */
// Remote SSH server details
export default {
  // set Default Environment  | staging or production
  defaultEnironment: "staging",
  environments: {
    staging: {
      user: "",    // The SSH login username
      host: "",   // The IP/hostname of the remote server |  host: '100.100.100.100',
      appPath: "",    // The working directory of the remote app folder |  appPath: '/srv/users/[user]/apps/[app]',
      port: 22,// The SSH port to connect on (22 is the SSH default)
      // To Override Push or Pull Folders for environment add pushFolders | pullFolders
    },
    production: {
      user: "",    // The SSH login username
      host: "",  // The IP/hostname of the remote server | host: '100.100.100.100',
      appPath: "",     // The working directory of the remote app folder | appPath: '/srv/users/[user]/apps/[app]',
      port: 22, // The SSH port to connect on (22 is the SSH default)
       // To Override Push or Pull Folders for environment add pushFolders | pullFolders
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
