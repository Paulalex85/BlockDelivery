const truffleAssert = require('truffle-assertions');
const {createOrder, validateOrder, updateInitializeOrder, completeValidationOrder, takeOrder, initCancelOrder, deliverOrder} = require("./utils/orderMethods");
const DeliveryContract = artifacts.require("DeliveryContract");
const {generateKeyHash} = require('./utils/tools');
const {SELLER_PRICE, DELIVER_PRICE, DELAY_ORDER, actors} = require('./utils/constants');

contract("update order method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;
    let NEW_SELLER_PRICE = SELLER_PRICE + 1000000;
    let NEW_DELIVER_PRICE = DELIVER_PRICE + 100000;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[0];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Buyer can update the order ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await updateInitializeOrder(deliveryInstance, buyer, seller, deliver, NEW_SELLER_PRICE, NEW_DELIVER_PRICE, DELAY_ORDER * 2, buyer);
    });

    it("Buyer can update the order after validation", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.BUYER,
            buyer,
            SELLER_PRICE + DELIVER_PRICE,
            0,
            false,
            true,
            false,
            false);
        await updateInitializeOrder(deliveryInstance, buyer, seller, deliver, NEW_SELLER_PRICE, NEW_DELIVER_PRICE, DELAY_ORDER * 2, buyer);
    });

    it("Buyer pay the new price after update", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await updateInitializeOrder(deliveryInstance, buyer, seller, deliver, NEW_SELLER_PRICE, NEW_DELIVER_PRICE, DELAY_ORDER * 2, buyer);

        await truffleAssert.reverts(
            validateOrder(deliveryInstance,
                actors.BUYER,
                buyer,
                SELLER_PRICE + DELIVER_PRICE,
                0,
                false,
                true,
                false,
                false),
            "The value send isn't enough"
        );

        await validateOrder(deliveryInstance,
            actors.BUYER,
            buyer,
            NEW_SELLER_PRICE + NEW_DELIVER_PRICE,
            0,
            false,
            true,
            false,
            false);
    });

    it("Seller can update the order ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await updateInitializeOrder(deliveryInstance, buyer, seller, deliver, NEW_SELLER_PRICE, NEW_DELIVER_PRICE, DELAY_ORDER * 2, seller);
    });

    it("Seller can update the order after validation", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.SELLER,
            seller,
            SELLER_PRICE + DELIVER_PRICE,
            0,
            false,
            false,
            true,
            false);
        await updateInitializeOrder(deliveryInstance, buyer, seller, deliver, NEW_SELLER_PRICE, NEW_DELIVER_PRICE, DELAY_ORDER * 2, seller);
    });

    it("Deliver can update the order ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await updateInitializeOrder(deliveryInstance, buyer, seller, deliver, NEW_SELLER_PRICE, NEW_DELIVER_PRICE, DELAY_ORDER * 2, deliver);
    });

    it("Deliver can update the order after validation", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.DELIVER,
            deliver,
            SELLER_PRICE + DELIVER_PRICE,
            0,
            false,
            false,
            false,
            true);
        await updateInitializeOrder(deliveryInstance, buyer, seller, deliver, NEW_SELLER_PRICE, NEW_DELIVER_PRICE, DELAY_ORDER * 2, deliver);
    });

    it("Can't update order when not in init stage", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer, 0);

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, 0);
        await truffleAssert.reverts(
            updateInitializeOrder(deliveryInstance, buyer, seller, deliver, NEW_SELLER_PRICE, NEW_DELIVER_PRICE, DELAY_ORDER * 2, buyer),
            "The order isn't at the required stage"
        );

        await takeOrder(deliveryInstance, 0, keyHashSeller.key, deliver);
        await truffleAssert.reverts(
            updateInitializeOrder(deliveryInstance, buyer, seller, deliver, NEW_SELLER_PRICE, NEW_DELIVER_PRICE, DELAY_ORDER * 2, buyer),
            "The order isn't at the required stage"
        );

        await deliverOrder(deliveryInstance, seller, deliver, 0, keyHashBuyer.key, deliver);
        await truffleAssert.reverts(
            updateInitializeOrder(deliveryInstance, buyer, seller, deliver, NEW_SELLER_PRICE, NEW_DELIVER_PRICE, DELAY_ORDER * 2, buyer),
            "The order isn't at the required stage"
        );

        await createOrder(deliveryInstance, buyer, seller, deliver, buyer, 1);
        await initCancelOrder(deliveryInstance, deliver, buyer, 1);
        await truffleAssert.reverts(
            updateInitializeOrder(deliveryInstance, buyer, seller, deliver, NEW_SELLER_PRICE, NEW_DELIVER_PRICE, DELAY_ORDER * 2, buyer),
            "The order isn't at the required stage"
        );
    });

    it("Shouldn't update order with delay under one hour", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await truffleAssert.reverts(
            updateInitializeOrder(deliveryInstance, buyer, seller, deliver, NEW_SELLER_PRICE, NEW_DELIVER_PRICE, 59 * 60, buyer),
            "Delay should be at least one hour"
        );
    });
});
