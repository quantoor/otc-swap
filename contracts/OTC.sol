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

    function makeRFQ(
        address _tokenBuy,
        address _tokenSell,
        uint _tokenBuyQty,
        uint _tokenSellQty
    ) external {
        ERC20 tokenSell = ERC20(_tokenSell);

        // bool approved = tokenSell.approve(address(this), _tokenSellQty);
        // require(approved, "Approval failed");
        // console.log(
        //     "solidity allowance: ",
        //     tokenSell.allowance(msg.sender, address(this))
        // );

        require(
            tokenSell.allowance(msg.sender, address(this)) >= _tokenSellQty,
            "Not enough allowance for token sell"
        );

        // transfer sell token to contract
        bool success = tokenSell.transferFrom(
            msg.sender,
            address(this),
            _tokenSellQty
        );
        require(success, "Deposit of token sell failed");

        // create RFQ
        rfqs[rfqCounter] = RFQ(
            msg.sender,
            _tokenBuy,
            _tokenSell,
            _tokenBuyQty,
            _tokenSellQty
        );

        rfqCounter++;

        emit RFQMade(
            msg.sender,
            _tokenBuy,
            _tokenSell,
            _tokenBuyQty,
            _tokenSellQty
        );
    }

    function removeRFQ(uint rfqId) external {
        address maker = rfqs[rfqId].maker;
        require(msg.sender == maker, "Not owner of RFQ");
        delete rfqs[rfqId];
    }

    function takeRFQ(uint rfqId) external {
        // todo check RFQ exists

        // transfer buy token to maker
        RFQ memory rfq = rfqs[rfqId];

        // transfer sell token to taker

        delete rfqs[rfqId];

        emit RFQTaken(
            msg.sender,
            rfq.maker,
            rfq.tokenBuy,
            rfq.tokenSell,
            rfq.tokenBuyQty,
            rfq.tokenSellQty
        );
    }

    function getRFQ(uint rfqId) external view returns (RFQ memory) {
        return rfqs[rfqId];
    }
}
