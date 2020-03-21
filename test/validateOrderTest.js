const truffleAssert = require('truffle-assertions');
const {createOrder, validateOrder, completeValidationOrder} = require("./utils/orderMethods");
const DeliveryContract = artifacts.require("DeliveryContract");
const {SELLER_PRICE, DELIVER_PRICE, actors} = require('./utils/constants');

contract("validate methods of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[0];
        seller = accounts[1];
        deliver = accounts[2];
    });

    // BuyerValidate

    it("Buyer should validate the order", async () => {
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
    });

    it("Seller and Deliver can't validateBuyer the order", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);

        await truffleAssert.reverts(
            validateOrder(deliveryInstance,
                actors.BUYER,
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
            validateOrder(deliveryInstance,
                actors.BUYER,
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
            "Buyer already validate"
        );
    });

    it("Buyer can't validate with not enough eth", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);


        await truffleAssert.reverts(
            validateOrder(deliveryInstance,
                actors.BUYER,
                buyer,
                SELLER_PRICE + DELIVER_PRICE - 10,
                0,
                false,
                true,
                false,
                false),
            "The value send isn't enough"
        );
    });

    it("Buyer can validate the order with too much eth", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.BUYER,
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
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.SELLER,
            seller,
            0,
            0,
            false,
            false,
            true,
            false);
    });

    it("Buyer and Deliver can't validateSeller the order", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);

        await truffleAssert.reverts(
            validateOrder(deliveryInstance,
                actors.SELLER,
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
            validateOrder(deliveryInstance,
                actors.SELLER,
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
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.SELLER,
            seller,
            0,
            0,
            false,
            false,
            true,
            false);

        await truffleAssert.reverts(
            validateOrder(deliveryInstance,
                actors.SELLER,
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
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.DELIVER,
            deliver,
            0,
            0,
            false,
            false,
            false,
            true);
    });

    it("Buyer and Seller can't validateDeliver the order", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);

        await truffleAssert.reverts(
            validateOrder(deliveryInstance,
                actors.DELIVER,
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
            validateOrder(deliveryInstance,
                actors.DELIVER,
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
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.DELIVER,
            deliver,
            0,
            0,
            false,
            false,
            false,
            true);

        await truffleAssert.reverts(
            validateOrder(deliveryInstance,
                actors.DELIVER,
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
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
    });

    it("Order to Started stage when seller ending ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);

        let orderId = 0;
        await validateOrder(deliveryInstance,
            actors.BUYER,
            buyer,
            DELIVER_PRICE + SELLER_PRICE,
            orderId,
            false,
            true,
            false,
            false);
        await validateOrder(deliveryInstance,
            actors.DELIVER,
            deliver,
            0,
            orderId,
            false,
            true,
            false,
            true);
        await validateOrder(deliveryInstance,
            actors.SELLER,
            seller,
            0,
            orderId,
            true,
            true,
            true,
            true);
    });

    it("Order to Started stage when deliver ending ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;
        await validateOrder(deliveryInstance,
            actors.BUYER,
            buyer,
            DELIVER_PRICE + SELLER_PRICE,
            orderId,
            false,
            true,
            false,
            false);
        await validateOrder(deliveryInstance,
            actors.SELLER,
            seller,
            0,
            orderId,
            false,
            true,
            true,
            false);
        await validateOrder(deliveryInstance,
            actors.DELIVER,
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
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);

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
            "The order isn't at the required stage"
        );

        await truffleAssert.reverts(
            validateOrder(deliveryInstance,
                actors.SELLER,
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
            validateOrder(deliveryInstance,
                actors.DELIVER,
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
});
