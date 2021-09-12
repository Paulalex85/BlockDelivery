pragma solidity 0.6.7;

import "./OrderLib.sol";
import "./EscrowLib.sol";

library DeliveryLib {

    struct Delivery {
        OrderLib.Order order;
        EscrowLib.Escrow escrow;
    }
}