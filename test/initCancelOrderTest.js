const truffleAssert = require('truffle-assertions');
const {createOrder, validateOrder, initCancelOrder, completeValidationOrder, takeOrder, deliverOrder} = require("./utils/orderMethods");
const DeliveryContract = artifacts.require("DeliveryContract");
const {generateKeyHash} = require('./utils/tools');
const {SELLER_PRICE, DELIVER_PRICE, actors} = require('./utils/constants');

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
        await initCancelOrder(deliveryInstance, buyer, buyer);
    });

    it("Buyer can validate order and init cancel order ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.BUYER,
            buyer,
            DELIVER_PRICE + SELLER_PRICE,
            0,
            false,
            true,
            false,
            false);
        await initCancelOrder(deliveryInstance, buyer, buyer);
    });

    it("Seller can init cancel order ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await initCancelOrder(deliveryInstance, seller, buyer);
    });

    it("Deliver can init cancel order ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await initCancelOrder(deliveryInstance, deliver, buyer);
    });

    it("Can't change stage when cancel stage", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await initCancelOrder(deliveryInstance, deliver, buyer);

        await truffleAssert.reverts(
            completeValidationOrder(deliveryInstance, buyer, seller, deliver, 0),
            "The order isn't at the required stage"
        );

        await truffleAssert.reverts(
            takeOrder(deliveryInstance, 0, generateKeyHash().key, deliver),
            "The order isn't at the required stage"
        );

        await truffleAssert.reverts(
            deliverOrder(deliveryInstance, seller, deliver, 0, generateKeyHash().key, deliver),
            "The order isn't at the required stage"
        );
    });

    it("Can't init cancel when not in init stage", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, 0);
        await truffleAssert.reverts(
            initCancelOrder(deliveryInstance, deliver, buyer),
            "The order isn't at the required stage"
        );

        await takeOrder(deliveryInstance, 0, keyHashSeller.key, deliver);
        await truffleAssert.reverts(
            initCancelOrder(deliveryInstance, deliver, buyer),
            "The order isn't at the required stage"
        );

        await deliverOrder(deliveryInstance, seller, deliver, 0, keyHashBuyer.key, deliver);
        await truffleAssert.reverts(
            initCancelOrder(deliveryInstance, deliver, buyer),
            "The order isn't at the required stage"
        );
    });
});
