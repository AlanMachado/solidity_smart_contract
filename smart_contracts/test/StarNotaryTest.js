const StarNotary = artifacts.require('StarNotary')

contract('StarNotary', accounts => {

    let user1 = accounts[1]
    let user2 = accounts[2]
    let randomMaliciousUser = accounts[3]

    let name = 'awesome star!'
    let starStory = "this star was bought for my wife's birthday"
    let ra = "1"
    let dec = "1"
    let mag = "1"
    let starId = 1

    beforeEach(async function() {
        this.contract = await StarNotary.new({from: accounts[0]})
    })

    describe('can create a star', () => {
        it('can create a star and get its name', async function () {
            await this.contract.createStar(name, ra, dec, mag, starStory, starId, {from: user1})

            let star = await this.contract.tokenIdToStarInfo(1);
            assert.equal(star[0], name)
        })
    })

    describe('star uniqueness', () => {
        it('only stars unique stars can be minted', async function() {
            await this.contract.createStar(name, ra, dec, mag, starStory, starId, {from: user1})
            await expectThrow(this.contract.createStar(name, ra, dec, mag, starStory, starId, {from: randomMaliciousUser}))
        })

        it('only stars unique stars can be minted even if their ID is different', async function() {
            await this.contract.createStar(name, ra, dec, mag, starStory, starId, {from: user1})
            await expectThrow(this.contract.createStar(name, ra, dec, mag, starStory, 2, {from: user2}))
        })

        it('minting unique stars does not fail', async function() {
            for(let i = 0; i < 10; i ++) {
                let id = i
                let newRa = i.toString()
                let newDec = i.toString()
                let newMag = i.toString()

                await this.contract.createStar(name, starStory, newRa, newDec, newMag, id, {from: user1})

                let starInfo = await this.contract.tokenIdToStarInfo(id)
                assert.equal(starInfo[0], name)
            }
        })
    })

    describe('buying and selling stars', () => {

        let starPrice = web3.toWei(.01, "ether")

        beforeEach(async function () {
            await this.contract.createStar(name, starStory, ra, dec, mag, starId, {from: user1})
        })

        it('user1 can put up their star for sale', async function () {
            await this.contract.putStarUpForSale(starId, starPrice, {from: user1})

            assert.equal(await this.contract.starsForSale(starId), starPrice)
        })

        describe('user2 can buy a star that was put up for sale', () => {
            beforeEach(async function () {
                await this.contract.putStarUpForSale(starId, starPrice, {from: user1})
            })

            it('user2 is the owner of the star after they buy it', async function() {
                await this.contract.buyStar(starId, {from: user2, value: starPrice})

                assert.equal(await this.contract.ownerOf(starId), user2)
            })

            it('user2 ether balance changed correctly', async function () {
                let overpaidAmount = web3.toWei(.05, 'ether')

                const balanceOfUser2BeforeTransaction = web3.eth.getBalance(user2)
                await this.contract.buyStar(starId, {from: user2, value: overpaidAmount, gasPrice:0})
                const balanceAfterUser2BuysStar = web3.eth.getBalance(user2)

                assert.equal(balanceOfUser2BeforeTransaction.sub(balanceAfterUser2BuysStar), starPrice)
            })
        })
    })

    describe('can create a token', () => {
        let tokenId = 1
        let tx

        beforeEach(async function () {
            tx = await this.contract.mint(user1, tokenId, {from: user1})
        })

        it('ownerOf tokenId is user1', async function () {
            assert.equal(await this.contract.ownerOf(tokenId), user1)
        })

        it('balanceOf user1 is incremented by 1', async function () {
            let balance = await this.contract.balanceOf(user1)

            assert.equal(balance.toNumber(), 1)
        })

        it('emits the correct event during creation of a new token', async function () {
            assert.equal(tx.logs[0].event, 'Transfer')
        })
    })

    describe('can transfer token', () => {
        let tokenId = 1
        let tx

        beforeEach(async function () {
            await this.contract.mint(user1, tokenId, {from: user1})

            tx = await this.contract.transferFrom(user1, user2, tokenId, {from: user1})
        })

        it('token has new owner', async function () {
            assert.equal(await this.contract.ownerOf(tokenId), user2)
        })

        it('emits the correct event', async function () {
            assert.equal(tx.logs[0].event, 'Transfer')
        })

        it('only permissioned users can transfer tokens', async function() {
            let randomPersonTryingToStealTokens = accounts[4]

            await expectThrow(this.contract.transferFrom(user1, randomPersonTryingToStealTokens, tokenId, {from: randomPersonTryingToStealTokens}))
        })
    })

    describe('can grant approval to transfer', () => {
        let tokenId = 1
        let tx

        beforeEach(async function () {
            await this.contract.mint(user1, tokenId, {from: user1})
            tx = await this.contract.approve(user2, tokenId, {from: user1})
        })

        it('set user2 as an approved address', async function () {
            assert.equal(await this.contract.getApproved(tokenId), user2)
        })

        it('user2 can now transfer', async function () {
            await this.contract.transferFrom(user1, user2, tokenId, {from: user2})

            assert.equal(await this.contract.ownerOf(tokenId), user2)
        })

        it('emits the correct event', async function () {
            assert.equal(tx.logs[0].event, 'Approval')
        })
    })

    describe('can set an operator', () => {
        let tokenId = 1
        let tx
        let operator = accounts[3]

        beforeEach(async function () {
            await this.contract.mint(user1, tokenId, {from: user1})

            tx = await this.contract.setApprovalForAll(operator, true, {from: user1})
        })

        it('can set an operator', async function () {
            assert.equal(await this.contract.isApprovedForAll(user1, operator), true)
        })
    })

})

var expectThrow = async function(promise) {
    try {
        await promise
    } catch (error) {
        assert.exists(error)
        return
    }

    assert.fail('expected an error, but none was found')
}
