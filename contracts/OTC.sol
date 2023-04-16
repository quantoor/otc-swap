// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract OTC {
    struct RFQ {
        address maker;
        address tokenBuy;
        address tokenSell;
        uint tokenBuyQty;
        uint tokenSellQty;
    }

    event RFQMade(
        address indexed maker,
        address indexed tokenBuy,
        address indexed tokenSell,
        uint tokenBuyQty,
        uint tokenSellQty
    );

    event RFQTaken(
        address indexed taker,
        address maker,
        address indexed tokenBuy,
        address indexed tokenSell,
        uint tokenBuyQty,
        uint tokenSellQty
    );

    // state variables
    uint public rfqCounter;
    mapping(uint => RFQ) private rfqs;

    function ping() external {}

    function makeRFQ(address _tokenBuy, address _tokenSell, uint _tokenBuyQty, uint _tokenSellQty) external {
        ERC20 tokenSell = ERC20(_tokenSell);

        require(tokenSell.allowance(msg.sender, address(this)) >= _tokenSellQty, "Not enough allowance for token sell");

        // transfer sell token to contract
        bool success = tokenSell.transferFrom(msg.sender, address(this), _tokenSellQty);
        require(success, "Deposit of token sell failed");

        // create RFQ
        rfqs[rfqCounter] = RFQ(msg.sender, _tokenBuy, _tokenSell, _tokenBuyQty, _tokenSellQty);

        rfqCounter++;

        emit RFQMade(msg.sender, _tokenBuy, _tokenSell, _tokenBuyQty, _tokenSellQty);
    }

    function removeRFQ(uint rfqId) external {
        address maker = rfqs[rfqId].maker;
        require(msg.sender == maker, "Not owner of RFQ");
        delete rfqs[rfqId];
    }

    function takeRFQ(uint rfqId) external {
        // todo check RFQ exists
        RFQ memory rfq = rfqs[rfqId];
        ERC20 tokenBuy = ERC20(rfq.tokenBuy);

        // check allowance
        require(tokenBuy.allowance(msg.sender, address(this)) >= rfq.tokenBuyQty, "Not enough allowance for token buy");

        // transfer buy token to maker
        bool success = tokenBuy.transferFrom(msg.sender, rfq.maker, rfq.tokenBuyQty);
        require(success, "Transfer of token buy failed");

        // transfer sell token to taker
        success = ERC20(rfq.tokenSell).transfer(msg.sender, rfq.tokenSellQty);
        require(success, "Transfer of token sell failed");

        delete rfqs[rfqId];

        emit RFQTaken(msg.sender, rfq.maker, rfq.tokenBuy, rfq.tokenSell, rfq.tokenBuyQty, rfq.tokenSellQty);
    }

    function getRFQ(uint rfqId) external view returns (RFQ memory) {
        return rfqs[rfqId];
    }
}
