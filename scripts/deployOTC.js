const hre = require("hardhat")

async function main() {
    const OTC = await hre.ethers.getContractFactory("OTC")
    const otc = await OTC.deploy()

    await otc.deployed()

    console.log(`OTC contract deployed to ${otc.address}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
