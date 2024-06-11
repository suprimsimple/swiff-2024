NOTE: Currently in Development (Will merge to Swiff after approval)

# Swiff 2024
Swiff saves you time with common SSH tasks during the development of websites/apps

🚀 **Folder push and pull**<br>
Keep folders in sync between servers

💫 **Database push and pull**<br>
Manage the database between servers (auto backup)

🎩 **Composer file push and pull**<br>
Move composer files between servers (auto backup)

💻 **Remote terminal connection**<br>
Launch a SSH session directly into the remote site/app folder

💻 **Logger**<br>
```swiff.log``` available to see all logs 

## Getting started

1. Install Swiff globally with npm:<br>
`npm install --global swiff-4`

2. Run
`swiff-4`

## Additional features

- Custom SSH identity: Swiff will attempt to use your identity located at: `/Users/[currentUser]/.ssh/id_rsa`<br>
You can specify a custom SSH key path in your .env file with:<br>
`SWIFF_CUSTOM_KEY="/Users/[your-user]/.ssh/[key-filename]"`
- Gzipped backups: Your files and database get backed up and gzipped whenever they change
- Disable specific tasks: Specify the tasks to disable with a config setting

## Requirements
This plugin requires an LTS Node version (v16.0.0+).
filename: ```swiff.config.js``` add to root of your application.
```js
/**
 * Swiff Project Configuration
 * Head to 'https://github.com/simple-integrated-marketing/swiff' for further information.
 */
// Remote SSH server details
export default {
  // set Default Environment  staging, production, etc !make sure server config consits with environment name
  defaultEnvironment: "staging",
  environments: {
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

  },
  local: {
    ddev: true,
  },
  // Folders to upload and sync with the server
  pushFolders: [
    // 'templates',
    // 'config',
    // { path: "config", exclude: "/project/*" },
  ],
  // Folders to pull new or changed files from
  pullFolders: [
    // 'public/assets/volumes'
  ],
  disabled: ["databasePush"],
};
```
Works with mysql database and ddev ( requires local.ddev = true)


## Technology

- [Node.js](https://nodejs.org/en/) - A JavaScript runtime built on Chrome's V8 JavaScript engine
- [Ink 2](https://github.com/vadimdemedes/ink) - React for interactive command-line apps
- [Babel](https://babeljs.io/) - JavaScript transpiling
- [Rollup](https://rollupjs.org/) - JavaScript module bundler
- [Prettier](https://github.com/prettier/prettier) - Code cleaning

## Credits

Sounds by [Emoji Sounds](https://icons8.com/sounds)<br>
Created by [@benrogerson](https://twitter.com/benrogerson) and Sam Stevens
Updated & Maintained by [@suprim12](https://suprimgolay.com.np/) 

Swiff has been agency battletested by [Simple](https://simple.com.au) who specialise in Craft CMS websites
