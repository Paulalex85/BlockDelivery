pragma solidity >=0.4.21 <0.7.0;

contract EventDelivery {

    event NewOrder(
        address indexed buyer,
        address indexed seller,
        address indexed deliver,
        uint256 orderId
    );

    event BuyerValidate(
        uint256 indexed orderId,
        bool isOrderStarted
    );

    event SellerValidate(
        uint256 indexed orderId,
        bool isOrderStarted
    );

    event DeliverValidate(
        uint256 indexed orderId,
        bool isOrderStarted
    );

    event OrderTaken(
        uint256 indexed orderId
    );

    event OrderDelivered(
        uint256 indexed orderId
    );

}

contract DeliveryContract is EventDelivery {

    enum OrderStage {
        Initialization,
        Started,
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
    isActor(msg.sender, _buyer, _seller, _deliver)
    returns (uint)
    {
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

    function validateBuyer(uint orderId, bytes32 hash)
    payable
    public
    atStage(orderId, OrderStage.Initialization)
    {
        Order storage order = orders[orderId];

        require(msg.sender == order.buyer, "Sender is not the buyer");
        require(order.buyerValidation == false, "Buyer already validate");
        require(order.deliverPrice + order.sellerPrice <= msg.value, "The value send isn't enough");

        order.buyerValidation = true;
        order.buyerHash = hash;

        if (order.sellerValidation && order.deliverValidation) {
            order.orderStage = OrderStage.Started;
        }

        emit BuyerValidate(orderId, order.orderStage == OrderStage.Started);
    }

    function validateSeller(uint orderId, bytes32 hash)
    public
    atStage(orderId, OrderStage.Initialization)
    {
        Order storage order = orders[orderId];

        require(msg.sender == order.seller, "Sender is not the seller");
        require(order.sellerValidation == false, "Seller already validate");

        order.sellerValidation = true;
        order.sellerHash = hash;

        if (order.buyerValidation && order.deliverValidation) {
            order.orderStage = OrderStage.Started;
        }

        emit SellerValidate(orderId, order.orderStage == OrderStage.Started);
    }

    function validateDeliver(uint orderId)
    public
    atStage(orderId, OrderStage.Initialization)
    {
        Order storage order = orders[orderId];

        require(msg.sender == order.deliver, "Sender is not the deliver");
        require(order.deliverValidation == false, "Deliver already validate");

        order.deliverValidation = true;

        if (order.buyerValidation && order.sellerValidation) {
            order.orderStage = OrderStage.Started;
        }

        emit DeliverValidate(orderId, order.orderStage == OrderStage.Started);
    }

    function orderTaken(uint orderId, bytes memory sellerKey)
    public
    atStage(orderId, OrderStage.Started)
    {
        Order storage order = orders[orderId];

        require(msg.sender == order.deliver, "Sender is not the deliver");
        require(keccak256(sellerKey) == order.sellerHash, "The key doesn't match with the stored hash");

        order.orderStage = OrderStage.Taken;
        emit OrderTaken(orderId);
    }

    function orderDelivered(uint orderId, bytes memory buyerKey)
    public
    atStage(orderId, OrderStage.Taken)
    {
        Order storage order = orders[orderId];

        require(msg.sender == order.deliver, "Sender is not the deliver");
        require(keccak256(buyerKey) == order.buyerHash, "The key doesn't match with the stored hash");

        order.orderStage = OrderStage.Delivered;
        emit OrderDelivered(orderId);
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

    modifier isActor(address sender, address buyer, address seller, address deliver){
        require(sender == buyer || sender == seller || sender == deliver, "Should be an actor of the order");
        _;
    }

    modifier atStage(uint256 orderId, OrderStage expected) {
        require(orders[orderId].orderStage == expected, "The order isn't at the required stage");
        _;
    }
}
