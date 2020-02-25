pragma solidity >=0.4.21 <0.7.0;

contract EventDelivery {

    event NewOrder(
        address indexed buyer,
        address indexed seller,
        address indexed deliver,
        uint256 orderId
    );

}

contract DeliveryContract is EventDelivery {

    enum OrderStage {
        Initialization,
        Started,
        Prepared,
        Taken,
        Delivered,
        Cancel_Initialization,
        Cancel_Order
    }

    struct Order {
        address buyer;
        address seller;
        address deliver;
        uint128 deliverPrice;
        uint128 sellerPrice;
        OrderStage orderStage;
        uint64 dateCreation;
        uint64 dateDelay;
        bool buyerValidation;
        bool sellerValidation;
        bool deliverValidation;
        bytes32 sellerHash;
        bytes32 buyerHash;
    }

    Order[] public orders;

    function createOrder(
        address _buyer,
        address _seller,
        address _deliver,
        uint128 _sellerPrice,
        uint128 _deliverPrice,
        uint64 _delay
    )
    public
    returns (uint)
    {
        require(msg.sender == _buyer || msg.sender == _seller || msg.sender == _deliver, "Should be an actor of the order");
        require(_delay >= 1 hours, "Delay should be at least one hour");
        Order memory _order = Order({
            buyer : _buyer,
            seller : _seller,
            deliver : _deliver,
            deliverPrice : _deliverPrice,
            sellerPrice : _sellerPrice,
            orderStage : OrderStage.Initialization,
            dateCreation : uint64(now),
            dateDelay : _delay,
            buyerValidation : false,
            sellerValidation : false,
            deliverValidation : false,
            sellerHash : 0,
            buyerHash : 0
            });
        orders.push(_order);
        uint256 orderId = orders.length - 1;
        emit NewOrder(_buyer, _seller, _deliver, orderId);
        return orderId;
    }

    function getOrder(uint orderId)
    external
    view
    returns (
        address buyer,
        address seller,
        address deliver,
        uint128 deliverPrice,
        uint128 sellerPrice,
        OrderStage orderStage,
        uint64 dateCreation,
        uint64 dateDelay,
        bool buyerValidation,
        bool sellerValidation,
        bool deliverValidation,
        bytes32 sellerHash,
        bytes32 buyerHash
    ) {
        Order storage order = orders[orderId];

        buyer = order.buyer;
        seller = order.seller;
        deliver = order.deliver;
        deliverPrice = order.deliverPrice;
        sellerPrice = order.sellerPrice;
        orderStage = order.orderStage;
        dateCreation = order.dateCreation;
        dateDelay = order.dateDelay;
        buyerValidation = order.buyerValidation;
        sellerValidation = order.sellerValidation;
        deliverValidation = order.deliverValidation;
        sellerHash = order.sellerHash;
        buyerHash = order.buyerHash;
    }
}
