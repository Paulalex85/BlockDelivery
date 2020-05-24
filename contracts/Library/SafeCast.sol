pragma solidity 0.6.7;

library SafeCast {

    function toUint128(uint256 value) internal pure returns (uint128) {
        require(value < 2 ** 128, "SafeCast: value doesn\'t fit in 128 bits");
        return uint128(value);
    }

    function toInt128(uint128 value) internal pure returns (int128) {
        require(value < 2 ** 127, "SafeCast: value doesn't fit in an int128");
        return int128(value);
    }

    function intToUint128(int128 value) internal pure returns (uint128) {
        require(value >= 0, "SafeCast: value need to be positive");
        return uint128(value);
    }
}