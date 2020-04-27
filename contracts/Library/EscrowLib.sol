pragma solidity >=0.4.21 <0.7.0;

library EscrowLib {

    struct Escrow {
        uint64 delayEscrow;
        uint128 escrowBuyer;
        uint128 escrowSeller;
        uint128 escrowDeliver;
    }
}