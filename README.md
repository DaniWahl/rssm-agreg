#Aktienregister Schulgebäude RSSM

Datenbank und Applikation zur Verwaltung des Aktienregisters der AG Schulgebäude RSSM.

##Prerequisite for building**

requires NodeJS version 16

##Installation

1. clone this repo from Github
2. to install & build dependencies run the follwing commands:
```
npm install
npm run postinstall
```

##Run from source
```
npm run start
```

##Build for Windows
this needs to be executed on a Windows 10 environment
```
npm run build-win
```

##Build for Mac
this needs to be executed on a Mac OS environment
```
npm run build-mac
```

##Build for Windows and deplpoy new release to GitHub
this needs to be executed on a Windows 10 environment and requires a GH_TOKEN variable to be set.
```
npm run deploy-win
```

##Build for Mac and Deploy new release on GitHub
this needs to be executed on a Mac OS environment and requires a GH_TOKEN variable to be set.
```
npm run deploy-mac
```
