const assert = require('assert');

async function updateOwner(deliveryInstance, newAddress, sender) {
    await deliveryInstance.updateOwner(
        newAddress,
        {from: sender}
    );

    let owner = await deliveryInstance.owner.call();
    assert.strictEqual(owner, newAddress, "The owner isn't updated");
}

Object.assign(exports, {
    updateOwner
});