const truffleAssert = require('truffle-assertions');
const {createOrder, validateOrder, initCancelOrder, completeValidationOrder, takeOrder, deliverOrder} = require("../utils/orderMethods");
const DeliveryContract = artifacts.require("DeliveryContract");
const {generateKeyHash} = require('../utils/tools');
const {SELLER_PRICE, DELIVER_PRICE, actors} = require('../utils/constants');
const ESCROW = SELLER_PRICE + DELIVER_PRICE;

contract("cancel order method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[0];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Buyer can init cancel order ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await initCancelOrder(deliveryInstance, buyer, seller, deliver, buyer);
    });

    it("Buyer can validate order and init cancel order ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.BUYER,
            buyer,
            DELIVER_PRICE + SELLER_PRICE + ESCROW,
            0,
            false,
            true,
            false,
            false);
        await initCancelOrder(deliveryInstance, buyer, seller, deliver, buyer);
    });

    it("Seller can init cancel order ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await initCancelOrder(deliveryInstance, buyer, seller, deliver, seller);
    });

    it("Seller can validate order and init cancel order ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.SELLER,
            seller,
            ESCROW * 2,
            0,
            false,
            false,
            true,
            false);
        await initCancelOrder(deliveryInstance, buyer, seller, deliver, seller);
    });

    it("Deliver can init cancel order ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await initCancelOrder(deliveryInstance, buyer, seller, deliver, deliver);
    });

    it("Deliver can validate order and init cancel order ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.DELIVER,
            deliver,
            ESCROW * 3,
            0,
            false,
            false,
            false,
            true);
        await initCancelOrder(deliveryInstance, buyer, seller, deliver, deliver);
    });

    it("Can't change stage when cancel stage", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await initCancelOrder(deliveryInstance, buyer, seller, deliver, deliver);

        await truffleAssert.reverts(
            completeValidationOrder(deliveryInstance, buyer, seller, deliver, 0),
            "The order isn't at the required stage"
        );

        await truffleAssert.reverts(
            takeOrder(deliveryInstance, 0, generateKeyHash().key, deliver),
            "The order isn't at the required stage"
        );

        await truffleAssert.reverts(
            deliverOrder(deliveryInstance, buyer, seller, deliver, 0, generateKeyHash().key, deliver),
            "The order isn't at the required stage"
        );
    });

    it("Can't init cancel when not in init stage", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, 0);
        await truffleAssert.reverts(
            initCancelOrder(deliveryInstance, buyer, seller, deliver, deliver),
            "The order isn't at the required stage"
        );

        await takeOrder(deliveryInstance, 0, keyHashSeller.key, deliver);
        await truffleAssert.reverts(
            initCancelOrder(deliveryInstance, buyer, seller, deliver, deliver),
            "The order isn't at the required stage"
        );

        await deliverOrder(deliveryInstance, buyer, seller, deliver, 0, keyHashBuyer.key, deliver);
        await truffleAssert.reverts(
            initCancelOrder(deliveryInstance, buyer, seller, deliver, deliver),
            "The order isn't at the required stage"
        );
    });

    it("Can cancel an order where the seller pay half the delivery price", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver, undefined, undefined, undefined, undefined, undefined, undefined, undefined, DELIVER_PRICE / 2);
        await initCancelOrder(deliveryInstance, buyer, seller, deliver, deliver);
    });

    it("Can cancel an order where the seller pay all the delivery price", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver, undefined, undefined, undefined, undefined, undefined, undefined, undefined, DELIVER_PRICE);
        await initCancelOrder(deliveryInstance, buyer, seller, deliver, deliver);
    });
});
