// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC20Mintable.sol";
import "./ERC20Burnable.sol";

/**
 * @title MB_ERC20
 * @dev Implementation of the ERC20
 */

contract MB_ERC20 is ERC20Mintable, ERC20Burnable {

    constructor (string memory t_name, string memory t_symbol)
        ERC20(t_name, t_symbol)
        payable
    {
        _setupDecimals(18);
    }

    function _mint(address account, uint256 amount) internal override(ERC20) onlyOwner {
        require(amount > 0, "zero amount");
        super._mint(account, amount);
    }

    function _finishMinting() internal override onlyOwner {
        super._finishMinting();
    }

    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        super.transferFrom(sender, recipient, amount);
        return true;
    }

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        super.transfer(recipient, amount);
        return true;
    }
}