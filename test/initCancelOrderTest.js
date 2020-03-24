const {createOrder, initCancelOrder} = require("./utils/orderMethods");
const DeliveryContract = artifacts.require("DeliveryContract");

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
});
