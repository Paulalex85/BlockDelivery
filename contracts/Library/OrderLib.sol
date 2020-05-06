pragma solidity >=0.4.21 <0.7.0;

import "./OrderStageLib.sol";

library OrderLib {

    struct Order {
        address buyer;
        address seller;
        address deliver;
        uint128 deliverPrice;
        uint128 sellerPrice;
        uint128 sellerDeliveryPay;
        OrderStageLib.OrderStage orderStage;
        uint64 startDate;
        bool buyerValidation;
        bool sellerValidation;
        bool deliverValidation;
        bytes32 sellerHash;
        bytes32 buyerHash;
    }
}