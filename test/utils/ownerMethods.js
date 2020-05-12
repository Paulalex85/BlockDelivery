const truffleAssert = require('truffle-assertions');
const assert = require('assert');

async function updateOwner(deliveryInstance, newAddress, sender) {
    await deliveryInstance.updateOwner(
        newAddress,
        {from: sender}
    );

    let owner = await deliveryInstance.owner.call();
    assert.strictEqual(owner, newAddress, "The owner isn't updated");
}

async function pause(deliveryInstance, sender) {
    let tx = await deliveryInstance.pause(
        {from: sender}
    );

    let paused = await deliveryInstance.paused.call();
    assert.strictEqual(paused, true, "Should be paused");

    truffleAssert.eventEmitted(tx, 'Paused', (ev) => {
        return ev.account === sender;
    }, 'Paused should be emitted with correct parameters');

}

async function unpause(deliveryInstance, sender) {
    let tx = await deliveryInstance.unpause(
        {from: sender}
    );

    let paused = await deliveryInstance.paused.call();
    assert.strictEqual(paused, false, "Should be unpause");

    truffleAssert.eventEmitted(tx, 'Unpaused', (ev) => {
        return ev.account === sender;
    }, 'Unpaused should be emitted with correct parameters');

}

Object.assign(exports, {
    updateOwner,
    pause,
    unpause
});