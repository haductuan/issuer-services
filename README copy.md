# issuer-server

## > Getting Started

### Step 1: Set up the Development Environment

You need to set up your development environment before you can do anything.

Install [Node.js and NPM](https://nodejs.org/en/download/)

Install MongoDB

### Step 2: Setup the project

Fork or download this project.

Then copy the `.env.example` file and rename it to `.env`. In this file you have to add your database connection information, your port to run server, password for generate issuerAuthClaim, your PubKeyX, PubKeyY of your issuerAuthClaim, stateTransitionContract address, RPC Provider, ziden_server_uri.
Create a new database with the name you have in your `.env`-file.


Copy the `secret.example.json` file and rename it to `secret.json`. In this file, you have to add your wallet private key in field `pk`.


Install dependencies
```
npm i
```

### Step 3: Start the server

Run
```
npm start
```

## > API Routes

Access API Docs at
```
http[s]:<hostname>[:<port>]/api-docs
```

## > Project Structure

| Name                              | Description |
| --------------------------------- | ----------- |
| **level_db_*/**                   | Fast key-value storage to store your trees |
| **logs/**                         | Logs of the running process  |
| **pkg/**                          | Packages used in current project |
| **src/**                          | Source files |
| **src/common/**                   | Setup common variables and functions |
| **src/controllers/**              | REST API Controllers |
| **src/lib/**                      | The core features like logger and env variables |
| **src/routes/**                   | Routing configuration |
| **src/services/**                 | Services layer |
| **src/util/**                     | General purposed utility functions |
| **swagger/**                      | Your swagger config |
| .env.example                      | Environment configurations example |
| secret.example.json               | Your wallet private key example |

## > Docker




