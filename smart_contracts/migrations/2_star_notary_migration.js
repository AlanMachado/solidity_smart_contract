var MyContract = artifacts.require("./StarNotary.sol");

module.exports = function(deployer) {
    deployer.deploy(MyContract);
};