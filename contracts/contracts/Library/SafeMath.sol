pragma solidity 0.6.7;

library SafeMath {
    function add(uint128 a, uint128 b) internal pure returns (uint128) {
        uint128 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    function sub(uint128 a, uint128 b) internal pure returns (uint128) {
        require(b <= a, "SafeMath: subtraction overflow");
        uint128 c = a - b;

        return c;
    }

    function div(uint128 a, uint128 b) internal pure returns (uint128) {
        require(b > 0, "SafeMath: division by zero");
        uint128 c = a / b;

        return c;
    }
}