const assert = require('assert');

async function getWithdraw(deliveryInstance, buyer, seller, deliver) {
    let withdrawBalanceSeller = await deliveryInstance.withdraws.call(seller);
    let withdrawBalanceDeliver = await deliveryInstance.withdraws.call(deliver);
    let withdrawBalanceBuyer = await deliveryInstance.withdraws.call(buyer);

    withdrawBalanceDeliver = parseInt(withdrawBalanceDeliver);
    withdrawBalanceSeller = parseInt(withdrawBalanceSeller);
    withdrawBalanceBuyer = parseInt(withdrawBalanceBuyer);

    return {
        buyer: withdrawBalanceBuyer,
        seller: withdrawBalanceSeller,
        deliver: withdrawBalanceDeliver
    }
}

async function withdrawBalance(deliveryInstance, sender) {
    await deliveryInstance.withdrawBalance(
        {from: sender}
    );

    let withdrawBalance = await deliveryInstance.withdraws.call(
        sender
    );
    assert.strictEqual(parseInt(withdrawBalance), 0, "Withdraw balance should be 0");
}

async function checkWithdrawUpdate(deliveryInstance, buyer, seller, deliver, order, withdrawBefore, escrow) {
    let withdrawAfter = await getWithdraw(deliveryInstance, buyer, seller, deliver);
    if (order.buyerValidation) {
        assert.strictEqual(parseInt(withdrawAfter.buyer), withdrawBefore.buyer + parseInt(order.sellerPrice) + parseInt(order.deliverPrice) + parseInt(escrow.escrowBuyer) - parseInt(order.sellerDeliveryPay), "Withdraw balance should be filled");
    } else {
        assert.strictEqual(parseInt(withdrawAfter.buyer), withdrawBefore.buyer, "Buyer Withdraw balance should be 0");
    }

    if (order.sellerValidation) {
        assert.strictEqual(parseInt(withdrawAfter.seller), withdrawBefore.seller + parseInt(escrow.escrowSeller) + parseInt(order.sellerDeliveryPay), "Withdraw balance should be filled");
    } else {
        assert.strictEqual(parseInt(withdrawAfter.seller), withdrawBefore.seller, "Seller Withdraw balance should be 0");
    }

    if (order.deliverValidation) {
        assert.strictEqual(parseInt(withdrawAfter.deliver), withdrawBefore.deliver + parseInt(escrow.escrowDeliver), "Withdraw balance should be filled");
    } else {
        assert.strictEqual(parseInt(withdrawAfter.deliver), withdrawBefore.deliver, "Deliver Withdraw balance should be 0");
    }
}

Object.assign(exports, {
    checkWithdrawUpdate,
    getWithdraw,
    withdrawBalance
});