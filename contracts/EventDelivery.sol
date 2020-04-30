pragma solidity >=0.4.21 <0.7.0;

contract EventDelivery {

    event NewOrder(
        address indexed buyer,
        address indexed seller,
        address indexed deliver,
        uint256 orderId
    );

    event OrderUpdated(
        uint256 indexed orderId
    );

    event OrderValidate(
        uint256 indexed orderId,
        address user,
        bool isOrderStarted
    );

    event OrderTaken(
        uint256 indexed orderId
    );

    event OrderDelivered(
        uint256 indexed orderId
    );

    event OrderEnded(
        uint256 indexed orderId
    );

    event CancelOrder(
        uint256 indexed orderId,
        bool startedOrder
    );

    event DisputeStarted(
        uint256 indexed orderId,
        uint128 buyerProposal
    );

    event DisputeRefundProposal(
        uint256 indexed orderId,
        uint128 buyerProposal
    );

    event AcceptProposal(
        uint256 indexed orderId,
        address user,
        bool proposalAccepted
    );

    event DisputeCostProposal(
        uint256 indexed orderId,
        int128 sellerBalance,
        int128 deliverBalance
    );

    event RevertDispute(
        uint256 indexed orderId,
        address user
    );
}