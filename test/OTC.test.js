const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { expect } = require("chai")
var assert = require("assert")
require("@nomiclabs/hardhat-ethers")

describe("TestToken", function () {
    let deployer
    let account1
    let account2
    let token1
    let token2
    let otc

    beforeEach(async function () {
        await deployments.fixture(["all"])
        ;[deployer, account1, account2] = await ethers.getSigners()
        const Tk1 = await ethers.getContractFactory("TestToken1")
        token1 = await Tk1.deploy()
        const Tk2 = await ethers.getContractFactory("TestToken2")
        token2 = await Tk2.deploy()

        token1.transfer(account1.address, 10)
        token2.transfer(account2.address, 20)

        const OTC = await ethers.getContractFactory("OTC")
        otc = await OTC.deploy()

        // token1 = await ethers.getContract("TestToken1", deployer);
        // token2 = await ethers.getContract("TestToken2", deployer);
    })

    //   async function deployTestTokens() {
    //     // Contracts are deployed using the first signer/account by default
    //     const Tk1 = await ethers.getContractFactory("TestToken1");
    //     const tk1 = await Tk1.deploy();

    //     const Tk2 = await ethers.getContractFactory("TestToken2");
    //     const tk2 = await Tk2.deploy();

    //     return { tk1, tk2 };
    //   }

    //   async function airdropTokens() {
    //     const { tk1, tk2 } = await loadFixture(deployTestTokens);

    //     const [_, account1, account2] = await ethers.getSigners();

    //     tk1.transfer(account1.address, 10);
    //     tk2.transfer(account2.address, 20);

    //     return { account1, account2, tk1, tk2 };
    //   }

    describe("Deployment", function () {
        it("Should deploy the test tokens", async function () {
            assert.equal(await token1.totalSupply(), 100 * 10 ** 18)
            assert.equal(await token1.name(), "TestToken1")
            assert.equal(await token1.symbol(), "TK1")
            assert.equal(await token1.balanceOf(deployer.address), 100 * 10 ** 18)
            assert.equal(await token2.totalSupply(), 42 * 10 ** 18)
            assert.equal(await token2.name(), "TestToken2")
            assert.equal(await token2.symbol(), "TK2")
            assert.equal(await token2.balanceOf(deployer.address), 42 * 10 ** 18)
        })
    })

    describe("Airdrop", function () {
        it("Should airdrop the test tokens", async function () {
            assert.equal((await token1.balanceOf(account1.address)).toString(), "10")
            assert.equal((await token2.balanceOf(account2.address)).toString(), "20")
        })
    })

    describe("OTC", function () {
        it("Should deploy OTC", async function () {
            assert.equal(await otc.rfqCounter(), 0)

            // set allowance
            await token2.connect(account2).approve(otc.address, 1)
            assert.equal(await token2.allowance(account2.address, otc.address), 1)

            // make RFQ
            await otc.connect(account2).makeRFQ(token1.address, token2.address, 1, 1)
            assert.equal((await otc.rfqCounter()).toString(), "1")
            const rfq = await otc.getRFQ(0)
            assert.equal(rfq.maker, account2.address)
            assert.equal(rfq.tokenBuy, token1.address)
            assert.equal(rfq.tokenSell, token2.address)
            assert.equal(rfq.tokenBuyQty, 1)
            assert.equal(rfq.tokenSellQty, 1)

            // check balance of OTC
            assert.equal((await token2.balanceOf(otc.address)).toString(), "1")

            // remove RFQ
            await expect(otc.connect(account1).removeRFQ(0)).to.be.revertedWith("Not owner of RFQ")
        })
    })
})
