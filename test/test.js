const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");
const util = require('util')

const ROUTER_ABI = require("./abi/router_abi");
const FACTORY_ABI = require("./abi/factory_abi.json");
const PAIR_ABI = require("./abi/pair_abi");
const USDT_ABI = require("./abi/usdt");
let owner, user1, user2, user3, user4, user5, fee_1, fee_2, fee_3, fee_4;

let owner_usdt, usdt1, usdt2, usdt3, usdt4;
let uniswap, usdt, lp, auction, timestamp;
const timer = util.promisify(setTimeout);

describe("Test Auction Contract", function () {
  it("Get USDT Token Contract", async function () {
    [owner, user1, user2, user3, user4, user5, fee_1, fee_2, fee_3, fee_4] = await ethers.getSigners();

    usdt = await ethers.getContractAt(USDT_ABI, "0xdAC17F958D2ee523a2206206994597C13D831ec7");
    uniswap = await ethers.getContractAt(ROUTER_ABI, "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");

    const LPTOKEN = await hre.ethers.getContractFactory("MB_ERC20");
    lp = await LPTOKEN.deploy("CAKE LP", "LP");
    await lp.deployed();
    console.log("LP Address:", lp.address);
  });

  it("Deploy Auction Contract", async function () {
    const AUCTION = await hre.ethers.getContractFactory("AuctionContract");
    auction = await AUCTION.deploy(usdt.address);
    await auction.deployed();
  });

  it("Set Fee wallets", async function() {
    await auction.setFee(fee_1.address, fee_2.address, fee_3.address, fee_4.address, 100, 50, 25, 25)
  })

  it("Mint Test tokens: USDT, LP", async function () {   // 1000 LP, 1000 USDT
    timestamp = new Date().getTime();
    timestamp = (timestamp - timestamp % 1000) / 1000;
    await lp.mint(owner.address, "1000000000000000000000");
    await lp.mint(user1.address, "1000000000000000000000");

    await uniswap.swapExactETHForTokens(0, ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", usdt.address], owner.address, timestamp + 100, {value: '10000000000000000000'});
    await uniswap.connect(user1).swapExactETHForTokens(0, ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", usdt.address], user1.address, timestamp + 100, {value: '10000000000000000000'});
    await uniswap.connect(user2).swapExactETHForTokens(0, ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", usdt.address], user2.address, timestamp + 100, {value: '10000000000000000000'});
    await uniswap.connect(user3).swapExactETHForTokens(0, ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", usdt.address], user3.address, timestamp + 100, {value: '10000000000000000000'});

    
    expect(await lp.balanceOf(owner.address)).to.equal("1000000000000000000000");
    expect(await lp.balanceOf(user1.address)).to.equal("1000000000000000000000");
    owner_usdt = await usdt.balanceOf(owner.address);
    usdt1 = await usdt.balanceOf(user1.address);
    usdt2 = await usdt.balanceOf(user2.address);
    usdt3 = await usdt.balanceOf(user3.address);
  });

  it("Lock LP : 2", async function () {   // 1000 LP, 1000 USDT
    await lp.approve(auction.address, "1000000000000000000000");
    await auction.lockToken(lp.address, timestamp + 60, "1000000000000000000000");
    await lp.connect(user1).approve(auction.address, "1000000000000000000000");
    await auction.connect(user1).lockToken(lp.address, timestamp + 40, "1000000000000000000000");

    expect(await auction.poolCount()).to.equal(3); // okay, 2 + 1(0)
  });

  it("Start Auction : pool_id_1", async function () {   // 1000 LP, 1000 USDT
    await auction.startAuction(1, "10000000000", timestamp + 40); //10$
    expect(await auction.auctionCount()).to.equal(2); // okay, 1 + 1(0)
  });

  it("Bid : auction_id_1", async function() {
    await usdt.connect(user2).approve(auction.address, "20000000000");
    await auction.connect(user2).bid(1, "15000000000");
  });

  
  it("Bid Failure: low price", async function() {
    await usdt.connect(user3).approve(auction.address, "20000000000");
    expect(auction.connect(user3).bid(1, "12000000000")).to.be.revertedWith("");
  });
  
  it("Bid Failure: no auction", async function() {
    expect(auction.connect(user3).bid(2, "18000000000")).to.be.revertedWith("");
  });

  it("Bid : auction_id_1, new buyer", async function() {
    await auction.connect(user3).bid(1, "17000000000");
  });

  it("Bid loser: USDT refunding check", async function() {
    expect(await usdt.balanceOf(user2.address)).to.equal(usdt2.toString());
  }); 

  it("Stop auction: auction_id_1", async function() {
    await auction.stopAuction(1);
  })

  it("withdraw from pool: failure(have to withdraw from auction)", async function() {
    expect(auction.withdrawPool(1)).to.revertedWith("");
  })

  it("withdraw from auction", async function() {
    await auction.connect(user3).withdrawAuction(1);
    expect(await lp.balanceOf(user3.address)).to.equal("1000000000000000000000")
  })

  it("Start Auction : pool_id_2", async function () {   // 1000 LP, 1000 USDT
    await auction.connect(user1).startAuction(2, "10000000000000000000", timestamp + 30); //10$
    expect(await auction.auctionCount()).to.equal(3); // okay, 1 + 1(0)
  });
});