pragma solidity >=0.4.21 <0.7.0;

import "./OrderStageLib.sol";

library DisputeLib {

    struct Dispute {
        uint128 buyerReceive;
        int128 sellerBalance;
        int128 deliverBalance;
        bool buyerAcceptEscrow;
        bool sellerAcceptEscrow;
        bool deliverAcceptEscrow;
        OrderStageLib.OrderStage previousStage;
    }
}