const truffleAssert = require('truffle-assertions');
const {createOrder, takeOrder} = require("../utils/orderMethods");
const {completeValidationOrder, fullDeliveredOrder} = require("../utils/orderHelper");
const {createDispute} = require("../utils/disputeMethods");
const DeliveryContract = artifacts.require("DeliveryContract");
const {SELLER_PRICE, DELIVER_PRICE} = require('../utils/constants');

contract("createDispute method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[0];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Buyer can create a dispute ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, buyer);
    });

    it("Seller can create a dispute ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, seller);
    });

    it("Deliver can create a dispute ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, deliver);
    });

    it("Can create a dispute at started stage ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await createDispute(deliveryInstance, buyer);
    });

    it("Can't create a dispute at init stage ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);

        await truffleAssert.reverts(
            createDispute(deliveryInstance, buyer),
            "Order should be Started or Taken"
        );
    });

    it("Can't create a dispute at delivered stage ", async () => {
        await fullDeliveredOrder(deliveryInstance, buyer, seller, deliver, 0);

        await truffleAssert.reverts(
            createDispute(deliveryInstance, buyer),
            "Order should be Started or Taken"
        );
    });

    it("Another actor can't create a dispute ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await truffleAssert.reverts(
            createDispute(deliveryInstance, accounts[3]),
            "Should be an actor of the order"
        );
    });

    it("Can't call twice ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, buyer);
        await truffleAssert.reverts(
            createDispute(deliveryInstance, buyer),
            "Order should be Started or Taken"
        );
    });

    it("BuyerReceive can be less than what he paid ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await createDispute(deliveryInstance, buyer, SELLER_PRICE);
    });

    it("BuyerReceive can't be upper than what he paid ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await truffleAssert.reverts(
            createDispute(deliveryInstance, buyer, SELLER_PRICE + DELIVER_PRICE + 100),
            "Buyer can't receive more than he has paid"
        );
    });

    it("BuyerReceive should handle sellerDeliveryPay ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver, undefined, undefined, undefined, undefined, undefined, undefined, undefined, DELIVER_PRICE);
        let orderId = 0;
        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId, DELIVER_PRICE);
        await truffleAssert.reverts(
            createDispute(deliveryInstance, buyer, SELLER_PRICE + DELIVER_PRICE),
            "Buyer can't receive more than he has paid"
        );

        await createDispute(deliveryInstance, seller, SELLER_PRICE);
    });
});
