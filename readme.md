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
`npm install --global swiff-4@latest`

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
{
  // set Default Environment  | staging or production
  defaultEnvironment: "staging",
  logging:{
    enabled: true,      // Logging Enabled default
    //   target: '/'   // example  target: "./logs/" (from root folder)
  },
  environments: {
    staging: {
      user: "",    // The SSH login username
      host: "",   // The IP/hostname of the remote server |  host: '100.100.100.100',
      appPath: "",    // The working directory of the remote app folder |  appPath: '/srv/users/[user]/apps/[app]',
      port: 22,// The SSH port to connect on (22 is the SSH default)
      // To override Push or Pull Folders for specific environment add pushFolders | pullFolders
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


    // "build:cjs": "rollup build/index.js --file build/bundle.js --format cjs --plugins @rollup/plugin-commonjs",
    // "build": "npm run build:module && npm run build:cjs",