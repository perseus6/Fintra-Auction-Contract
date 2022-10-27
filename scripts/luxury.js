const hre = require("hardhat");
require("color");

async function main() {

  const ERC20 = await hre.ethers.getContractFactory("LuxuryShares");
  const erc20 = await ERC20.deploy();
  await erc20.deployed();
  console.log("Luxury Address:", erc20.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
