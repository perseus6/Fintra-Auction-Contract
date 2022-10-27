const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");
const util = require('util')

var owner, user1, user2, user3, user4, user5, fee_1, fee_2, fee_3, fee_4;

let usdt, lp, auction, timestamp;
const timer = util.promisify(setTimeout);

describe("Test Token Contract", function () {
  it("Deploy Token", async function () {
    [owner, user1, user2, user3, user4, user5, fee_1, fee_2, fee_3, fee_4] = await ethers.getSigners();

    const USDT = await hre.ethers.getContractFactory("MB_ERC20");
    usdt = await USDT.deploy("Tether", "USDT");
    await usdt.deployed();
    console.log("USDT Address:", usdt.address);

    
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
    await lp.mint(owner.address, "1000000000000000000000");
    await lp.mint(user1.address, "1000000000000000000000");
    await usdt.mint(user2.address, "1000000000000000000000");
    await usdt.mint(user3.address, "1000000000000000000000");
    await usdt.mint(user4.address, "1000000000000000000000");
    await usdt.mint(user5.address, "1000000000000000000000");  
    
    expect(await lp.balanceOf(owner.address)).to.equal("1000000000000000000000");
    expect(await lp.balanceOf(user1.address)).to.equal("1000000000000000000000");
    expect(await usdt.balanceOf(user2.address)).to.equal("1000000000000000000000");
    expect(await usdt.balanceOf(user3.address)).to.equal("1000000000000000000000");
    expect(await usdt.balanceOf(user3.address)).to.equal("1000000000000000000000");
    expect(await usdt.balanceOf(user4.address)).to.equal("1000000000000000000000");
  });

  it("Lock LP : 2", async function () {   // 1000 LP, 1000 USDT
    timestamp = new Date().getTime();
    timestamp = (timestamp - timestamp % 1000) / 1000;
    await lp.approve(auction.address, "1000000000000000000000");
    await auction.lockToken(lp.address, timestamp + 60, "1000000000000000000000");
    await lp.connect(user1).approve(auction.address, "1000000000000000000000");
    await auction.connect(user1).lockToken(lp.address, timestamp + 40, "1000000000000000000000");

    expect(await auction.poolCount()).to.equal(3); // okay, 2 + 1(0)
  });

  it("Start Auction : pool_id_1", async function () {   // 1000 LP, 1000 USDT
    await auction.startAuction(1, "10000000000000000000", timestamp + 30); //10$

    expect(await auction.auctionCount()).to.equal(2); // okay, 1 + 1(0)
  });

  it("Bid : auction_id_1", async function() {
    await usdt.connect(user2).approve(auction.address, "20000000000000000000");
    await auction.connect(user2).bid(1, "15000000000000000000");

    const auctionStatus = await auction.auctions(1);
    // console.log("Auctions", auctionStatus);
  });

  
  it("Bid Failure: low price", async function() {
    await usdt.connect(user3).approve(auction.address, "12000000000000000000");
    expect(auction.connect(user3).bid(1, "12000000000000000000")).to.be.revertedWith("");
  });
  
  it("Bid Failure: no auction", async function() {
    expect(auction.connect(user3).bid(2, "15000000000000000000")).to.be.revertedWith("");
  });

  it("Bid : auction_id_1, new buyer", async function() {
    await usdt.connect(user3).approve(auction.address, "20000000000000000000");
    await auction.connect(user3).bid(1, "18000000000000000000");

    const auctionStatus = await auction.auctions(1);
    // console.log("Auctions", auctionStatus);
  });

  it("Bid loser: USDT refunding check", async function() {
    expect(await usdt.balanceOf(user2.address)).to.equal("1000000000000000000000");
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