# Decentralized OTC Market

This is the implementation of a smart contract to allow decentralized OTC swaps of ERC20 tokens. In practice, participants can offer some tokens in exchange for others, at a fixed quote, thus completely avoiding slippage.

The relevant files are:

-   `contracts/OTC.sol`: implementation of the smart contract
-   `contracts/TestToken1.sol`: ERC20 test token with 18 decimals
-   `contracts/TestToken2.sol`: ERC20 test token with 6 decimals
-   `test/OTC.test.js`: unit tests

## How it works

Relevant definitions:

-   `RFQ (Request For Quote)`: defines the address of the token to be bought, sold, and their quantities.
-   `Maker`: address who creates a new RFQ, waiting to be filled.
-   `Taker`: address who takes an already existing RFQ, thus filling it.

Example: Alice has 1000 DAI and wants to buy ETH. She sees that ETH is quoted at 2000 DAI on Uniswap, but the liquidity is so thin that if she performed the swap she would lose 5% in slippage.

So she decides to create an RFQ, offering 1000 DAI and asking for 0.49 ETH, which implies a quote of 2040 DAI per ETH. She is willing to pay a 2% premium, because it is still better than losing 5% in slippage. To create the RFQ, Alice deposits 1000 DAI in the OTC smart contract. This RFQ can be filled by depositing 0.49 ETH.

After some time, Bob notices the RFQ created by Alice, and decides to fill the RFQ. He deposits 0.49 ETH into the smart contract, which performs the following operations:

-   forward 0.49 ETH to Alice.
-   transfer the 1000 DAI already deposited to Bob.

At the end, Alice - the maker - has bought 0.49 ETH for 1000 DAI, and Bob - the taker - has sold 0.49 ETH for 1000 DAI.

## Test

To run the tests:

```shell
npx hardhat test
```

## Future ideas

-   Add taker and maker fees for the protocol.
-   The tokens deposited when creating an RFQ could be deployed is some DeFi protocol to get a yield for the maker, until the RFQ is filled.
