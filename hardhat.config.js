require("@nomiclabs/hardhat-waffle");
require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-etherscan");
const { mnemonic } = require('./secrets.json');

task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    hardhat: {
      forking: {
        url: "https://mainnet.infura.io/v3/47496038bd364787a6d40465bec384dc",
        blockNumber: 14390000
      }
    },
    testbsc: {
      url: `https://data-seed-prebsc-2-s2.binance.org:8545`,
      accounts: {mnemonic: mnemonic},
    },
    mainbsc: {
      url: `https://bsc-dataseed1.binance.org`,
      accounts: {mnemonic: mnemonic},
    }
  },
  solidity: {
  version: "0.8.4",
  settings: {
    optimizer: {
      runs: 200,
      enabled: true
    }
   }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 20000
  },
  etherscan: {
    apiKey: "NFXES6PDMHSHKXWBBVIXB5BYICPT5UNB9D"
  }
};