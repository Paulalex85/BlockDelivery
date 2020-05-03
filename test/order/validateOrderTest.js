const truffleAssert = require('truffle-assertions');
const {createOrder, validateOrder} = require("../utils/orderMethods");
const {completeValidationOrder, validationWithdrawTest, increaseWithdraw} = require("../utils/orderHelper");
const DeliveryContract = artifacts.require("DeliveryContract");
const {SELLER_PRICE, DELIVER_PRICE, actors} = require('../utils/constants');
const ESCROW_VALUE = SELLER_PRICE + DELIVER_PRICE;

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
            SELLER_PRICE + DELIVER_PRICE + ESCROW_VALUE,
            0,
            false,
            true,
            false,
            false);
    });

    it("Buyer can't validate twice the order", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.BUYER,
            buyer,
            SELLER_PRICE + DELIVER_PRICE + ESCROW_VALUE,
            0,
            false,
            true,
            false,
            false);

        await truffleAssert.reverts(
            validateOrder(deliveryInstance,
                actors.BUYER,
                buyer,
                SELLER_PRICE + DELIVER_PRICE + ESCROW_VALUE,
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
                SELLER_PRICE + DELIVER_PRICE,
                0,
                false,
                true,
                false,
                false),
            "The value send isn't enough"
        );
    });

    it("Buyer can validate the order with too much eth", async () => {
        let moreEth = 1000000;
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.BUYER,
            buyer,
            SELLER_PRICE + DELIVER_PRICE + ESCROW_VALUE + moreEth,
            0,
            false,
            true,
            false,
            false,
            moreEth);
    });

    it("Buyer can validate with half the delivery cost", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver, undefined, undefined, undefined, undefined, undefined, undefined, undefined, DELIVER_PRICE / 2);
        await validateOrder(deliveryInstance,
            actors.BUYER,
            buyer,
            SELLER_PRICE + DELIVER_PRICE / 2 + ESCROW_VALUE,
            0,
            false,
            true,
            false,
            false);
    });

    it("Buyer can validate without pay the delivery cost", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver, undefined, undefined, undefined, undefined, undefined, undefined, undefined, DELIVER_PRICE);
        await validateOrder(deliveryInstance,
            actors.BUYER,
            buyer,
            SELLER_PRICE + ESCROW_VALUE,
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
            ESCROW_VALUE * 2,
            0,
            false,
            false,
            true,
            false);
    });

    it("Seller can't validate twice the order", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.SELLER,
            seller,
            ESCROW_VALUE * 2,
            0,
            false,
            false,
            true,
            false);

        await truffleAssert.reverts(
            validateOrder(deliveryInstance,
                actors.SELLER,
                seller,
                ESCROW_VALUE * 2,
                0,
                false,
                false,
                true,
                false),
            "Seller already validate"
        );
    });

    it("Seller can validate with half the delivery cost", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver, undefined, undefined, undefined, undefined, undefined, undefined, undefined, DELIVER_PRICE / 2);
        await truffleAssert.reverts(
            validateOrder(deliveryInstance,
                actors.SELLER,
                seller,
                ESCROW_VALUE * 2,
                0,
                false,
                false,
                true,
                false),
            "The value send isn't enough"
        );

        await validateOrder(deliveryInstance,
            actors.SELLER,
            seller,
            ESCROW_VALUE * 2 + DELIVER_PRICE / 2,
            0,
            false,
            false,
            true,
            false);
    });

    it("Seller can validate and pay all delivery cost", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver, undefined, undefined, undefined, undefined, undefined, undefined, undefined, DELIVER_PRICE);
        await truffleAssert.reverts(
            validateOrder(deliveryInstance,
                actors.SELLER,
                seller,
                ESCROW_VALUE * 2,
                0,
                false,
                false,
                true,
                false),
            "The value send isn't enough"
        );

        await validateOrder(deliveryInstance,
            actors.SELLER,
            seller,
            ESCROW_VALUE * 2 + DELIVER_PRICE,
            0,
            false,
            false,
            true,
            false);
    });

    //Deliver validate

    it("Deliver should validate the order", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.DELIVER,
            deliver,
            ESCROW_VALUE * 3,
            0,
            false,
            false,
            false,
            true);
    });

    it("Deliver can't validate twice the order", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await validateOrder(deliveryInstance,
            actors.DELIVER,
            deliver,
            ESCROW_VALUE * 3,
            0,
            false,
            false,
            false,
            true);

        await truffleAssert.reverts(
            validateOrder(deliveryInstance,
                actors.DELIVER,
                deliver,
                ESCROW_VALUE * 3,
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
            DELIVER_PRICE + SELLER_PRICE + ESCROW_VALUE,
            orderId,
            false,
            true,
            false,
            false);
        await validateOrder(deliveryInstance,
            actors.DELIVER,
            deliver,
            ESCROW_VALUE * 3,
            orderId,
            false,
            true,
            false,
            true);
        await validateOrder(deliveryInstance,
            actors.SELLER,
            seller,
            ESCROW_VALUE * 2,
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
            DELIVER_PRICE + SELLER_PRICE + ESCROW_VALUE,
            orderId,
            false,
            true,
            false,
            false);
        await validateOrder(deliveryInstance,
            actors.SELLER,
            seller,
            ESCROW_VALUE * 2,
            orderId,
            false,
            true,
            true,
            false);
        await validateOrder(deliveryInstance,
            actors.DELIVER,
            deliver,
            ESCROW_VALUE * 3,
            orderId,
            true,
            true,
            true,
            true);
    });

    it("Order to Started stage when seller pay all the delivery cost ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver, undefined, undefined, undefined, undefined, undefined, undefined, undefined, DELIVER_PRICE);
        let orderId = 0;
        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId, DELIVER_PRICE);
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
                SELLER_PRICE + DELIVER_PRICE + ESCROW_VALUE,
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
                ESCROW_VALUE * 2,
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
                ESCROW_VALUE * 3,
                0,
                false,
                false,
                false,
                true),
            "The order isn't at the required stage"
        );
    });

    it("Buyer can use the withdraw to pay", async () => {
        await validationWithdrawTest(deliveryInstance, buyer, seller, deliver, ESCROW_VALUE, 0, 0);
    });

    it("Buyer can use the withdraw to pay but need to add the half", async () => {
        await validationWithdrawTest(deliveryInstance, buyer, seller, deliver, ESCROW_VALUE, ESCROW_VALUE, 0, ESCROW_VALUE);
    });

    it("Buyer can use the withdraw to pay and there will be withdraw left", async () => {
        await validationWithdrawTest(deliveryInstance, buyer, seller, deliver, ESCROW_VALUE * 2, 0, ESCROW_VALUE);
    });

    it("Buyer can use the withdraw to pay but need to send the rest", async () => {
        await truffleAssert.reverts(
            validationWithdrawTest(deliveryInstance, buyer, seller, deliver, ESCROW_VALUE, 0, 0, ESCROW_VALUE),
            "The value send isn't enough"
        );
    });

    it("Buyer can use the withdraw to pay but need to send the rest - 2", async () => {
        await truffleAssert.reverts(
            validationWithdrawTest(deliveryInstance, buyer, seller, deliver, ESCROW_VALUE, ESCROW_VALUE - 100, 0, ESCROW_VALUE),
            "The value send isn't enough"
        );
    });

});
