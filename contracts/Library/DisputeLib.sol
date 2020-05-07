pragma solidity >=0.4.21 <0.7.0;

import "./OrderStageLib.sol";
import "./DeliveryLib.sol";

library DisputeLib {

    struct Dispute {
        uint128 buyerReceive;
        int128 sellerBalance;
        bool buyerAcceptEscrow;
        bool sellerAcceptEscrow;
        bool deliverAcceptEscrow;
        OrderStageLib.OrderStage previousStage;
    }

    event DisputeStarted(uint256 indexed orderId, uint128 buyerProposal);
    event DisputeRefundProposal(uint256 indexed orderId, uint128 buyerProposal);
    event AcceptProposal(uint256 indexed orderId, address user, bool proposalAccepted);
    event DisputeCostProposal(uint256 indexed orderId, int128 sellerBalance);
    event CancelOrder(uint256 indexed orderId, bool startedOrder);
    event RevertDispute(uint256 indexed orderId, address user);

    function createDispute(DeliveryLib.Delivery storage delivery, mapping(uint => DisputeLib.Dispute) storage disputes, uint128 buyerReceive, uint deliveryId)
    public
    {
        require(delivery.order.orderStage == OrderStageLib.OrderStage.Started || delivery.order.orderStage == OrderStageLib.OrderStage.Taken, "Order should be Started or Taken");
        isActor(msg.sender, delivery.order.buyer, delivery.order.seller, delivery.order.deliver);
        checkAmountBuyerReceiveDispute(buyerReceive, delivery.order);
        checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        Dispute memory dispute = Dispute({
            buyerReceive : buyerReceive,
            sellerBalance : 0,
            buyerAcceptEscrow : msg.sender == delivery.order.buyer,
            sellerAcceptEscrow : msg.sender == delivery.order.seller,
            deliverAcceptEscrow : msg.sender == delivery.order.deliver,
            previousStage : delivery.order.orderStage
            });

        disputes[deliveryId] = dispute;
        delivery.order.orderStage = OrderStageLib.OrderStage.Dispute_Refund_Determination;

        emit DisputeStarted(deliveryId, buyerReceive);
    }

    function refundProposalDispute(DeliveryLib.Delivery storage delivery, mapping(uint => DisputeLib.Dispute) storage disputes, uint deliveryId, uint128 buyerReceive)
    public
    {
        atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Dispute_Refund_Determination);
        checkAmountBuyerReceiveDispute(buyerReceive, delivery.order);
        checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        Dispute storage dispute = disputes[deliveryId];

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

    function acceptDisputeProposal(DeliveryLib.Delivery storage delivery, mapping(uint => DisputeLib.Dispute) storage disputes, mapping(address => uint128) storage withdraws, uint deliveryId)
    public
    {
        Dispute storage dispute = disputes[deliveryId];
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

    function costDisputeProposal(DeliveryLib.Delivery storage delivery, mapping(uint => DisputeLib.Dispute) storage disputes, mapping(address => uint128) storage withdraws, uint deliveryId, int128 sellerBalance)
    public
    {
        Dispute storage dispute = disputes[deliveryId];
        require(delivery.order.orderStage == OrderStageLib.OrderStage.Dispute_Cost_Repartition, "Order should be Cost Repartition stage");
        checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        dispute.sellerBalance = sellerBalance;

        if (msg.sender == delivery.order.seller) {
            int128 current = sellerBalance - int128(dispute.buyerReceive) / 2;
            delivery.escrow.escrowSeller += checkBalanceEscrow(withdraws, delivery.order.seller, int128(delivery.order.sellerPrice), int128(delivery.escrow.escrowSeller), current);
            dispute.sellerAcceptEscrow = true;
            dispute.deliverAcceptEscrow = false;
        } else if (msg.sender == delivery.order.deliver) {
            int128 current = (- sellerBalance) - int128(dispute.buyerReceive) / 2;
            delivery.escrow.escrowDeliver += checkBalanceEscrow(withdraws, delivery.order.deliver, int128(delivery.order.deliverPrice), int128(delivery.escrow.escrowDeliver), current);
            dispute.deliverAcceptEscrow = true;
            dispute.sellerAcceptEscrow = false;
        } else {
            revert("Should be the seller or the deliver of the order");
        }

        emit DisputeCostProposal(deliveryId, sellerBalance);
    }

    function acceptCostProposal(DeliveryLib.Delivery storage delivery, mapping(uint => DisputeLib.Dispute) storage disputes, mapping(address => uint128) storage withdraws, uint deliveryId)
    public
    {
        Dispute storage dispute = disputes[deliveryId];
        require(delivery.order.orderStage == OrderStageLib.OrderStage.Dispute_Cost_Repartition, "Order should be Cost Repartition stage");
        checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        int128 currentSeller = dispute.sellerBalance - int128(dispute.buyerReceive) / 2;
        int128 currentDeliver = (- dispute.sellerBalance) - int128(dispute.buyerReceive) / 2;
        if (msg.sender == delivery.order.seller) {
            require(dispute.deliverAcceptEscrow && !dispute.sellerAcceptEscrow, "Cost Repartition is not defined");
            delivery.escrow.escrowSeller += checkBalanceEscrow(withdraws, delivery.order.seller, int128(delivery.order.sellerPrice), int128(delivery.escrow.escrowSeller), currentSeller);
            dispute.sellerAcceptEscrow = true;
        } else if (msg.sender == delivery.order.deliver) {
            require(dispute.sellerAcceptEscrow && !dispute.deliverAcceptEscrow, "Cost Repartition is not defined");
            delivery.escrow.escrowDeliver += checkBalanceEscrow(withdraws, delivery.order.deliver, int128(delivery.order.deliverPrice), int128(delivery.escrow.escrowDeliver), currentDeliver);
            dispute.deliverAcceptEscrow = true;
        } else {
            revert("Should be the seller or the deliver of the order");
        }

        delivery.order.orderStage = OrderStageLib.OrderStage.Cancel_Order;

        withdraws[delivery.order.deliver] += uint128(int128(delivery.order.deliverPrice) + int128(delivery.escrow.escrowDeliver) + currentDeliver);
        withdraws[delivery.order.seller] += uint128(int128(delivery.order.sellerPrice) + int128(delivery.escrow.escrowSeller) + currentSeller);

        emit CancelOrder(deliveryId, true);
    }

    function revertDispute(DeliveryLib.Delivery storage delivery, mapping(uint => DisputeLib.Dispute) storage disputes, uint deliveryId)
    public
    {
        Dispute storage dispute = disputes[deliveryId];
        require(delivery.order.orderStage == OrderStageLib.OrderStage.Dispute_Refund_Determination, "Order should be Refund Determination stage");
        isActor(msg.sender, delivery.order.buyer, delivery.order.seller, delivery.order.deliver);
        checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        delivery.order.orderStage = dispute.previousStage;
        delete disputes[deliveryId];
        emit RevertDispute(deliveryId, msg.sender);
    }

    function isActor(address sender, address buyer, address seller, address deliver)
    pure
    internal
    {
        require(sender == buyer || sender == seller || sender == deliver, "Should be an actor of the order");
    }

    function checkAmountBuyerReceiveDispute(uint128 buyerReceive, OrderLib.Order storage order)
    view
    internal
    {
        require(buyerReceive <= order.deliverPrice + order.sellerPrice - order.sellerDeliveryPay, "Buyer can't receive more than he has paid");
    }

    function checkDelayExpire(uint64 startDate, uint64 delay)
    view
    internal
    {
        require(uint64(now) < startDate + delay, "Delay of the order is passed");
    }

    function atStage(OrderStageLib.OrderStage current, OrderStageLib.OrderStage expected)
    internal
    pure
    {
        require(current == expected, "The order isn't at the required stage");
    }

    function checkBalanceEscrow(mapping(address => uint128) storage withdraws, address user, int128 price, int128 escrow, int128 balance)
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


}