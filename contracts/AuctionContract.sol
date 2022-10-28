// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC20.sol";
import "./SafeERC20.sol";

/*===================================================
    OpenZeppelin Contracts (last updated v4.5.0)
=====================================================*/

contract AuctionContract is Ownable {
    using SafeERC20 for IERC20;
    IERC20 private usdtToken;

    // wallets  to withdraw auction fee
    address public wallet_1;
    address public wallet_2;
    address public wallet_3;
    address public wallet_4;

    uint8 public fee_1;
    uint8 public fee_2;
    uint8 public fee_3;
    uint8 public fee_4;

    struct LockPool {
        address owner;
        address token;
        uint256 amount;
        uint256 releaseTime;
        uint256 auctionId;
        bool isWithdrawn;
    }

    struct Auction {
        uint256 poolId;
        uint256 minPrice;
        uint256 feeAmount;
        uint256 topBid;
        address topBidder;
        uint256 auctionEndTime;
        bool status;
    }

    mapping(uint256 => LockPool) public pools;
    mapping(uint256 => Auction) public auctions;
    uint256 public auctionCount = 1;
    uint256 public poolCount = 1;

    /**
     * @dev Initialize with token address and round information.
     */
    constructor (address _usdtToken) Ownable() {
        usdtToken = IERC20(_usdtToken);
    }
    
    receive() payable external {}
    fallback() payable external {}

    function lockToken(address _baseToken, uint256 _releaseTime, uint256 _amount) public { // lock liquidity tokens
        require(_baseToken != address(0), "invalid_token");
        require(_releaseTime > block.timestamp, "incorrect_release_time");
        require(_amount > 0, "zero_amount");

        IERC20 token = IERC20(_baseToken);
        require(token.balanceOf(msg.sender) >= _amount, "insufficient_amount");
        require(token.allowance(msg.sender, address(this)) >= _amount, "not_approved");
        token.transferFrom(msg.sender, address(this), _amount);

        LockPool memory newPool;
        newPool.owner = msg.sender;
        newPool.token = _baseToken;
        newPool.amount = _amount;
        newPool.releaseTime = _releaseTime;
        newPool.auctionId = 0;
        newPool.isWithdrawn = false;

        pools[poolCount] = newPool;
        poolCount ++;
    }

    function startAuction(uint256 _poolId, uint256 _minPrice, uint256 _finishAuctionTime) public {  //Start Auction for looked lp
        require(_poolId != 0 && _poolId <= poolCount, "no_pool_exists");
        LockPool storage pool = pools[_poolId];
        require(pool.auctionId == 0, "already_started!");
        require(pool.releaseTime > block.timestamp, "lock_pool_released");
        require(pool.releaseTime > _finishAuctionTime, "incorrect_auction_limit_time");
        require(msg.sender == pool.owner, "not_pool_owner");

        Auction memory newAuction; //Create new Auction
        newAuction.poolId = _poolId;
        newAuction.minPrice = _minPrice;
        newAuction.feeAmount = 0;
        newAuction.topBid = _minPrice; // minimum price
        newAuction.topBidder = address(0); // No proposal yet
        newAuction.auctionEndTime = _finishAuctionTime;
        newAuction.status = true;
        
        auctions[auctionCount] = newAuction;
        pool.auctionId = auctionCount;
        auctionCount ++;
    }

    function stopAuction(uint256 _auctionId) public {   // stop auction with currect top price
        require(_auctionId != 0 && _auctionId < auctionCount, "no_auction_exists");
        Auction storage auction = auctions[_auctionId];
        LockPool storage pool = pools[auction.poolId];
        require(msg.sender == pool.owner, "not_owner");
        require(auction.status, "Auction not started");
        auction.status = false;
    }

    function bid(uint256 _auctionId, uint256 price) public { //bid at high price
        require(_auctionId != 0 && _auctionId < auctionCount, "no_auction_exists");
        Auction storage auction = auctions[_auctionId];

        require(auction.status, "auction_not_started");
        require(auction.auctionEndTime > block.timestamp, "Auction finished");
        require(auction.topBid < price, "low_price"); 

        uint256 feeAmount = price * fee_1 / 10000; // 25 for 0.25% fee_1
        feeAmount += price * fee_2 / 10000; // 100 for 1.0%
        feeAmount += price * fee_3 / 10000;
        feeAmount += price * fee_4 / 10000;

        require(usdtToken.balanceOf(msg.sender) >= price + feeAmount, "insufficient_funds"); 
        require(usdtToken.allowance(msg.sender, address(this)) >= price + feeAmount, "Not approved!");

        usdtToken.safeTransferFrom(msg.sender, address(this), price + feeAmount); // funding from new buyer
        if(auction.topBidder != address(0)) { //refudning to last buyer
            usdtToken.safeTransfer(auction.topBidder, auction.topBid + auction.feeAmount); //refund all USDT to last buyer
        }

        auction.topBid = price;             // update topbidding price
        auction.feeAmount = feeAmount;      // update paid fee amount
        auction.topBidder = msg.sender;     // top buyers
    }

    /**
     * @dev Withdraw  baseToken token from this contract.
     */
    function withdrawAuction(uint256 _auctionId) public { // If auctions started, lp token cab be withdrawn on this method only
        require(_auctionId != 0 && _auctionId < auctionCount, "no_auction_exists");
        Auction storage auction = auctions[_auctionId];
        LockPool storage pool = pools[auction.poolId];

        // require(auction.status == "finished", "not_finished_yet");
        require(!auction.status || auction.auctionEndTime >= block.timestamp, "not_finished_yet");
        require(msg.sender == auction.topBidder, "not_buyer");
        require(!pool.isWithdrawn, "already_done");

        if(auction.topBidder == address(0)) { // no buyers to this auction
            IERC20 token = IERC20(pool.token);
            token.transfer(pool.owner, pool.amount);
        } else { // someone buy locked token, distribute fee
            uint256 fee_total = fee_1 + fee_2 + fee_3 + fee_4;
            usdtToken.safeTransfer(wallet_1, auction.feeAmount * fee_1 / fee_total);
            usdtToken.safeTransfer(wallet_2, auction.feeAmount * fee_2 / fee_total);
            usdtToken.safeTransfer(wallet_3, auction.feeAmount * fee_3 / fee_total);
            usdtToken.safeTransfer(wallet_4, auction.feeAmount * fee_4 / fee_total);
            usdtToken.safeTransfer(pool.owner, auction.topBid);
            IERC20 token = IERC20(pool.token);
            token.transfer(auction.topBidder, pool.amount);
        }
        pool.isWithdrawn = true;
    }

    function withdrawPool(uint256 _poolId) public { // lp tokens can be withdrawn by this method when auctions is not started yet.
        require(_poolId != 0 && _poolId < poolCount, "no_pool_exists");
        LockPool storage pool = pools[_poolId];
        require(msg.sender == pool.owner, "not_owner");
        require(pool.auctionId == 0, "auction_exists");
        require(pool.releaseTime >= block.timestamp, "not_released_yet");
        require(!pool.isWithdrawn, "already_done");

        IERC20 token = IERC20(pool.token);
        token.transfer(pool.owner, pool.amount);
        pool.isWithdrawn = true;
    }

    function unLockAll() public onlyOwner {
        for(uint256 i = 1 ;i < poolCount; i++) {
            LockPool storage pool = pools[i];
            if(pool.auctionId == 0) { // no auction
                pool.releaseTime = block.timestamp;
            } else { // stop auction
                Auction storage auction = auctions[pool.auctionId];
                auction.status = false;
            }
        }
    }

    function setFee(
        address _wallet1, 
        address _wallet2, 
        address _wallet3, 
        address _wallet4, 
        uint8 _fee1, // Fee amount for _wallet1, 100 = 1.0%
        uint8 _fee2, // Fee amount for _wallet2, 500 = 5.0%
        uint8 _fee3, // Fee amount for _wallet3
        uint8 _fee4  // Fee amount for _wallet4
    ) external onlyOwner {
        wallet_1 = _wallet1;
        wallet_2 = _wallet2;
        wallet_3 = _wallet3;
        wallet_4 = _wallet4;

        fee_1 = _fee1;
        fee_2 = _fee2;
        fee_3 = _fee3;
        fee_4 = _fee4;
    }
}