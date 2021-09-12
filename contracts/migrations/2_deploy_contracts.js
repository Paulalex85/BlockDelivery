const OrderStageLib = artifacts.require("OrderStageLib");
const EscrowLib = artifacts.require("EscrowLib");
const OrderLib = artifacts.require("OrderLib");
const DeliveryLib = artifacts.require("DeliveryLib");
const DisputeLib = artifacts.require("DisputeLib");
const DeliveryContract = artifacts.require("DeliveryContract");

module.exports = function(deployer) {
  deployer.deploy(OrderStageLib);
  deployer.deploy(EscrowLib);
  deployer.link(OrderStageLib,OrderLib);
  deployer.deploy(OrderLib);
  deployer.link(OrderLib,DeliveryLib);
  deployer.link(EscrowLib,DeliveryLib);
  deployer.deploy(DeliveryLib);
  deployer.link(OrderStageLib,DisputeLib);
  deployer.link(DeliveryLib,DisputeLib);
  deployer.deploy(DisputeLib);
  deployer.link(DisputeLib,DeliveryContract);
  deployer.link(EscrowLib,DeliveryContract);
  deployer.link(OrderStageLib,DeliveryContract);
  deployer.link(DeliveryLib,DeliveryContract);
  deployer.link(OrderLib,DeliveryContract);
  deployer.deploy(DeliveryContract);
};
