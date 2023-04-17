const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { expect } = require("chai")
var assert = require("assert")
const { BigNumber } = require("ethers")
require("@nomiclabs/hardhat-ethers")

describe("OTC", function () {
    let deployer
    let account1
    let account2
    let token1
    let token2
    let otc
    let initBalanceToken1
    let initBalanceToken2

    beforeEach(async function () {
        await deployments.fixture(["all"])
        ;[deployer, account1, account2] = await ethers.getSigners()

        // deploy tokens
        const Tk1 = await ethers.getContractFactory("TestToken1")
        token1 = await Tk1.deploy()
        const Tk2 = await ethers.getContractFactory("TestToken2")
        token2 = await Tk2.deploy()

        // airdrop tokens
        initBalanceToken1 = (100 * 10 ** (await token1.decimals())).toString()
        initBalanceToken2 = (1000 * 10 ** (await token2.decimals())).toString()
        await token1.transfer(account1.address, initBalanceToken1)
        await token2.transfer(account2.address, initBalanceToken2)

        // deploy OTC
        const OTC = await ethers.getContractFactory("OTC")
        otc = await OTC.deploy()
    })

    describe("Deploy", function () {
        it("Should deploy the test tokens", async function () {
            assert.equal(18, await token1.decimals())
            assert.equal(initBalanceToken1, await token1.totalSupply())
            assert.equal("TestToken1", await token1.name())
            assert.equal("TK1", await token1.symbol())

            assert.equal(6, await token2.decimals())
            assert.equal(initBalanceToken2, await token2.totalSupply())
            assert.equal("TestToken2", await token2.name())
            assert.equal("TK2", await token2.symbol())
        })
    })

    describe("Airdrop", function () {
        it("Should airdrop the test tokens", async function () {
            assert.equal(initBalanceToken1, (await token1.balanceOf(account1.address)).toString())
            assert.equal(initBalanceToken2, (await token2.balanceOf(account2.address)).toString())

            assert.equal("0", (await token1.balanceOf(account2.address)).toString())
            assert.equal("0", (await token2.balanceOf(account1.address)).toString())
        })
    })

    describe("MakeRFQ", function () {
        it("MakeRFQ fails", async function () {
            const amount1 = 1
            const amount2 = 1

            await expect(
                otc.connect(account1).makeRFQ(token2.address, token1.address, amount2, amount1)
            ).to.be.revertedWith("Not enough allowance for token sell")
        })

        it("Set allowance", async function () {
            const amount1 = 1

            // set allowance
            await token1.connect(account1).approve(otc.address, amount1)
            assert.equal(amount1, await token1.allowance(account1.address, otc.address))
        })

        it("MakeRFQ1", async function () {
            const amount1 = 1
            const amount2 = 1

            await token1.connect(account1).approve(otc.address, amount1)
            await otc.connect(account1).makeRFQ(token2.address, token1.address, amount2, amount1)
            assert.equal(1, (await otc.rfqCounter()).toString())
        })

        it("MakeRFQ2", async function () {
            const amount1 = (3 * 10 ** (await token1.decimals())).toString()
            const amount2 = (10 * 10 ** (await token2.decimals())).toString()

            await token1.connect(account1).approve(otc.address, amount1)
            await otc.connect(account1).makeRFQ(token2.address, token1.address, amount2, amount1)
            assert.equal(1, (await otc.rfqCounter()).toString())
        })
    })

    describe("TakeRFQ", function () {
        let qtyToken1
        let qtyToken2

        beforeEach(async function () {
            qtyToken1 = (1 * 10 ** (await token1.decimals())).toString()
            qtyToken2 = (2 * 10 ** (await token2.decimals())).toString()

            // set allowance
            await token1.connect(account1).approve(otc.address, qtyToken1)
            assert.equal(qtyToken1, await token1.allowance(account1.address, otc.address))

            // make RFQ
            await otc.connect(account1).makeRFQ(token2.address, token1.address, qtyToken2, qtyToken1)
        })

        it("Balance OTC", async function () {
            assert.equal(qtyToken1, (await token1.balanceOf(otc.address)).toString())
            assert.equal("0", (await token2.balanceOf(otc.address)).toString())
        })

        it("Balance maker", async function () {
            const amt1 = BigNumber.from(initBalanceToken1).sub(BigNumber.from(qtyToken1))
            assert.equal(amt1.toString(), (await token1.balanceOf(account1.address)).toString())
            assert.equal("0", (await token2.balanceOf(account1.address)).toString())
        })

        it("Get RFQ", async function () {
            // fail
            await expect(otc.getRFQ(1)).to.be.revertedWith("RFQ not found")

            // success
            const rfq = await otc.getRFQ(0)
            assert.equal(0, rfq.id)
            assert.equal(account1.address, rfq.maker)
            assert.equal(token2.address, rfq.tokenBuy)
            assert.equal(token1.address, rfq.tokenSell)
            assert.equal(qtyToken2, rfq.tokenBuyQty)
            assert.equal(qtyToken1, rfq.tokenSellQty)
        })

        it("Remove RFQ", async function () {
            await expect(otc.connect(account2).removeRFQ(0)).to.be.revertedWith("Not maker of RFQ")
            await otc.connect(account1).removeRFQ(0)

            // check balances
            assert.equal(initBalanceToken1, (await token1.balanceOf(account1.address)).toString())
            assert.equal("0", (await token1.balanceOf(otc.address)).toString())

            await expect(otc.getRFQ(0)).to.be.revertedWith("RFQ not found")
        })

        it("Take RFQ fail allowance", async function () {
            await expect(otc.connect(account2).takeRFQ(0)).to.revertedWith("Not enough allowance for token buy")
        })

        it("Take RFQ", async function () {
            // set allowance
            await token2.connect(account2).approve(otc.address, qtyToken1)
            assert.equal(qtyToken1, await token2.allowance(account2.address, otc.address))

            // take RQF
            await otc.connect(account2).takeRFQ(0)

            // OTC has 0 tokens
            assert.equal("0", (await token1.balanceOf(otc.address)).toString())
            assert.equal("0", (await token2.balanceOf(otc.address)).toString())

            // taker has correct balances
            const account2FinalBalanceToken2 = BigNumber.from(initBalanceToken2).sub(BigNumber.from(qtyToken2))
            assert.equal(account2FinalBalanceToken2, (await token2.balanceOf(account2.address)).toString())
            assert.equal(qtyToken1, (await token1.balanceOf(account2.address)).toString())

            // maker has correct balances
            const account1FinalBalanceToken1 = BigNumber.from(initBalanceToken1).sub(BigNumber.from(qtyToken1))
            assert.equal(account1FinalBalanceToken1, (await token1.balanceOf(account1.address)).toString())
            assert.equal(qtyToken2, (await token2.balanceOf(account1.address)).toString())
        })

        it("Take RFQ twice", async function () {
            await token2.connect(account2).approve(otc.address, qtyToken1)
            await otc.connect(account2).takeRFQ(0)
            await expect(otc.connect(account2).takeRFQ(0)).to.be.revertedWith("RFQ not found")
        })
    })
})
