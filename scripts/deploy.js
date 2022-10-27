const hre = require("hardhat");
require("color");

async function main() {

  
  const USDT = await hre.ethers.getContractFactory("MB_ERC20");
  const usdt = await USDT.deploy("Tether", "USDT");
  await usdt.deployed();
  console.log("USDT Address:", usdt.address);

  
  const LPTOKEN = await hre.ethers.getContractFactory("MB_ERC20");
  const lp = await LPTOKEN.deploy("CAKE LP", "LP");
  await lp.deployed();
  console.log("LP Address:", lp.address);

  await lp.mint("0x28Dc1b43ebCd1A0A0B5AB1E25Fac0b82551207ef", "100000000000000000000000");  // 100 LP
  await usdt.mint("0x28Dc1b43ebCd1A0A0B5AB1E25Fac0b82551207ef", "100000000000000000000000");
  // await usdt.mint("0x42F9dcd93DDCB82ED531A609774F6304275DeeaD", "1000000000000000000000");
  // await usdt.mint("0x64882E1f672113B440F3d3B706516Df02ceEE0fD", "1000000000000000000000");
  // await usdt.mint("0xB8D41D37E52AB93C6518F94362027a772222f4da", "1000000000000000000000");
  
  const AUCTION = await hre.ethers.getContractFactory("AuctionContract");
  const auction = await AUCTION.deploy(usdt.address);
  await auction.deployed();
  console.log("Auction Address:", auction.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
