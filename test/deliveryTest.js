const truffleAssert = require('truffle-assertions');
const web3 = require('web3');
const assert = require('assert');
const DeliveryContract = artifacts.require("DeliveryContract");


contract("DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;

    const SELLER_PRICE = 20;
    const DELIVER_PRICE = 10;
    const DELAY_ORDER = 60 * 60; // 1 hour
    const DEFAULT_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

    const actors = {
        BUYER: "buyer",
        SELLER: "seller",
        DELIVER: "deliver"
    };

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[0];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Buyer Should use orderCreate", async () => {
        await createOrder(buyer);
    });

    it("Seller Should use orderCreate", async () => {
        await createOrder(seller);
    });

    it("Deliver Should use orderCreate", async () => {
        await createOrder(deliver);
    });

    it("Other account can't create account if the're not actor", async () => {
        await truffleAssert.reverts(
            createOrder(accounts[3])
        );
    });

    it("Should return an integer when orderCreate", async () => {
        let orderId = await deliveryInstance.createOrder.call(
            buyer,
            seller,
            deliver,
            SELLER_PRICE,
            DELIVER_PRICE,
            DELAY_ORDER,
            {from: buyer}
        );

        assert.strictEqual(orderId.toNumber(), 0, "Order should be stored with this id");
    });

    it("Shouldn't send eth to orderCreate", async () => {
        await truffleAssert.reverts(
            deliveryInstance.createOrder.call(
                buyer,
                seller,
                deliver,
                SELLER_PRICE,
                DELIVER_PRICE,
                DELAY_ORDER,
                {from: buyer, value: 50}
            ),
            "revert"
        );
    });

    it("Shouldn't create order with delay under one hour", async () => {
        await truffleAssert.reverts(
            deliveryInstance.createOrder.call(
                buyer,
                seller,
                deliver,
                SELLER_PRICE,
                DELIVER_PRICE,
                60 * 59, //59 minutes
                {from: buyer}
            ),
            "Delay should be at least one hour"
        );
    });

    // BuyerValidate

    it("Buyer should validate the order", async () => {
        await createOrder(buyer);
        await validateOrder(actors.BUYER,
            buyer,
            SELLER_PRICE + DELIVER_PRICE,
            0,
            false,
            true,
            false,
            false);
    });

    it("Seller and Deliver can't validateBuyer the order", async () => {
        await createOrder(buyer);

        await truffleAssert.reverts(
            validateOrder(actors.BUYER,
                seller,
                SELLER_PRICE + DELIVER_PRICE,
                0,
                false,
                true,
                false,
                false),
            "Sender is not the buyer"
        );

        await truffleAssert.reverts(
            validateOrder(actors.BUYER,
                deliver,
                SELLER_PRICE + DELIVER_PRICE,
                0,
                false,
                true,
                false,
                false),
            "Sender is not the buyer"
        );
    });

    it("Buyer can't validate twice the order", async () => {
        await createOrder(buyer);
        await validateOrder(actors.BUYER,
            buyer,
            SELLER_PRICE + DELIVER_PRICE,
            0,
            false,
            true,
            false,
            false);

        await truffleAssert.reverts(
            validateOrder(actors.BUYER,
                buyer,
                SELLER_PRICE + DELIVER_PRICE,
                0,
                false,
                true,
                false,
                false),
            "Buyer already validate"
        );
    });

    it("Buyer can't validate with not enough eth", async () => {
        await createOrder(buyer);


        await truffleAssert.reverts(
            validateOrder(actors.BUYER,
                buyer,
                SELLER_PRICE + DELIVER_PRICE - 1,
                0,
                false,
                true,
                false,
                false),
            "The value send isn't enough"
        );
    });

    it("Buyer can validate the order with too much eth", async () => {
        await createOrder(buyer);
        await validateOrder(actors.BUYER,
            buyer,
            SELLER_PRICE + DELIVER_PRICE + 1000000,
            0,
            false,
            true,
            false,
            false);
    });

    //Seller validate

    it("Seller should validate the order", async () => {
        await createOrder(buyer);
        await validateOrder(actors.SELLER,
            seller,
            0,
            0,
            false,
            false,
            true,
            false);
    });

    it("Buyer and Deliver can't validateSeller the order", async () => {
        await createOrder(buyer);

        await truffleAssert.reverts(
            validateOrder(actors.SELLER,
                buyer,
                0,
                0,
                false,
                false,
                true,
                false),
            "Sender is not the seller"
        );

        await truffleAssert.reverts(
            validateOrder(actors.SELLER,
                deliver,
                0,
                0,
                false,
                false,
                true,
                false),
            "Sender is not the seller"
        );
    });

    it("Seller can't validate twice the order", async () => {
        await createOrder(buyer);
        await validateOrder(actors.SELLER,
            seller,
            0,
            0,
            false,
            false,
            true,
            false);

        await truffleAssert.reverts(
            validateOrder(actors.SELLER,
                seller,
                0,
                0,
                false,
                false,
                true,
                false),
            "Seller already validate"
        );
    });

    //Deliver validate

    it("Deliver should validate the order", async () => {
        await createOrder(buyer);
        await validateOrder(actors.DELIVER,
            deliver,
            0,
            0,
            false,
            false,
            false,
            true);
    });

    it("Buyer and Seller can't validateDeliver the order", async () => {
        await createOrder(buyer);

        await truffleAssert.reverts(
            validateOrder(actors.DELIVER,
                buyer,
                0,
                0,
                false,
                false,
                false,
                true),
            "Sender is not the deliver"
        );

        await truffleAssert.reverts(
            validateOrder(actors.DELIVER,
                seller,
                0,
                0,
                false,
                false,
                false,
                true),
            "Sender is not the deliver"
        );
    });

    it("Deliver can't validate twice the order", async () => {
        await createOrder(buyer);
        await validateOrder(actors.DELIVER,
            deliver,
            0,
            0,
            false,
            false,
            false,
            true);

        await truffleAssert.reverts(
            validateOrder(actors.DELIVER,
                deliver,
                0,
                0,
                false,
                false,
                false,
                true),
            "Deliver already validate"
        );
    });

    //test order validate when pass to next stage

    it("Order to Started stage when buyer ending ", async () => {
        await createOrder(buyer);
        let orderId = 0;

        await completeValidationOrder(orderId);
    });

    it("Order to Started stage when seller ending ", async () => {
        await createOrder(buyer);

        let orderId = 0;
        await validateOrder(actors.BUYER,
            buyer,
            DELIVER_PRICE + SELLER_PRICE,
            orderId,
            false,
            true,
            false,
            false);
        await validateOrder(actors.DELIVER,
            deliver,
            0,
            orderId,
            false,
            true,
            false,
            true);
        await validateOrder(actors.SELLER,
            seller,
            0,
            orderId,
            true,
            true,
            true,
            true);
    });

    it("Order to Started stage when deliver ending ", async () => {
        await createOrder(buyer);
        let orderId = 0;
        await validateOrder(actors.BUYER,
            buyer,
            DELIVER_PRICE + SELLER_PRICE,
            orderId,
            false,
            true,
            false,
            false);
        await validateOrder(actors.SELLER,
            seller,
            0,
            orderId,
            false,
            true,
            true,
            false);
        await validateOrder(actors.DELIVER,
            deliver,
            0,
            orderId,
            true,
            true,
            true,
            true);
    });

    // test order validate when not stage init
    it("Should fail when validate order and order is already started", async () => {
        await createOrder(buyer);
        let orderId = 0;

        await completeValidationOrder(orderId);

        await truffleAssert.reverts(
            validateOrder(actors.BUYER,
                buyer,
                SELLER_PRICE + DELIVER_PRICE,
                0,
                false,
                true,
                false,
                false),
            "The order isn't at the required stage"
        );

        await truffleAssert.reverts(
            validateOrder(actors.SELLER,
                seller,
                0,
                0,
                false,
                false,
                true,
                false),
            "The order isn't at the required stage"
        );

        await truffleAssert.reverts(
            validateOrder(actors.DELIVER,
                deliver,
                0,
                0,
                false,
                false,
                false,
                true),
            "The order isn't at the required stage"
        );
    });

    //order taken

    it("Deliver should take the order ", async () => {
        await createOrder(buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(orderId);
        await takeOrder(orderId, keyHashSeller.key, deliver);
    });

    it("TakeOrder fail with wrong key ", async () => {
        await createOrder(buyer);
        let orderId = 0;

        await completeValidationOrder(orderId);
        await truffleAssert.reverts(
            takeOrder(orderId, generateKeyHash().key, deliver),
            "The key doesn't match with the stored hash"
        );
    });

    it("TakeOrder can't be call by seller or buyer ", async () => {
        await createOrder(buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(orderId);
        await truffleAssert.reverts(
            takeOrder(orderId, keyHashSeller.key, buyer),
            "Sender is not the deliver"
        );

        await truffleAssert.reverts(
            takeOrder(orderId, keyHashSeller.key, seller),
            "Sender is not the deliver"
        );
    });

    it("TakeOrder need started stage ", async () => {
        await createOrder(buyer);
        let orderId = 0;

        await truffleAssert.reverts(
            takeOrder(orderId, generateKeyHash().key, deliver),
            "The order isn't at the required stage"
        );
    });

    // order delivered

    it("Deliver should delivered the order ", async () => {
        await createOrder(buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(orderId);
        await takeOrder(orderId, keyHashSeller.key, deliver);
        await deliverOrder(orderId, keyHashBuyer.key, deliver);
    });

    it("DeliverOrder fail with wrong key ", async () => {
        await createOrder(buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(orderId);
        await takeOrder(orderId, keyHashSeller.key, deliver);
        await truffleAssert.reverts(
            deliverOrder(orderId, generateKeyHash().key, deliver),
            "The key doesn't match with the stored hash"
        );
    });

    it("DeliverOrder can't be call by seller or buyer ", async () => {
        await createOrder(buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(orderId);
        await takeOrder(orderId, keyHashSeller.key, deliver);
        await truffleAssert.reverts(
            deliverOrder(orderId, keyHashSeller.key, buyer),
            "Sender is not the deliver"
        );

        await truffleAssert.reverts(
            deliverOrder(orderId, keyHashSeller.key, seller),
            "Sender is not the deliver"
        );
    });

    it("DeliverOrder need taken stage ", async () => {
        await createOrder(buyer);
        let orderId = 0;

        await truffleAssert.reverts(
            deliverOrder(orderId, generateKeyHash().key, deliver),
            "The order isn't at the required stage"
        );
        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(orderId);
        await truffleAssert.reverts(
            deliverOrder(orderId, generateKeyHash().key, deliver),
            "The order isn't at the required stage"
        );
    });

    //utils

    async function createOrder(sender) {
        let tx = await deliveryInstance.createOrder(
            buyer,
            seller,
            deliver,
            SELLER_PRICE,
            DELIVER_PRICE,
            DELAY_ORDER,
            {from: sender}
        );

        assert.strictEqual(tx.receipt.logs.length, 1, "orderCreate() call did not log 1 event");
        assert.strictEqual(tx.logs.length, 1, "orderCreate() call did not log 1 event");

        truffleAssert.eventEmitted(tx, 'NewOrder', (ev) => {
            return ev.buyer === buyer
                && ev.seller === seller
                && ev.deliver === deliver
                && ev.orderId.toNumber() === 0;
        }, 'NewOrder should be emitted with correct parameters');
        await checkOrderCreationData(0, buyer, seller, deliver, SELLER_PRICE, DELIVER_PRICE, DELAY_ORDER);
    }

    async function validateOrder(typeValidation, sender, amountEth, orderId, shouldBeStarted, buyerValidation, sellerValidation, deliverValidation) {
        let keyHash = generateKeyHash();

        let tx = "";
        let eventType = "";
        if (typeValidation === actors.SELLER) {
            tx = await deliveryInstance.validateSeller(
                orderId,
                keyHash.hash,
                {from: sender}
            );
            eventType = "SellerValidate";
        } else if (typeValidation === actors.BUYER) {
            tx = await deliveryInstance.validateBuyer(
                orderId,
                keyHash.hash,
                {from: sender, value: amountEth}
            );
            eventType = "BuyerValidate";
        } else if (typeValidation === actors.DELIVER) {
            tx = await deliveryInstance.validateDeliver(
                orderId,
                {from: sender}
            );
            eventType = "DeliverValidate";
        }

        truffleAssert.eventEmitted(tx, eventType, (ev) => {
            return ev.orderId.toNumber() === orderId
                && ev.isOrderStarted === shouldBeStarted;
        }, eventType + ' should be emitted with correct parameters');

        let order = await deliveryInstance.getOrder.call(orderId);
        assert.strictEqual(order.buyerValidation, buyerValidation, "Buyer validation problem");
        assert.strictEqual(order.sellerValidation, sellerValidation, "Seller validation problem");
        assert.strictEqual(order.deliverValidation, deliverValidation, "Deliver validation problem");

        if (typeValidation === actors.SELLER) {
            assert.strictEqual(order.sellerHash, keyHash.hash, "Seller hash should be set");
        } else if (typeValidation === actors.BUYER) {
            assert.strictEqual(order.buyerHash, keyHash.hash, "Buyer hash should be set");
        }

        if (shouldBeStarted) {
            assert.strictEqual(order.orderStage.toNumber(), 1, "Should be stage started");
        } else {
            assert.strictEqual(order.orderStage.toNumber(), 0, "Should be stage initialization");
        }

        return keyHash;
    }

    function generateKeyHash() {
        let key = web3.utils.randomHex(32);
        let hash = web3.utils.keccak256(key);
        return {
            key: key,
            hash: hash
        }
    }

    async function completeValidationOrder(orderId) {
        let keyHashSeller = await validateOrder(actors.SELLER,
            seller,
            0,
            orderId,
            false,
            false,
            true,
            false);
        await validateOrder(actors.DELIVER,
            deliver,
            0,
            orderId,
            false,
            false,
            true,
            true);
        let keyHashBuyer = await validateOrder(actors.BUYER,
            buyer,
            DELIVER_PRICE + SELLER_PRICE,
            orderId,
            true,
            true,
            true,
            true);

        return {keyHashSeller, keyHashBuyer};
    }

    async function takeOrder(orderId, key, sender) {
        let tx = await deliveryInstance.orderTaken(
            orderId,
            key,
            {from: sender}
        );

        truffleAssert.eventEmitted(tx, 'OrderTaken', (ev) => {
            return ev.orderId.toNumber() === orderId;
        }, 'OrderTaken should be emitted with correct parameters');

        let order = await deliveryInstance.getOrder.call(orderId);
        assert.strictEqual(order.orderStage.toNumber(), 2, "Should be stage Taken");
    }

    async function deliverOrder(orderId, key, sender) {
        let tx = await deliveryInstance.orderDelivered(
            orderId,
            key,
            {from: sender}
        );

        truffleAssert.eventEmitted(tx, 'OrderDelivered', (ev) => {
            return ev.orderId.toNumber() === orderId;
        }, 'OrderDelivered should be emitted with correct parameters');

        let order = await deliveryInstance.getOrder.call(orderId);
        assert.strictEqual(order.orderStage.toNumber(), 3, "Should be stage Delivered");
    }

    async function checkOrderCreationData(orderId, buyer, seller, deliver, sellerPrice, deliverPrice, delay) {
        let order = await deliveryInstance.getOrder.call(orderId);

        assert.strictEqual(order.buyer, buyer, "Should be this buyer : " + buyer);
        assert.strictEqual(order.seller, seller, "Should be this seller : " + seller);
        assert.strictEqual(order.deliver, deliver, "Should be this deliver : " + deliver);
        assert.strictEqual(order.sellerPrice.toNumber(), sellerPrice, "Should be this sellerPrice : " + sellerPrice);
        assert.strictEqual(order.deliverPrice.toNumber(), deliverPrice, "Should be this deliverPrice : " + deliverPrice);
        assert.strictEqual(order.orderStage.toNumber(), 0, "Should be stage to initialization");
        assert.strictEqual(order.dateDelay.toNumber(), delay, "Should be this delay : " + delay);
        assert.strictEqual(order.buyerValidation, false, "Should be false");
        assert.strictEqual(order.sellerValidation, false, "Should be false");
        assert.strictEqual(order.deliverValidation, false, "Should be false");
        assert.strictEqual(order.sellerHash, DEFAULT_HASH, "Seller hash should be init to zero");
        assert.strictEqual(order.buyerHash, DEFAULT_HASH, "Buyer hash should be init to zero");

    }

    async function logContract(orderId) {
        let order = await deliveryInstance.getOrder.call(orderId);

        console.log("");
        console.log("DeliveryContract:");
        console.log("--------------");
        console.log("Buyer : " + order.buyer);
        console.log("Seller : " + order.seller);
        console.log("Deliver : " + order.deliver);
        console.log("Seller Price : " + order.sellerPrice);
        console.log("Deliver Price : " + order.deliverPrice);
        console.log("Order Stage : " + order.orderStage);
        console.log("Date delay : " + order.dateDelay);
        console.log("Buyer validation : " + order.buyerValidation);
        console.log("Seller validation : " + order.sellerValidation);
        console.log("Deliver validation : " + order.deliverValidation);
        console.log("Seller hash : " + order.sellerHash);
        console.log("Buyer hash : " + order.buyerHash);
        console.log("--------------");
    }
});
