const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { expect } = require("chai")
var assert = require("assert")
require("@nomiclabs/hardhat-ethers")

describe("OTC", function () {
    let deployer
    let account1
    let account2
    let token1
    let token2
    let otc

    beforeEach(async function () {
        await deployments.fixture(["all"])
        ;[deployer, account1, account2] = await ethers.getSigners()

        // deploy tokens
        const Tk1 = await ethers.getContractFactory("TestToken1")
        token1 = await Tk1.deploy()
        const Tk2 = await ethers.getContractFactory("TestToken2")
        token2 = await Tk2.deploy()

        // airdrop tokens
        token1.transfer(account1.address, 10)
        token2.transfer(account2.address, 10)

        // deploy OTC
        const OTC = await ethers.getContractFactory("OTC")
        otc = await OTC.deploy()
    })

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
            assert.equal((await token2.balanceOf(account2.address)).toString(), "10")

            assert.equal((await token1.balanceOf(account2.address)).toString(), "0")
            assert.equal((await token2.balanceOf(account1.address)).toString(), "0")
        })
    })

    describe("RFQ", function () {
        beforeEach(async function () {
            // set allowance
            await token1.connect(account1).approve(otc.address, 1)
            assert.equal(1, await token1.allowance(account1.address, otc.address))

            // make RFQ
            await otc.connect(account1).makeRFQ(token2.address, token1.address, 1, 1)
            assert.equal("1", (await otc.rfqCounter()).toString())
        })

        it("RFQ counter", async function () {
            assert.equal(await otc.rfqCounter(), 1)
        })

        it("Balance OTC", async function () {
            assert.equal("1", (await token1.balanceOf(otc.address)).toString())
            assert.equal("0", (await token2.balanceOf(otc.address)).toString())
        })

        it("Balance maker", async function () {
            assert.equal("9", (await token1.balanceOf(account1.address)).toString())
            assert.equal("0", (await token2.balanceOf(account1.address)).toString())
        })

        it("Get RFQ", async function () {
            const rfq = await otc.getRFQ(0)
            assert.equal(account1.address, rfq.maker)
            assert.equal(token2.address, rfq.tokenBuy)
            assert.equal(token1.address, rfq.tokenSell)
            assert.equal(1, rfq.tokenBuyQty)
            assert.equal(1, rfq.tokenSellQty)
        })

        it("Remove RFQ", async function () {
            await expect(otc.connect(account2).removeRFQ(0)).to.be.revertedWith("Not owner of RFQ")
            await otc.connect(account1).removeRFQ(0)
        })

        it("Take RFQ", async function () {
            // set allowance
            await token2.connect(account2).approve(otc.address, 1)
            assert.equal(1, await token2.allowance(account2.address, otc.address))

            // take RQF
            await otc.connect(account2).takeRFQ(0)

            // console.log(`account1 has ${(await token1.balanceOf(account1.address)).toString()} token1`)
            // console.log(`account1 has ${(await token2.balanceOf(account1.address)).toString()} token2`)

            // console.log(`account2 has ${(await token1.balanceOf(account2.address)).toString()} token1`)
            // console.log(`account2 has ${(await token2.balanceOf(account2.address)).toString()} token2`)

            // console.log(`otc has ${(await token1.balanceOf(otc.address)).toString()} token1`)
            // console.log(`otc has ${(await token2.balanceOf(otc.address)).toString()} token2`)

            // OTC has 0 tokens
            assert.equal("0", (await token1.balanceOf(otc.address)).toString())
            assert.equal("0", (await token2.balanceOf(otc.address)).toString())

            // taker has 9 token2
            assert.equal("9", (await token2.balanceOf(account2.address)).toString())

            // taker has 1 token1
            assert.equal("1", (await token1.balanceOf(account2.address)).toString())

            // maker has 9 token1
            assert.equal("9", (await token1.balanceOf(account1.address)).toString())
        })
    })
})
