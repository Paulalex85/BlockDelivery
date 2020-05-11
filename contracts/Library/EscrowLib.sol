pragma solidity 0.6.7;

library EscrowLib {

    struct Escrow {
        uint64 delayEscrow;
        uint128 escrowBuyer;
        uint128 escrowSeller;
        uint128 escrowDeliver;
    }
}