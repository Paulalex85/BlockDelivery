pragma solidity >=0.4.21 <0.7.0;

import "./EventDelivery.sol";
import "./Library/OrderLib.sol";
import "./Library/OrderStageLib.sol";
import "./Library/EscrowLib.sol";
import "./Library/DisputeLib.sol";

contract DeliveryContract is EventDelivery {

    struct Delivery {
        OrderLib.Order order;
        EscrowLib.Escrow escrow;
    }

    Delivery[] deliveries;
    mapping(uint => DisputeLib.Dispute) public disputes;
    mapping(address => uint) public withdraws;

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

        Delivery memory _delivery = Delivery({
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
        Delivery storage delivery = deliveries[deliveryId];

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
        Delivery storage delivery = deliveries[deliveryId];
        atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Initialization);

        if (msg.sender == delivery.order.buyer) {
            require(delivery.order.buyerValidation == false, "Buyer already validate");
            require(buyerPay(delivery) <= msg.value, "The value send isn't enough");
            delivery.order.buyerValidation = true;
            delivery.order.buyerHash = hash;
        } else if (msg.sender == delivery.order.seller) {
            require(delivery.order.sellerValidation == false, "Seller already validate");
            require(sellerPay(delivery) <= msg.value, "The value send isn't enough");
            delivery.order.sellerValidation = true;
            delivery.order.sellerHash = hash;
        } else if (msg.sender == delivery.order.deliver) {
            require(delivery.order.deliverValidation == false, "Deliver already validate");
            require(delivery.escrow.escrowDeliver <= msg.value, "The value send isn't enough");
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
        Delivery storage delivery = deliveries[deliveryId];
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

    function orderTaken(uint deliveryId, bytes memory sellerKey)
    public
    {
        Delivery storage delivery = deliveries[deliveryId];
        atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Started);
        require(msg.sender == delivery.order.deliver, "Sender is not the deliver");
        require(keccak256(sellerKey) == delivery.order.sellerHash, "The key doesn't match with the stored hash");
        checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        delivery.order.orderStage = OrderStageLib.OrderStage.Taken;
        emit OrderTaken(deliveryId);
    }

    function orderDelivered(uint deliveryId, bytes memory buyerKey)
    public
    {
        Delivery storage delivery = deliveries[deliveryId];
        atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Taken);
        require(msg.sender == delivery.order.deliver, "Sender is not the deliver");
        require(keccak256(buyerKey) == delivery.order.buyerHash, "The key doesn't match with the stored hash");
        checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        delivery.order.orderStage = OrderStageLib.OrderStage.Delivered;

        withdraws[delivery.order.seller] += delivery.order.sellerPrice + delivery.escrow.escrowSeller;
        withdraws[delivery.order.deliver] += delivery.order.deliverPrice + delivery.escrow.escrowDeliver;
        withdraws[delivery.order.buyer] += delivery.escrow.escrowBuyer;
        emit OrderDelivered(deliveryId);
    }

    function createDispute(uint deliveryId, uint128 buyerReceive)
    public
    {
        Delivery storage delivery = deliveries[deliveryId];
        require(delivery.order.orderStage == OrderStageLib.OrderStage.Started || delivery.order.orderStage == OrderStageLib.OrderStage.Taken, "Order should be Started or Taken");
        isActor(msg.sender, delivery.order.buyer, delivery.order.seller, delivery.order.deliver);
        checkAmountBuyerReceiveDispute(buyerReceive, delivery.order);
        checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        DisputeLib.Dispute memory dispute = DisputeLib.Dispute({
            buyerReceive : buyerReceive,
            sellerBalance : 0,
            deliverBalance : 0,
            buyerAcceptEscrow : msg.sender == delivery.order.buyer,
            sellerAcceptEscrow : msg.sender == delivery.order.seller,
            deliverAcceptEscrow : msg.sender == delivery.order.deliver,
            previousStage : delivery.order.orderStage
            });

        disputes[deliveryId] = dispute;
        delivery.order.orderStage = OrderStageLib.OrderStage.Dispute_Refund_Determination;

        emit DisputeStarted(deliveryId, buyerReceive);
    }

    function refundProposalDispute(uint deliveryId, uint128 buyerReceive)
    public
    {
        Delivery storage delivery = deliveries[deliveryId];
        atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Dispute_Refund_Determination);
        checkAmountBuyerReceiveDispute(buyerReceive, delivery.order);
        checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        DisputeLib.Dispute storage dispute = disputes[deliveryId];

        if (msg.sender == delivery.order.seller) {
            dispute.sellerAcceptEscrow = true;
            dispute.deliverAcceptEscrow = false;
            dispute.buyerAcceptEscrow = false;
        } else if (msg.sender == delivery.order.deliver) {
            dispute.sellerAcceptEscrow = false;
            dispute.deliverAcceptEscrow = true;
            dispute.buyerAcceptEscrow = false;
        } else if (msg.sender == delivery.order.buyer) {
            dispute.sellerAcceptEscrow = false;
            dispute.deliverAcceptEscrow = false;
            dispute.buyerAcceptEscrow = true;
        } else {
            revert("Should be an actor of the order");
        }

        dispute.buyerReceive = buyerReceive;
        emit DisputeRefundProposal(deliveryId, buyerReceive);
    }

    function acceptDisputeProposal(uint deliveryId)
    public
    {
        Delivery storage delivery = deliveries[deliveryId];
        DisputeLib.Dispute storage dispute = disputes[deliveryId];
        atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Dispute_Refund_Determination);
        checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        if (msg.sender == delivery.order.seller) {
            require(dispute.sellerAcceptEscrow == false, "Seller already accept dispute");
            dispute.sellerAcceptEscrow = true;
        } else if (msg.sender == delivery.order.deliver) {
            require(dispute.deliverAcceptEscrow == false, "Deliver already accept dispute");
            dispute.deliverAcceptEscrow = true;
        } else if (msg.sender == delivery.order.buyer) {
            require(dispute.buyerAcceptEscrow == false, "Buyer already accept dispute");
            dispute.buyerAcceptEscrow = true;
        } else {
            revert("Should be an actor of the order");
        }

        if (dispute.sellerAcceptEscrow && dispute.deliverAcceptEscrow && dispute.buyerAcceptEscrow) {
            delivery.order.orderStage = OrderStageLib.OrderStage.Dispute_Cost_Repartition;
            dispute.deliverAcceptEscrow = false;
            dispute.sellerAcceptEscrow = false;
            withdraws[delivery.order.buyer] += delivery.escrow.escrowBuyer + dispute.buyerReceive;

            emit AcceptProposal(deliveryId, msg.sender, true);
        } else {
            emit AcceptProposal(deliveryId, msg.sender, false);
        }
    }

    function costDisputeProposal(uint deliveryId, int128 sellerBalance, int128 deliverBalance)
    payable
    public
    {
        Delivery storage delivery = deliveries[deliveryId];
        DisputeLib.Dispute storage dispute = disputes[deliveryId];
        require(delivery.order.orderStage == OrderStageLib.OrderStage.Dispute_Cost_Repartition, "Order should be Cost Repartition stage");
        require(sellerBalance + deliverBalance + int128(dispute.buyerReceive) == 0, "Cost repartition should be equal to 0");
        checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        dispute.deliverBalance = deliverBalance;
        dispute.sellerBalance = sellerBalance;

        if (msg.sender == delivery.order.seller) {
            if (checkBalanceEscrow(int128(delivery.order.sellerPrice), int128(delivery.escrow.escrowSeller), sellerBalance)) {
                delivery.escrow.escrowSeller += uint128(msg.value);
            }
            dispute.sellerAcceptEscrow = true;
            dispute.deliverAcceptEscrow = false;
        } else if (msg.sender == delivery.order.deliver) {
            if (checkBalanceEscrow(int128(delivery.order.deliverPrice), int128(delivery.escrow.escrowDeliver), deliverBalance)) {
                delivery.escrow.escrowDeliver += uint128(msg.value);
            }
            dispute.deliverAcceptEscrow = true;
            dispute.sellerAcceptEscrow = false;
        } else {
            revert("Should be the seller or the deliver of the order");
        }

        emit DisputeCostProposal(deliveryId, sellerBalance, deliverBalance);
    }

    function acceptCostProposal(uint deliveryId)
    payable
    public
    {
        Delivery storage delivery = deliveries[deliveryId];
        DisputeLib.Dispute storage dispute = disputes[deliveryId];
        require(delivery.order.orderStage == OrderStageLib.OrderStage.Dispute_Cost_Repartition, "Order should be Cost Repartition stage");
        checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        if (msg.sender == delivery.order.seller) {
            require(dispute.deliverAcceptEscrow && !dispute.sellerAcceptEscrow, "Cost Repartition is not defined");
            dispute.sellerAcceptEscrow = true;
            if (checkBalanceEscrow(int128(delivery.order.sellerPrice), int128(delivery.escrow.escrowSeller), dispute.sellerBalance)) {
                delivery.escrow.escrowSeller += uint128(msg.value);
            }
        } else if (msg.sender == delivery.order.deliver) {
            require(dispute.sellerAcceptEscrow && !dispute.deliverAcceptEscrow, "Cost Repartition is not defined");
            dispute.deliverAcceptEscrow = true;
            if (checkBalanceEscrow(int128(delivery.order.deliverPrice), int128(delivery.escrow.escrowDeliver), dispute.deliverBalance)) {
                delivery.escrow.escrowDeliver += uint128(msg.value);
            }
        } else {
            revert("Should be the seller or the deliver of the order");
        }

        delivery.order.orderStage = OrderStageLib.OrderStage.Cancel_Order;

        withdraws[delivery.order.deliver] += uint128(int128(delivery.order.deliverPrice) + int128(delivery.escrow.escrowDeliver) + dispute.deliverBalance);
        withdraws[delivery.order.seller] += uint128(int128(delivery.order.sellerPrice) + int128(delivery.escrow.escrowSeller) + dispute.sellerBalance);

        emit CancelOrder(deliveryId, true);
    }

    function revertDispute(uint deliveryId)
    public
    {
        Delivery storage delivery = deliveries[deliveryId];
        DisputeLib.Dispute storage dispute = disputes[deliveryId];
        require(delivery.order.orderStage == OrderStageLib.OrderStage.Dispute_Refund_Determination, "Order should be Refund Determination stage");
        isActor(msg.sender, delivery.order.buyer, delivery.order.seller, delivery.order.deliver);
        checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        delivery.order.orderStage = dispute.previousStage;
        delete disputes[deliveryId];
        emit RevertDispute(deliveryId, msg.sender);
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
        Delivery storage delivery = deliveries[deliveryId];

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
        Delivery storage delivery = deliveries[deliveryId];

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

    function checkDelayExpire(uint64 startDate, uint64 delay)
    view
    internal
    {
        require(uint64(now) < startDate + delay, "Delay of the order is passed");
    }

    function buyerPay(Delivery storage delivery)
    internal
    view
    returns (uint128)
    {
        return delivery.order.deliverPrice + delivery.order.sellerPrice + delivery.escrow.escrowBuyer - delivery.order.sellerDeliveryPay;
    }

    function sellerPay(Delivery storage delivery)
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

    function checkBalanceEscrow(int128 price, int128 escrow, int128 balance)
    internal
    returns (bool)
    {
        int128 currentBalance = price + escrow + balance;
        if (currentBalance < 0) {
            require(msg.value >= uint(- currentBalance), "User need to send additional cost");
            return true;
        }
        return false;
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
