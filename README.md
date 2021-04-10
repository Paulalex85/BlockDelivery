# BlockDelivery

[![Build Status](https://travis-ci.com/Paulalex85/BlockDelivery.svg?branch=master)](https://travis-ci.com/Paulalex85/BlockDelivery)
[![Coverage Status](https://coveralls.io/repos/github/Paulalex85/BlockDelivery/badge.svg?branch=master)](https://coveralls.io/github/Paulalex85/BlockDelivery?branch=master)

Decentralized app for package delivery or logistics. Buy, sell, delivery without central party. This repository contains React website in the `/app` folder and Solidity contracts in `/contracts`.  

## Features

* Create an order with a buyer, seller and delivery man
* Delivery flow from order creation, package ready, pick up and delivered
* Escrow customizable to avoid thefts, scams
* Amicable resolution flow in case of problem (Package destroyed/damaged in transport, wrong product, mistakes)

## Contracts
### Setup

Need NodeJS for running [Truffle Suite](https://www.trufflesuite.com/docs/truffle/getting-started/installation)

Then run ```npm install -g truffle```

Compile/publish contracts :
```
cd BlockDelivery
npm install
truffle develop
```

Then in truffle console
```
compile
migrate
```

It's now possible to interact with them on localhost:8545

### Run tests

Simply run ```npm run test```

## App
### Setup

```
cd app
npm install
npm run start
```

Localhost started at http://localhost:3000