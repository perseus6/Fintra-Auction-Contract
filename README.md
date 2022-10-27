# BEP20 IYAL Token

Create a new token(BEP20: IYAL) and ICO Smart contract with airdrop functionality.

```shell
npx hardhat compile
```
```shell
npx hardhat run scripts/deploy.js --network bsctestnet
```
```shell
npx hardhat verify 0xab0----------c0 --network bsctestnet
```

### 1. hardhat write config
Get the APIkey address under [ethScan](https://etherscan.io/myapikey) or [bscScan](https://bscscan.com/myapikey) personal information 
```shell
cp hardhat.config.js.example hardhat.config.js

// modify hardhat.config.js
const INFURA_PROJECT_ID = "00e8...2b41";
const ROPSTEN_PRIVATE_KEY = "07f1c38b7318fc6bd5e958...e3";
apiKey: "EQF6AY17HK1574GNC...", // eth
```
