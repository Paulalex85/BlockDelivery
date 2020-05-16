pragma solidity 0.6.7;

import "./Library/DisputeLib.sol";
import "./Library/OrderLib.sol";
import "./Library/OrderStageLib.sol";
import "./Library/EscrowLib.sol";
import "./Library/DeliveryLib.sol";
import "./Library/SafeMath.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DeliveryContract is Pausable, ReentrancyGuard {
    using SafeMath for uint128;

    DeliveryLib.Delivery[] deliveries;
    mapping(uint => DisputeLib.Dispute) public disputes;
    mapping(address => uint128) public withdraws;
    address public owner = msg.sender;

    event NewOrder(address indexed buyer, address indexed seller, address indexed deliver, uint256 orderId);

    function createOrder(
        address[3] calldata users,
        uint128 sellerPrice,
        uint128 deliverPrice,
        uint128 sellerDeliveryPay,
        uint64 delayEscrow,
        uint128[3] calldata escrowUsers
    )
    external
    whenNotPaused
    nonReentrant
    checkDelayMinimum(delayEscrow)
    checkSellerPayDelivery(sellerDeliveryPay, deliverPrice)
    returns (uint)
    {
        return OrderLib.createOrder(deliveries, users, sellerPrice, deliverPrice, sellerDeliveryPay, delayEscrow, escrowUsers);
    }

    /**
    * @param userData : 0 = sellerPrice,
    *                   1 = deliverPrice,
    *                   2 = sellerDeliveryPay,
    *                   3 = escrowBuyer,
    *                   4 = escrowSeller,
    *                   5 = escrowDeliver,
    *
    */
    function updateInitializeOrder(
        uint deliveryId,
        uint64 delayEscrow,
        uint128[6] calldata userData)
    external
    whenNotPaused
    nonReentrant
    checkDelayMinimum(delayEscrow)
    checkSellerPayDelivery(userData[2], userData[1])
    {
        return OrderLib.updateInitializeOrder(deliveries[deliveryId], withdraws, deliveryId, delayEscrow, userData);
    }

    function validateOrder(uint deliveryId, bytes32 hash)
    payable
    external
    whenNotPaused
    nonReentrant
    {
        return OrderLib.validateOrder(deliveries[deliveryId], withdraws, deliveryId, hash);
    }

    function initializationCancel(uint deliveryId)
    external
    whenNotPaused
    nonReentrant
    {
        return OrderLib.initializationCancel(deliveries[deliveryId], withdraws, deliveryId);
    }

    function takeOrder(uint deliveryId, bytes calldata sellerKey)
    external
    whenNotPaused
    nonReentrant
    {
        return OrderLib.takeOrder(deliveries[deliveryId], deliveryId, sellerKey);
    }

    function deliverOrder(uint deliveryId, bytes calldata buyerKey)
    external
    whenNotPaused
    nonReentrant
    {
        return OrderLib.deliverOrder(deliveries[deliveryId], deliveryId, buyerKey);
    }

    function endOrder(uint deliveryId)
    external
    whenNotPaused
    nonReentrant
    {
        return OrderLib.endOrder(deliveries[deliveryId], withdraws, owner, deliveryId);
    }

    function createDispute(uint deliveryId, uint128 buyerReceive)
    external
    whenNotPaused
    nonReentrant
    {
        DisputeLib.createDispute(deliveries[deliveryId], disputes, buyerReceive, deliveryId);
    }

    function refundProposalDispute(uint deliveryId, uint128 buyerReceive)
    external
    whenNotPaused
    nonReentrant
    {
        DisputeLib.refundProposalDispute(deliveries[deliveryId], disputes, deliveryId, buyerReceive);
    }

    function acceptDisputeProposal(uint deliveryId)
    external
    whenNotPaused
    nonReentrant
    {
        DisputeLib.acceptDisputeProposal(deliveries[deliveryId], disputes, withdraws, deliveryId);
    }

    function costDisputeProposal(uint deliveryId, int128 sellerBalance)
    payable
    external
    whenNotPaused
    nonReentrant
    {
        DisputeLib.costDisputeProposal(deliveries[deliveryId], disputes, withdraws, deliveryId, sellerBalance);
    }

    function acceptCostProposal(uint deliveryId)
    payable
    external
    whenNotPaused
    nonReentrant
    {
        DisputeLib.acceptCostProposal(deliveries[deliveryId], disputes, withdraws, deliveryId);
    }

    function revertDispute(uint deliveryId)
    external
    whenNotPaused
    nonReentrant
    {
        DisputeLib.revertDispute(deliveries[deliveryId], disputes, deliveryId);
    }

    function getOrder(uint deliveryId)
    external
    view
    returns (
        address buyer,
        address seller,
        address deliver,
        uint128 deliverPrice,
        uint128 sellerPrice,
        uint128 sellerDeliveryPay,
        OrderStageLib.OrderStage orderStage,
        uint64 startDate,
        bool buyerValidation,
        bool sellerValidation,
        bool deliverValidation,
        bytes32 sellerHash,
        bytes32 buyerHash
    ) {
        DeliveryLib.Delivery storage delivery = deliveries[deliveryId];

        buyer = delivery.order.buyer;
        seller = delivery.order.seller;
        deliver = delivery.order.deliver;
        deliverPrice = delivery.order.deliverPrice;
        sellerPrice = delivery.order.sellerPrice;
        sellerDeliveryPay = delivery.order.sellerDeliveryPay;
        orderStage = delivery.order.orderStage;
        startDate = delivery.order.startDate;
        buyerValidation = delivery.order.buyerValidation;
        sellerValidation = delivery.order.sellerValidation;
        deliverValidation = delivery.order.deliverValidation;
        sellerHash = delivery.order.sellerHash;
        buyerHash = delivery.order.buyerHash;
    }

    function getEscrow(uint deliveryId)
    external
    view
    returns (
        uint64 delayEscrow,
        uint128 escrowBuyer,
        uint128 escrowSeller,
        uint128 escrowDeliver
    ) {
        DeliveryLib.Delivery storage delivery = deliveries[deliveryId];

        delayEscrow = delivery.escrow.delayEscrow;
        escrowBuyer = delivery.escrow.escrowBuyer;
        escrowSeller = delivery.escrow.escrowSeller;
        escrowDeliver = delivery.escrow.escrowDeliver;
    }

    function getDispute(uint deliveryId)
    external
    view
    returns (
        uint128 buyerReceive,
        int128 sellerBalance,
        bool buyerAcceptEscrow,
        bool sellerAcceptEscrow,
        bool deliverAcceptEscrow,
        OrderStageLib.OrderStage previousStage
    ) {
        DisputeLib.Dispute storage dispute = disputes[deliveryId];

        buyerReceive = dispute.buyerReceive;
        sellerBalance = dispute.sellerBalance;
        buyerAcceptEscrow = dispute.buyerAcceptEscrow;
        sellerAcceptEscrow = dispute.sellerAcceptEscrow;
        deliverAcceptEscrow = dispute.deliverAcceptEscrow;
        previousStage = dispute.previousStage;
    }

    function withdrawBalance()
    external
    whenNotPaused
    nonReentrant
    {
        uint balance = withdraws[msg.sender];
        withdraws[msg.sender] = 0;
        (bool success,) = msg.sender.call.value(balance)("");
        require(success, "Transfer failed.");
    }

    function updateOwner(address newOwner)
    external
    whenNotPaused
    isOwner
    nonReentrant
    {
        require(newOwner != address(0), "New address need to be defined");
        owner = newOwner;
    }

    function pause()
    external
    isOwner
    nonReentrant
    {
        _pause();
    }

    function unpause()
    external
    isOwner
    nonReentrant
    {
        _unpause();
    }

    modifier checkDelayMinimum(uint64 delay){
        require(delay >= 1 days, "Delay should be at least one day");
        _;
    }

    modifier checkSellerPayDelivery(uint128 sellerDeliveryPay, uint128 deliverPrice){
        require(sellerDeliveryPay <= deliverPrice, "Seller can't pay more than the delivery price");
        _;
    }

    modifier isOwner(){
        require(msg.sender == owner, "Not the owner");
        _;
    }
}
