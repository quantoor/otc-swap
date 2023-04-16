// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken2 is ERC20 {
    uint constant _initial_supply = 42 * (10 ** 18);

    constructor() ERC20("TestToken2", "TK2") {
        _mint(msg.sender, _initial_supply);
    }
}
