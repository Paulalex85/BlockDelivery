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

}

contract DeliveryContract is EventDelivery {

    enum OrderStage {
        Initialization, //0
        Started, //1
        Taken, //2
        Delivered, //3
        Validated, //4
        Cancel_Order, //5
        Dispute_Refund_Determination, //6
        Dispute_Cost_Repartition //7
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

    struct Dispute {
        uint128 buyerReceive;
        uint128 sellerPay;
        uint128 deliverPay;
        bool buyerAcceptEscrow;
        bool sellerAcceptEscrow;
        bool deliverAcceptEscrow;
    }

    Order[] orders;
    mapping(uint => EscrowOrder) public escrows;
    mapping(uint => Dispute) public disputes;
    mapping(address => uint) public withdraws;

    function createOrder(
        address[3] memory _users,
        uint128 _sellerPrice,
        uint128 _deliverPrice,
        uint64 _delayEscrow,
        uint128[3] memory _escrowUsers
    )
    public
    checkDelayMinimum(_delayEscrow)
    returns (uint)
    {
        isActor(msg.sender, _users[0], _users[1], _users[2]);
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

        order.orderStage = OrderStage.Cancel_Order;

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

    function createDispute(uint orderId, uint128 buyerReceive)
    public
    {
        Order storage order = orders[orderId];
        isActor(msg.sender, order.buyer, order.seller, order.deliver);
        require(order.orderStage == OrderStage.Started || order.orderStage == OrderStage.Taken, "Order should be Started or Taken");
        checkAmountBuyerReceiveDispute(buyerReceive, order.deliverPrice + order.sellerPrice);

        Dispute memory dispute = Dispute({
            buyerReceive : buyerReceive,
            sellerPay : 0,
            deliverPay : 0,
            buyerAcceptEscrow : false,
            sellerAcceptEscrow : false,
            deliverAcceptEscrow : false
            });

        if (msg.sender == order.seller) {
            dispute.sellerAcceptEscrow = true;
        } else if (msg.sender == order.deliver) {
            dispute.deliverAcceptEscrow = true;
        } else {
            dispute.buyerAcceptEscrow = true;
        }

        disputes[orderId] = dispute;

        order.orderStage = OrderStage.Dispute_Refund_Determination;

        emit DisputeStarted(orderId, buyerReceive);
    }

    function refundProposalDispute(uint orderId, uint128 buyerReceive)
    public
    {
        Order storage order = orders[orderId];
        isActor(msg.sender, order.buyer, order.seller, order.deliver);
        require(order.orderStage == OrderStage.Dispute_Refund_Determination, "Order should be Refund Determination stage");
        checkAmountBuyerReceiveDispute(buyerReceive, order.deliverPrice + order.sellerPrice);

        Dispute storage dispute = disputes[orderId];

        if (msg.sender == order.seller) {
            dispute.sellerAcceptEscrow = true;
            dispute.deliverAcceptEscrow = false;
            dispute.buyerAcceptEscrow = false;
        } else if (msg.sender == order.deliver) {
            dispute.sellerAcceptEscrow = false;
            dispute.deliverAcceptEscrow = true;
            dispute.buyerAcceptEscrow = false;
        } else {
            dispute.sellerAcceptEscrow = false;
            dispute.deliverAcceptEscrow = false;
            dispute.buyerAcceptEscrow = true;
        }

        dispute.buyerReceive = buyerReceive;
        emit DisputeRefundProposal(orderId, buyerReceive);
    }

    function acceptDisputeProposal(uint orderId)
    public
    {
        Order storage order = orders[orderId];
        isActor(msg.sender, order.buyer, order.seller, order.deliver);
        require(order.orderStage == OrderStage.Dispute_Refund_Determination, "Order should be Refund Determination stage");

        Dispute storage dispute = disputes[orderId];
        EscrowOrder storage escrow = escrows[orderId];

        if (msg.sender == order.seller) {
            require(dispute.sellerAcceptEscrow == false, "Seller already accept dispute");
            dispute.sellerAcceptEscrow = true;
        } else if (msg.sender == order.deliver) {
            require(dispute.deliverAcceptEscrow == false, "Deliver already accept dispute");
            dispute.deliverAcceptEscrow = true;
        } else {
            require(dispute.buyerAcceptEscrow == false, "Buyer already accept dispute");
            dispute.buyerAcceptEscrow = true;
        }

        if (dispute.sellerAcceptEscrow && dispute.deliverAcceptEscrow && dispute.buyerAcceptEscrow) {
            order.orderStage = OrderStage.Dispute_Cost_Repartition;
            dispute.deliverAcceptEscrow = false;
            dispute.sellerAcceptEscrow = false;
            withdraws[order.buyer] += escrow.escrowAmountBuyer + dispute.buyerReceive;

            emit AcceptProposal(orderId, msg.sender, true);
        } else {
            emit AcceptProposal(orderId, msg.sender, false);
        }
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

    function getDispute(uint orderId)
    external
    view
    returns (
        uint128 buyerReceive,
        uint128 sellerPay,
        uint128 deliverPay,
        bool buyerAcceptEscrow,
        bool sellerAcceptEscrow,
        bool deliverAcceptEscrow
    ) {
        Dispute storage dispute = disputes[orderId];

        buyerReceive = dispute.buyerReceive;
        sellerPay = dispute.sellerPay;
        deliverPay = dispute.deliverPay;
        buyerAcceptEscrow = dispute.buyerAcceptEscrow;
        sellerAcceptEscrow = dispute.sellerAcceptEscrow;
        deliverAcceptEscrow = dispute.deliverAcceptEscrow;
    }

    function isActor(address sender, address buyer, address seller, address deliver)
    pure
    internal
    {
        require(sender == buyer || sender == seller || sender == deliver, "Should be an actor of the order");
    }

    function checkAmountBuyerReceiveDispute(uint128 buyerReceive, uint128 orderAmount)
    pure
    internal
    {
        require(buyerReceive <= orderAmount, "Buyer can't receive more than he has paid");
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
