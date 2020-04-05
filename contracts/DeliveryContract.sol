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

    event CancelOrder(
        uint256 indexed orderId,
        bool startedOrder
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
        bool buyerValidation;
        bool sellerValidation;
        bool deliverValidation;
        bytes32 sellerHash;
        bytes32 buyerHash;
    }

    struct EscrowOrder {
        uint64 delayEscrow;
        uint128 escrowAmountBuyer;
        uint128 escrowAmountSeller;
        uint128 escrowAmountDeliver;
    }

    Order[] orders;
    mapping(uint => EscrowOrder) public escrows;
    mapping(address => uint) public withdraws;

    function createOrder(
        address[3] memory _users,
        uint128 _sellerPrice,
        uint128 _deliverPrice,
        uint64 _delayEscrow,
        uint128[3] memory _escrowUsers
    )
    public
    isActor(msg.sender, _users[0], _users[1], _users[2])
    checkDelayMinimum(_delayEscrow)
    returns (uint)
    {
        Order memory _order = Order({
            buyer : _users[0],
            seller : _users[1],
            deliver : _users[2],
            deliverPrice : _deliverPrice,
            sellerPrice : _sellerPrice,
            orderStage : OrderStage.Initialization,
            dateCreation : uint64(now),
            buyerValidation : false,
            sellerValidation : false,
            deliverValidation : false,
            buyerHash : 0,
            sellerHash : 0
            });
        orders.push(_order);
        uint256 orderId = orders.length - 1;
        emit NewOrder(_users[0], _users[1], _users[2], orderId);

        EscrowOrder memory escrow = EscrowOrder({
            delayEscrow : _delayEscrow,
            escrowAmountBuyer : _escrowUsers[0],
            escrowAmountSeller : _escrowUsers[1],
            escrowAmountDeliver : _escrowUsers[2]
            });
        escrows[orderId] = escrow;
        return orderId;
    }

    function updateInitializeOrder(uint orderId, uint128 _sellerPrice, uint128 _deliverPrice, uint64 _delayEscrow, uint128 _escrowBuyer, uint128 _escrowSeller, uint128 _escrowDeliver)
    public
    atStage(orderId, OrderStage.Initialization)
    checkDelayMinimum(_delayEscrow)
    {
        Order storage order = orders[orderId];
        EscrowOrder storage escrow = escrows[orderId];

        require(msg.sender == order.buyer || msg.sender == order.seller || msg.sender == order.deliver, "Should be an actor of the order");

        escrow.delayEscrow = _delayEscrow;

        if (order.buyerValidation) {
            order.buyerValidation = false;
            withdraws[order.buyer] += order.sellerPrice + order.deliverPrice + escrow.escrowAmountBuyer;
        }

        if (order.sellerValidation) {
            order.sellerValidation = false;
            withdraws[order.seller] += escrow.escrowAmountSeller;
        }

        if (order.deliverValidation) {
            order.deliverValidation = false;
            withdraws[order.deliver] += escrow.escrowAmountDeliver;
        }

        order.sellerPrice = _sellerPrice;
        order.deliverPrice = _deliverPrice;
        escrow.escrowAmountBuyer = _escrowBuyer;
        escrow.escrowAmountSeller = _escrowSeller;
        escrow.escrowAmountDeliver = _escrowDeliver;

        emit OrderUpdated(orderId);
    }

    function validateBuyer(uint orderId, bytes32 hash)
    payable
    public
    atStage(orderId, OrderStage.Initialization)
    {
        Order storage order = orders[orderId];
        EscrowOrder storage escrow = escrows[orderId];

        require(msg.sender == order.buyer, "Sender is not the buyer");
        require(order.buyerValidation == false, "Buyer already validate");
        require(order.deliverPrice + order.sellerPrice + escrow.escrowAmountBuyer <= msg.value, "The value send isn't enough");

        order.buyerValidation = true;
        order.buyerHash = hash;

        if (order.sellerValidation && order.deliverValidation) {
            order.orderStage = OrderStage.Started;
        }

        emit BuyerValidate(orderId, order.orderStage == OrderStage.Started);
    }

    function validateSeller(uint orderId, bytes32 hash)
    public
    payable
    atStage(orderId, OrderStage.Initialization)
    {
        Order storage order = orders[orderId];
        EscrowOrder storage escrow = escrows[orderId];

        require(msg.sender == order.seller, "Sender is not the seller");
        require(order.sellerValidation == false, "Seller already validate");
        require(escrow.escrowAmountSeller <= msg.value, "The value send isn't enough");

        order.sellerValidation = true;
        order.sellerHash = hash;

        if (order.buyerValidation && order.deliverValidation) {
            order.orderStage = OrderStage.Started;
        }

        emit SellerValidate(orderId, order.orderStage == OrderStage.Started);
    }

    function validateDeliver(uint orderId)
    public
    payable
    atStage(orderId, OrderStage.Initialization)
    {
        Order storage order = orders[orderId];
        EscrowOrder storage escrow = escrows[orderId];

        require(msg.sender == order.deliver, "Sender is not the deliver");
        require(order.deliverValidation == false, "Deliver already validate");
        require(escrow.escrowAmountDeliver <= msg.value, "The value send isn't enough");

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
        EscrowOrder storage escrow = escrows[orderId];

        require(msg.sender == order.deliver, "Sender is not the deliver");
        require(keccak256(buyerKey) == order.buyerHash, "The key doesn't match with the stored hash");

        order.orderStage = OrderStage.Delivered;

        withdraws[order.seller] += order.sellerPrice + escrow.escrowAmountSeller;
        withdraws[order.deliver] += order.deliverPrice + escrow.escrowAmountDeliver;
        withdraws[order.buyer] += escrow.escrowAmountBuyer;
        emit OrderDelivered(orderId);
    }

    function initializationCancel(uint orderId)
    public
    atStage(orderId, OrderStage.Initialization)
    {
        Order storage order = orders[orderId];
        EscrowOrder storage escrow = escrows[orderId];

        require(msg.sender == order.buyer || msg.sender == order.seller || msg.sender == order.deliver, "Should be an actor of the order");

        order.orderStage = OrderStage.Cancel_Initialization;

        if (order.buyerValidation) {
            withdraws[order.buyer] += order.sellerPrice + order.deliverPrice + escrow.escrowAmountBuyer;
        }
        if (order.sellerValidation) {
            withdraws[order.seller] += escrow.escrowAmountSeller;
        }
        if (order.deliverValidation) {
            withdraws[order.deliver] += escrow.escrowAmountDeliver;
        }
        emit CancelOrder(orderId, false);
    }

    function withdrawBalance()
    public
    {
        uint balance = withdraws[msg.sender];
        withdraws[msg.sender] = 0;
        msg.sender.transfer(balance);
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
        buyerValidation = order.buyerValidation;
        sellerValidation = order.sellerValidation;
        deliverValidation = order.deliverValidation;
        sellerHash = order.sellerHash;
        buyerHash = order.buyerHash;
    }

    function getEscrow(uint orderId)
    external
    view
    returns (
        uint64 delayEscrow,
        uint128 escrowBuyer,
        uint128 escrowSeller,
        uint128 escrowDeliver
    ) {
        EscrowOrder storage escrow = escrows[orderId];

        delayEscrow = escrow.delayEscrow;
        escrowBuyer = escrow.escrowAmountBuyer;
        escrowSeller = escrow.escrowAmountSeller;
        escrowDeliver = escrow.escrowAmountDeliver;
    }

    modifier isActor(address sender, address buyer, address seller, address deliver){
        require(sender == buyer || sender == seller || sender == deliver, "Should be an actor of the order");
        _;
    }

    modifier checkDelayMinimum(uint64 delay){
        require(delay >= 1 days, "Delay should be at least one day");
        _;
    }

    modifier atStage(uint256 orderId, OrderStage expected) {
        require(orders[orderId].orderStage == expected, "The order isn't at the required stage");
        _;
    }
}
