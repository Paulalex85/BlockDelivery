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
            )
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
            )
        );
    });

    it("Buyer should validate the order", async () => {
        await deliveryInstance.createOrder(
            buyer,
            seller,
            deliver,
            SELLER_PRICE,
            DELIVER_PRICE,
            DELAY_ORDER,
            {from: buyer}
        );

        await checkOrderCreationData(0, buyer, seller, deliver, SELLER_PRICE, DELIVER_PRICE, DELAY_ORDER);

        let keyBuyer = web3.utils.randomHex(32);
        let hashBuyer = web3.utils.keccak256(keyBuyer);

        let tx = await deliveryInstance.validateBuyer(
            0,
            hashBuyer,
            {from: buyer, value: SELLER_PRICE + DELIVER_PRICE}
        );

        truffleAssert.eventEmitted(tx, 'BuyerValidate', (ev) => {
            return ev.orderId.toNumber() === 0
                && ev.isOrderStarted === false;
        }, 'BuyerValidate should be emitted with correct parameters');

        let order = await deliveryInstance.getOrder.call(0);
        assert.strictEqual(order.buyerValidation, true, "Should be true");
        assert.strictEqual(order.sellerValidation, false, "Should be false");
        assert.strictEqual(order.deliverValidation, false, "Should be false");
        assert.strictEqual(order.buyerHash, hashBuyer, "Buyer hash should be set");
        assert.strictEqual(order.orderStage.toNumber(), 0, "Should be stage to initialization");
    });

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
