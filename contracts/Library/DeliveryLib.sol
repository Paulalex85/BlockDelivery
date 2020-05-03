pragma solidity >=0.4.21 <0.7.0;

import "./OrderLib.sol";
import "./EscrowLib.sol";

library DeliveryLib {

    struct Delivery {
        OrderLib.Order order;
        EscrowLib.Escrow escrow;
    }
}