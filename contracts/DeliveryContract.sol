pragma solidity >=0.4.21 <0.7.0;

import "./EventDelivery.sol";
import "./Library/DisputeLib.sol";
import "./Library/OrderLib.sol";
import "./Library/OrderStageLib.sol";
import "./Library/EscrowLib.sol";
import "./Library/DeliveryLib.sol";

contract DeliveryContract is EventDelivery {
    DeliveryLib.Delivery[] deliveries;
    mapping(uint => DisputeLib.Dispute) public disputes;
    mapping(address => uint128) public withdraws;

    function createOrder(
        address[3] memory _users,
        uint128 _sellerPrice,
        uint128 _deliverPrice,
        uint128 _sellerDeliveryPay,
        uint64 _delayEscrow,
        uint128[3] memory _escrowUsers
    )
    public
    checkDelayMinimum(_delayEscrow)
    checkSellerPayDelivery(_sellerDeliveryPay, _deliverPrice)
    returns (uint)
    {
        isActor(msg.sender, _users[0], _users[1], _users[2]);
        OrderLib.Order memory _order = OrderLib.Order({
            buyer : _users[0],
            seller : _users[1],
            deliver : _users[2],
            deliverPrice : _deliverPrice,
            sellerPrice : _sellerPrice,
            sellerDeliveryPay : _sellerDeliveryPay,
            orderStage : OrderStageLib.OrderStage.Initialization,
            startDate : 0,
            buyerValidation : false,
            sellerValidation : false,
            deliverValidation : false,
            buyerHash : 0,
            sellerHash : 0
            });

        EscrowLib.Escrow memory _escrow = EscrowLib.Escrow({
            delayEscrow : _delayEscrow,
            escrowBuyer : _escrowUsers[0],
            escrowSeller : _escrowUsers[1],
            escrowDeliver : _escrowUsers[2]
            });

        DeliveryLib.Delivery memory _delivery = DeliveryLib.Delivery({
            order : _order,
            escrow : _escrow
            });

        deliveries.push(_delivery);
        uint256 deliveryId = deliveries.length - 1;
        emit NewOrder(_users[0], _users[1], _users[2], deliveryId);
        return deliveryId;
    }

    function updateInitializeOrder(
        uint deliveryId,
        uint128 _sellerPrice,
        uint128 _deliverPrice,
        uint128 _sellerDeliveryPay,
        uint64 _delayEscrow,
        uint128[3] memory _escrowUsers)
    public
    checkDelayMinimum(_delayEscrow)
    checkSellerPayDelivery(_sellerDeliveryPay, _deliverPrice)
    {
        DeliveryLib.Delivery storage delivery = deliveries[deliveryId];

        atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Initialization);
        isActor(msg.sender, delivery.order.buyer, delivery.order.seller, delivery.order.deliver);

        if (delivery.order.buyerValidation) {
            delivery.order.buyerValidation = false;
            withdraws[delivery.order.buyer] += buyerPay(delivery);
        }

        if (delivery.order.sellerValidation) {
            delivery.order.sellerValidation = false;
            withdraws[delivery.order.seller] += sellerPay(delivery);
        }

        if (delivery.order.deliverValidation) {
            delivery.order.deliverValidation = false;
            withdraws[delivery.order.deliver] += delivery.escrow.escrowDeliver;
        }

        delivery.order.sellerPrice = _sellerPrice;
        delivery.order.deliverPrice = _deliverPrice;
        delivery.order.sellerDeliveryPay = _sellerDeliveryPay;
        delivery.escrow.delayEscrow = _delayEscrow;
        delivery.escrow.escrowBuyer = _escrowUsers[0];
        delivery.escrow.escrowSeller = _escrowUsers[1];
        delivery.escrow.escrowDeliver = _escrowUsers[2];

        emit OrderUpdated(deliveryId);
    }

    function validateOrder(uint deliveryId, bytes32 hash)
    payable
    public
    {
        DeliveryLib.Delivery storage delivery = deliveries[deliveryId];
        atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Initialization);

        if (msg.sender == delivery.order.buyer) {
            require(delivery.order.buyerValidation == false, "Buyer already validate");
            require(userValueWithdraw(delivery.order.buyer, buyerPay(delivery)), "The value send isn't enough");
            delivery.order.buyerValidation = true;
            delivery.order.buyerHash = hash;
        } else if (msg.sender == delivery.order.seller) {
            require(delivery.order.sellerValidation == false, "Seller already validate");
            require(userValueWithdraw(delivery.order.seller, sellerPay(delivery)), "The value send isn't enough");
            delivery.order.sellerValidation = true;
            delivery.order.sellerHash = hash;
        } else if (msg.sender == delivery.order.deliver) {
            require(delivery.order.deliverValidation == false, "Deliver already validate");
            require(userValueWithdraw(delivery.order.deliver, delivery.escrow.escrowDeliver), "The value send isn't enough");
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
    public
    {
        DeliveryLib.Delivery storage delivery = deliveries[deliveryId];
        atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Initialization);
        isActor(msg.sender, delivery.order.buyer, delivery.order.seller, delivery.order.deliver);

        delivery.order.orderStage = OrderStageLib.OrderStage.Cancel_Order;

        if (delivery.order.buyerValidation) {
            withdraws[delivery.order.buyer] += buyerPay(delivery);
        }
        if (delivery.order.sellerValidation) {
            withdraws[delivery.order.seller] += sellerPay(delivery);
        }
        if (delivery.order.deliverValidation) {
            withdraws[delivery.order.deliver] += delivery.escrow.escrowDeliver;
        }
        emit CancelOrder(deliveryId, false);
    }

    function takeOrder(uint deliveryId, bytes memory sellerKey)
    public
    {
        DeliveryLib.Delivery storage delivery = deliveries[deliveryId];
        atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Started);
        require(msg.sender == delivery.order.deliver, "Sender is not the deliver");
        require(keccak256(sellerKey) == delivery.order.sellerHash, "The key doesn't match with the stored hash");
        checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        delivery.order.orderStage = OrderStageLib.OrderStage.Taken;
        emit OrderTaken(deliveryId);
    }

    function deliverOrder(uint deliveryId, bytes memory buyerKey)
    public
    {
        DeliveryLib.Delivery storage delivery = deliveries[deliveryId];
        atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Taken);
        require(msg.sender == delivery.order.deliver, "Sender is not the deliver");
        require(keccak256(buyerKey) == delivery.order.buyerHash, "The key doesn't match with the stored hash");
        checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        delivery.order.orderStage = OrderStageLib.OrderStage.Delivered;
        emit OrderDelivered(deliveryId);
    }

    function endOrder(uint deliveryId)
    public
    {
        DeliveryLib.Delivery storage delivery = deliveries[deliveryId];
        atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Delivered);
        require(msg.sender == delivery.order.buyer, "Sender is not the buyer");
        checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        delivery.order.orderStage = OrderStageLib.OrderStage.Ended;

        withdraws[delivery.order.seller] += delivery.order.sellerPrice + delivery.escrow.escrowSeller;
        withdraws[delivery.order.deliver] += delivery.order.deliverPrice + delivery.escrow.escrowDeliver;
        withdraws[delivery.order.buyer] += delivery.escrow.escrowBuyer;
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
    public
    {
        DisputeLib.acceptDisputeProposal(deliveries[deliveryId], disputes, withdraws, deliveryId);
    }

    function costDisputeProposal(uint deliveryId, int128 sellerBalance, int128 deliverBalance)
    payable
    public
    {
        DisputeLib.costDisputeProposal(deliveries[deliveryId], disputes, withdraws, deliveryId, sellerBalance, deliverBalance);
    }

    function acceptCostProposal(uint deliveryId)
    payable
    public
    {
        DisputeLib.acceptCostProposal(deliveries[deliveryId], disputes, withdraws, deliveryId);
    }

    function revertDispute(uint deliveryId)
    public
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
        int128 deliverBalance,
        bool buyerAcceptEscrow,
        bool sellerAcceptEscrow,
        bool deliverAcceptEscrow,
        OrderStageLib.OrderStage previousStage
    ) {
        DisputeLib.Dispute storage dispute = disputes[deliveryId];

        buyerReceive = dispute.buyerReceive;
        sellerBalance = dispute.sellerBalance;
        deliverBalance = dispute.deliverBalance;
        buyerAcceptEscrow = dispute.buyerAcceptEscrow;
        sellerAcceptEscrow = dispute.sellerAcceptEscrow;
        deliverAcceptEscrow = dispute.deliverAcceptEscrow;
        previousStage = dispute.previousStage;
    }

    function withdrawBalance()
    public
    {
        uint balance = withdraws[msg.sender];
        withdraws[msg.sender] = 0;
        msg.sender.transfer(balance);
    }

    function userValueWithdraw(address user, uint128 cost)
    internal
    returns (bool)
    {
        if (withdraws[user] + msg.value >= cost) {
            withdraws[user] = withdraws[user] + uint128(msg.value) - cost;
            require(withdraws[user] >= 0, "Withdraw can't be negative");
            return true;
        }
        return false;
    }

    function checkBalanceEscrow(address user, int128 price, int128 escrow, int128 balance)
    internal
    returns (uint128)
    {
        int128 currentBalance = price + escrow + balance;
        if (currentBalance < 0) {
            uint128 toAdd = uint128(- currentBalance);
            require(withdraws[user] + msg.value >= toAdd, "User need to send additional cost");
            withdraws[user] = withdraws[user] + uint128(msg.value) - toAdd;
            require(withdraws[user] >= 0, "Withdraw can't be negative");
            return toAdd;
        }
        return 0;
    }

    function checkDelayExpire(uint64 startDate, uint64 delay)
    view
    internal
    {
        require(uint64(now) < startDate + delay, "Delay of the order is passed");
    }

    function buyerPay(DeliveryLib.Delivery storage delivery)
    internal
    view
    returns (uint128)
    {
        return delivery.order.deliverPrice + delivery.order.sellerPrice + delivery.escrow.escrowBuyer - delivery.order.sellerDeliveryPay;
    }

    function sellerPay(DeliveryLib.Delivery storage delivery)
    internal
    view
    returns (uint128)
    {
        return delivery.escrow.escrowSeller + delivery.order.sellerDeliveryPay;
    }

    function checkAmountBuyerReceiveDispute(uint128 buyerReceive, OrderLib.Order storage order)
    view
    internal
    {
        require(buyerReceive <= order.deliverPrice + order.sellerPrice - order.sellerDeliveryPay, "Buyer can't receive more than he has paid");
    }

    modifier checkDelayMinimum(uint64 delay){
        require(delay >= 1 days, "Delay should be at least one day");
        _;
    }

    modifier checkSellerPayDelivery(uint128 sellerDeliveryPay, uint128 deliverPrice){
        require(sellerDeliveryPay <= deliverPrice, "Seller can't pay more than the delivery price");
        _;
    }

    function isActor(address sender, address buyer, address seller, address deliver)
    pure
    internal
    {
        require(sender == buyer || sender == seller || sender == deliver, "Should be an actor of the order");
    }

    function atStage(OrderStageLib.OrderStage current, OrderStageLib.OrderStage expected)
    internal
    pure
    {
        require(current == expected, "The order isn't at the required stage");
    }

}
