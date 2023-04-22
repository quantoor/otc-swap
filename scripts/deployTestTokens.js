const hre = require("hardhat")

async function main() {
    const TestToken1 = await hre.ethers.getContractFactory("TestToken1")
    const testToken1 = await TestToken1.deploy()
    await testToken1.deployed()

    const TestToken2 = await hre.ethers.getContractFactory("TestToken2")
    const testToken2 = await TestToken2.deploy()
    await testToken2.deployed()

    console.log(`TestToken1 contract deployed to ${testToken1.address}`)
    console.log(`TestToken2 contract deployed to ${testToken2.address}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
