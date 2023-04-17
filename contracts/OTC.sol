// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract OTC {
    struct RFQ {
        uint id;
        address maker;
        address tokenBuy;
        address tokenSell;
        uint tokenBuyQty;
        uint tokenSellQty;
    }

    event RFQCreated(
        uint id,
        address maker,
        address indexed tokenBuy,
        address indexed tokenSell,
        uint tokenBuyQty,
        uint tokenSellQty
    );

    event RFQFilled(
        uint id,
        address taker,
        address maker,
        address indexed tokenBuy,
        address indexed tokenSell,
        uint tokenBuyQty,
        uint tokenSellQty
    );

    // state variables
    uint public rfqCounter;
    mapping(uint => RFQ) private rfqs;

    function makeRFQ(address _tokenBuy, address _tokenSell, uint _tokenBuyQty, uint _tokenSellQty) external {
        ERC20 tokenSell = ERC20(_tokenSell);

        require(tokenSell.allowance(msg.sender, address(this)) >= _tokenSellQty, "Not enough allowance for token sell");

        // transfer sell token to contract
        bool success = tokenSell.transferFrom(msg.sender, address(this), _tokenSellQty);
        require(success, "Deposit of token sell failed");

        // create RFQ
        rfqs[rfqCounter] = RFQ(rfqCounter, msg.sender, _tokenBuy, _tokenSell, _tokenBuyQty, _tokenSellQty);

        emit RFQCreated(rfqCounter, msg.sender, _tokenBuy, _tokenSell, _tokenBuyQty, _tokenSellQty);

        rfqCounter++;
    }

    function removeRFQ(uint _id) external {
        RFQ memory rfq = rfqs[_id];
        require(msg.sender == rfq.maker, "Not maker of RFQ");

        // give token sell back to maker
        bool success = ERC20(rfq.tokenSell).transfer(msg.sender, rfq.tokenSellQty);
        require(success);

        delete rfqs[_id];
    }

    function takeRFQ(uint _id) external {
        RFQ memory rfq = getRFQ(_id);
        ERC20 tokenBuy = ERC20(rfq.tokenBuy);

        // check allowance
        require(tokenBuy.allowance(msg.sender, address(this)) >= rfq.tokenBuyQty, "Not enough allowance for token buy");

        // transfer buy token to maker
        bool success = tokenBuy.transferFrom(msg.sender, rfq.maker, rfq.tokenBuyQty);
        require(success, "Transfer of token buy failed");

        // transfer sell token to taker
        success = ERC20(rfq.tokenSell).transfer(msg.sender, rfq.tokenSellQty);
        require(success, "Transfer of token sell failed");

        delete rfqs[_id];

        emit RFQFilled(_id, msg.sender, rfq.maker, rfq.tokenBuy, rfq.tokenSell, rfq.tokenBuyQty, rfq.tokenSellQty);
    }

    function getRFQ(uint _id) public view returns (RFQ memory) {
        RFQ memory rfq = rfqs[_id];
        require(rfq.maker != address(0), "RFQ not found");
        return rfq;
    }
}
