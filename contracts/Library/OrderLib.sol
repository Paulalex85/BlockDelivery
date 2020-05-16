pragma solidity 0.6.7;

import "./OrderStageLib.sol";
import "./DisputeLib.sol";
import "./EscrowLib.sol";
import "./DeliveryLib.sol";
import "./SafeMath.sol";
import "./SafeCast.sol";

library OrderLib {
    using SafeMath for uint128;

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

    event NewOrder(address indexed buyer, address indexed seller, address indexed deliver, uint256 orderId);
    event OrderUpdated(uint256 indexed orderId);
    event OrderValidate(uint256 indexed orderId, address user, bool isOrderStarted);
    event OrderTaken(uint256 indexed orderId);
    event OrderDelivered(uint256 indexed orderId);
    event OrderEnded(uint256 indexed orderId);
    event CancelOrder(uint256 indexed orderId, bool startedOrder);

    function createOrder(
        DeliveryLib.Delivery[] storage deliveries,
        address[3] calldata users,
        uint128 sellerPrice,
        uint128 deliverPrice,
        uint128 sellerDeliveryPay,
        uint64 delayEscrow,
        uint128[3] calldata escrowUsers
    )
    external
    returns (uint)
    {
        DisputeLib.isActor(msg.sender, users[0], users[1], users[2]);
        Order memory _order = OrderLib.Order({
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
        DeliveryLib.Delivery storage delivery,
        mapping(address => uint128) storage withdraws,
        uint deliveryId,
        uint128 sellerPrice,
        uint128 deliverPrice,
        uint128 sellerDeliveryPay,
        uint64 delayEscrow,
        uint128[3] calldata escrowUsers)
    external
    {
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

    function validateOrder(DeliveryLib.Delivery storage delivery, mapping(address => uint128) storage withdraws, uint deliveryId, bytes32 hash)
    external
    {
        DisputeLib.atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Initialization);

        if (msg.sender == delivery.order.buyer) {
            require(hash > 0, "Should set hash");
            require(!delivery.order.buyerValidation, "Buyer already validate");
            userValueWithdraw(withdraws, delivery.order.buyer, buyerPay(delivery));
            delivery.order.buyerValidation = true;
            delivery.order.buyerHash = hash;
        } else if (msg.sender == delivery.order.seller) {
            require(hash > 0, "Should set hash");
            require(!delivery.order.sellerValidation, "Seller already validate");
            userValueWithdraw(withdraws, delivery.order.seller, sellerPay(delivery));
            delivery.order.sellerValidation = true;
            delivery.order.sellerHash = hash;
        } else if (msg.sender == delivery.order.deliver) {
            require(!delivery.order.deliverValidation, "Deliver already validate");
            userValueWithdraw(withdraws, delivery.order.deliver, delivery.escrow.escrowDeliver);
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

    function initializationCancel(DeliveryLib.Delivery storage delivery, mapping(address => uint128) storage withdraws, uint deliveryId)
    external
    {
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

    function takeOrder(DeliveryLib.Delivery storage delivery, uint deliveryId, bytes calldata sellerKey)
    external
    {
        DisputeLib.atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Started);
        require(msg.sender == delivery.order.deliver, "Sender is not the deliver");
        require(keccak256(sellerKey) == delivery.order.sellerHash, "The key doesn't match with the stored hash");
        DisputeLib.checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        delivery.order.orderStage = OrderStageLib.OrderStage.Taken;
        emit OrderTaken(deliveryId);
    }

    function deliverOrder(DeliveryLib.Delivery storage delivery, uint deliveryId, bytes calldata buyerKey)
    external
    {
        DisputeLib.atStage(delivery.order.orderStage, OrderStageLib.OrderStage.Taken);
        require(msg.sender == delivery.order.deliver, "Sender is not the deliver");
        require(keccak256(buyerKey) == delivery.order.buyerHash, "The key doesn't match with the stored hash");
        DisputeLib.checkDelayExpire(delivery.order.startDate, delivery.escrow.delayEscrow);

        delivery.order.orderStage = OrderStageLib.OrderStage.Delivered;
        emit OrderDelivered(deliveryId);
    }

    function endOrder(DeliveryLib.Delivery storage delivery, mapping(address => uint128) storage withdraws, address owner, uint deliveryId)
    external
    {
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

    function userValueWithdraw(mapping(address => uint128) storage withdraws, address user, uint128 cost)
    internal
    {
        require(withdraws[user].add(SafeCast.toUint128(msg.value)) >= cost, "The value send isn't enough");
        withdraws[user] = withdraws[user].add(SafeCast.toUint128(msg.value)).sub(cost);
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
}