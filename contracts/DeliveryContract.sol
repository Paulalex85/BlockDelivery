pragma solidity 0.6.7;

import "./EventDelivery.sol";
import "./Library/DisputeLib.sol";
import "./Library/OrderLib.sol";
import "./Library/OrderStageLib.sol";
import "./Library/EscrowLib.sol";
import "./Library/DeliveryLib.sol";
import "./Library/SafeMath.sol";

contract DeliveryContract is EventDelivery {
    using SafeMath for uint128;

    DeliveryLib.Delivery[] deliveries;
    mapping(uint => DisputeLib.Dispute) public disputes;
    mapping(address => uint128) public withdraws;
    address public owner = msg.sender;

    function createOrder(
        address[3] calldata users,
        uint128 sellerPrice,
        uint128 deliverPrice,
        uint128 sellerDeliveryPay,
        uint64 delayEscrow,
        uint128[3] calldata escrowUsers
    )
    external
    checkDelayMinimum(delayEscrow)
    checkSellerPayDelivery(sellerDeliveryPay, deliverPrice)
    returns (uint)
    {
        DisputeLib.isActor(msg.sender, users[0], users[1], users[2]);
        OrderLib.Order memory _order = OrderLib.Order({
            buyer : users[0],
            seller : users[1],
            deliver : users[2],
            deliverPrice : deliverPrice,
            sellerPrice : sellerPrice,
            sellerDeliveryPay : sellerDeliveryPay,
            orderStage : OrderStageLib.OrderStage.Initialization,
            startDate : 0,
            buyerValidation : false,
            sellerValidation : false,
            deliverValidation : false,
            buyerHash : 0,
            sellerHash : 0
            });

        EscrowLib.Escrow memory _escrow = EscrowLib.Escrow({
            delayEscrow : delayEscrow,
            escrowBuyer : escrowUsers[0],
            escrowSeller : escrowUsers[1],
            escrowDeliver : escrowUsers[2]
            });

        DeliveryLib.Delivery memory _delivery = DeliveryLib.Delivery({
            order : _order,
            escrow : _escrow
            });

        deliveries.push(_delivery);
        uint256 deliveryId = deliveries.length - 1;
        emit NewOrder(users[0], users[1], users[2], deliveryId);
        return deliveryId;
    }

    function updateInitializeOrder(
        uint deliveryId,
        uint128 sellerPrice,
        uint128 deliverPrice,
        uint128 sellerDeliveryPay,
        uint64 delayEscrow,
        uint128[3] calldata escrowUsers)
    external
    checkDelayMinimum(delayEscrow)
    checkSellerPayDelivery(sellerDeliveryPay, deliverPrice)
    {
        DeliveryLib.Delivery storage delivery = deliveries[deliveryId];

        DisputeLib.atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Initialization);
        DisputeLib.isActor(msg.sender, delivery.order.buyer, delivery.order.seller, delivery.order.deliver);

        if (delivery.order.buyerValidation) {
            delivery.order.buyerValidation = false;
            withdraws[delivery.order.buyer] = withdraws[delivery.order.buyer].add(buyerPay(delivery));
        }

        if (delivery.order.sellerValidation) {
            delivery.order.sellerValidation = false;
            withdraws[delivery.order.seller] = withdraws[delivery.order.seller].add(sellerPay(delivery));
        }

        if (delivery.order.deliverValidation) {
            delivery.order.deliverValidation = false;
            withdraws[delivery.order.deliver] = withdraws[delivery.order.deliver].add(delivery.escrow.escrowDeliver);
        }

        delivery.order.sellerPrice = sellerPrice;
        delivery.order.deliverPrice = deliverPrice;
        delivery.order.sellerDeliveryPay = sellerDeliveryPay;
        delivery.escrow.delayEscrow = delayEscrow;
        delivery.escrow.escrowBuyer = escrowUsers[0];
        delivery.escrow.escrowSeller = escrowUsers[1];
        delivery.escrow.escrowDeliver = escrowUsers[2];

        emit OrderUpdated(deliveryId);
    }

    function validateOrder(uint deliveryId, bytes32 hash)
    payable
    external
    {
        DeliveryLib.Delivery storage delivery = deliveries[deliveryId];
        DisputeLib.atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Initialization);

        if (msg.sender == delivery.order.buyer) {
            require(hash > 0, "Should set hash");
            require(!delivery.order.buyerValidation, "Buyer already validate");
            userValueWithdraw(delivery.order.buyer, buyerPay(delivery));
            delivery.order.buyerValidation = true;
            delivery.order.buyerHash = hash;
        } else if (msg.sender == delivery.order.seller) {
            require(hash > 0, "Should set hash");
            require(!delivery.order.sellerValidation, "Seller already validate");
            userValueWithdraw(delivery.order.seller, sellerPay(delivery));
            delivery.order.sellerValidation = true;
            delivery.order.sellerHash = hash;
        } else if (msg.sender == delivery.order.deliver) {
            require(!delivery.order.deliverValidation, "Deliver already validate");
            userValueWithdraw(delivery.order.deliver, delivery.escrow.escrowDeliver);
            delivery.order.deliverValidation = true;
        } else {
            revert("Should be an actor of the order");
        }

        if (delivery.order.sellerValidation && delivery.order.deliverValidation && delivery.order.buyerValidation) {
            delivery.order.orderStage = OrderStageLib.OrderStage.Started;
            delivery.order.startDate = uint64(now);
        }
        emit OrderValidate(deliveryId, msg.sender, delivery.order.orderStage == OrderStageLib.OrderStage.Started);
    }

    function initializationCancel(uint deliveryId)
    external
    {
        DeliveryLib.Delivery storage delivery = deliveries[deliveryId];
        DisputeLib.atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Initialization);
        DisputeLib.isActor(msg.sender, delivery.order.buyer, delivery.order.seller, delivery.order.deliver);

        delivery.order.orderStage = OrderStageLib.OrderStage.Cancel_Order;

        if (delivery.order.buyerValidation) {
            withdraws[delivery.order.buyer] = withdraws[delivery.order.buyer].add(buyerPay(delivery));
        }
        if (delivery.order.sellerValidation) {
            withdraws[delivery.order.seller] = withdraws[delivery.order.seller].add(sellerPay(delivery));
        }
        if (delivery.order.deliverValidation) {
            withdraws[delivery.order.deliver] = withdraws[delivery.order.deliver].add(delivery.escrow.escrowDeliver);
        }
        emit CancelOrder(deliveryId, false);
    }

    function takeOrder(uint deliveryId, bytes calldata sellerKey)
    external
    {
        DeliveryLib.Delivery storage delivery = deliveries[deliveryId];
        DisputeLib.atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Started);
        require(msg.sender == delivery.order.deliver, "Sender is not the deliver");
        require(keccak256(sellerKey) == delivery.order.sellerHash, "The key doesn't match with the stored hash");
        DisputeLib.checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        delivery.order.orderStage = OrderStageLib.OrderStage.Taken;
        emit OrderTaken(deliveryId);
    }

    function deliverOrder(uint deliveryId, bytes calldata buyerKey)
    external
    {
        DeliveryLib.Delivery storage delivery = deliveries[deliveryId];
        DisputeLib.atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Taken);
        require(msg.sender == delivery.order.deliver, "Sender is not the deliver");
        require(keccak256(buyerKey) == delivery.order.buyerHash, "The key doesn't match with the stored hash");
        DisputeLib.checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        delivery.order.orderStage = OrderStageLib.OrderStage.Delivered;
        emit OrderDelivered(deliveryId);
    }

    function endOrder(uint deliveryId)
    external
    {
        DeliveryLib.Delivery storage delivery = deliveries[deliveryId];
        DisputeLib.atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Delivered);
        require(msg.sender == delivery.order.buyer, "Sender is not the buyer");
        DisputeLib.checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        delivery.order.orderStage = OrderStageLib.OrderStage.Ended;

        uint128 sellerFee = delivery.order.sellerPrice / 100;
        uint128 delivererFee = delivery.order.deliverPrice / 100;

        withdraws[delivery.order.seller] = withdraws[delivery.order.seller].add(delivery.order.sellerPrice).add(delivery.escrow.escrowSeller).sub(sellerFee);
        withdraws[delivery.order.deliver] = withdraws[delivery.order.deliver].add(delivery.order.deliverPrice).add(delivery.escrow.escrowDeliver).sub(delivererFee);
        withdraws[delivery.order.buyer] = withdraws[delivery.order.buyer].add(delivery.escrow.escrowBuyer);
        withdraws[owner] = withdraws[owner].add(sellerFee).add(delivererFee);
        emit OrderEnded(deliveryId);
    }

    function createDispute(uint deliveryId, uint128 buyerReceive)
    public
    {
        DisputeLib.createDispute(deliveries[deliveryId], disputes, buyerReceive, deliveryId);
    }

    function refundProposalDispute(uint deliveryId, uint128 buyerReceive)
    public
    {
        DisputeLib.refundProposalDispute(deliveries[deliveryId], disputes, deliveryId, buyerReceive);
    }

    function acceptDisputeProposal(uint deliveryId)
    external
    {
        DisputeLib.acceptDisputeProposal(deliveries[deliveryId], disputes, withdraws, deliveryId);
    }

    function costDisputeProposal(uint deliveryId, int128 sellerBalance)
    payable
    external
    {
        DisputeLib.costDisputeProposal(deliveries[deliveryId], disputes, withdraws, deliveryId, sellerBalance);
    }

    function acceptCostProposal(uint deliveryId)
    payable
    external
    {
        DisputeLib.acceptCostProposal(deliveries[deliveryId], disputes, withdraws, deliveryId);
    }

    function revertDispute(uint deliveryId)
    external
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
    {
        uint balance = withdraws[msg.sender];
        withdraws[msg.sender] = 0;
        (bool success,) = msg.sender.call.value(balance)("");
        require(success, "Transfer failed.");
    }

    function updateOwner(address newOwner)
    external
    {
        require(msg.sender == owner, "Not the owner");
        require(newOwner != address(0), "New address need to be defined");
        owner = newOwner;
    }

    function userValueWithdraw(address user, uint128 cost)
    internal
    {
        require(withdraws[user].add(uint128(msg.value)) >= cost, "The value send isn't enough");
        withdraws[user] = withdraws[user].add(uint128(msg.value)).sub(cost);
    }

    function buyerPay(DeliveryLib.Delivery storage delivery)
    internal
    view
    returns (uint128)
    {
        return delivery.order.deliverPrice.add(delivery.order.sellerPrice).add(delivery.escrow.escrowBuyer).sub(delivery.order.sellerDeliveryPay);
    }

    function sellerPay(DeliveryLib.Delivery storage delivery)
    internal
    view
    returns (uint128)
    {
        return delivery.escrow.escrowSeller.add(delivery.order.sellerDeliveryPay);
    }

    modifier checkDelayMinimum(uint64 delay){
        require(delay >= 1 days, "Delay should be at least one day");
        _;
    }

    modifier checkSellerPayDelivery(uint128 sellerDeliveryPay, uint128 deliverPrice){
        require(sellerDeliveryPay <= deliverPrice, "Seller can't pay more than the delivery price");
        _;
    }
}
