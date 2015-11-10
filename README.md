# gcci-model

## Development Prerequisite
- node.js and npm (npm is included in node.js)

## Development
1. clone repository
2. navigate into directory
3. run `npm install -g gulp` to install gulp
4. run `npm install` to install local node.js modules
5. compile static files
  - run `gulp compile` to manually compile files
  - run `gulp watch` to watch any file change and compile automatically

## Local Server
1. run `node server` to start local server
2. launch browser and access the site `http://localhost:8080`

## Deployment
0. run `npm install -g firebase-tools` to install Firebase tools
1. run `firebase deploy`
2. Launch browser and access the site `https://gcci-model.firebaseapp.com`
