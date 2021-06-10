const { assert } = require('chai')

const Decentragram = artifacts.require('./Decentragram.sol')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Decentragram', ([deployer, author, tipper]) => {
  //first accoutn in wallet is deployer second is author of an uploaded images and third is the viewer/tipper of an image
  let decentragram

  before(async () => {
    decentragram = await Decentragram.deployed()
  })

  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = await decentragram.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })

    it('has a name', async () => {
      const name = await decentragram.name()
      assert.equal(name, 'Decentragram')
    })
  })


  //Testing all the functionallity of the images contract
  describe('images', async () => {
    let result, imageCount
    const hash = 'abc123'
    const imgDesc = 'Image Desc'


    //upload an image to the contract
    before(async() => { 
      result = await decentragram.uploadImage(hash, imgDesc, {from: author})
      imageCount = await decentragram.imageCount()
    })

    it('creates images', async () => {
      //success
      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), imageCount.toNumber() - 1, "Image ID is correct")
      assert.equal(event.hash, hash, 'Image hash is correct')
      assert.equal(event.description, imgDesc, 'Image description is correct')
      assert.equal(event.tipAmount.toNumber(), 0, 'Image tip amount is correct')
      assert.equal(event.author, author, 'Image author is correct')
    })

    it('rejects empty calls', async() => {
      //testing a failure of the upload images
      await decentragram.uploadImage('', imgDesc, {from: author}).should.be.rejected; 
      await decentragram.uploadImage(hash, '', {from: author}).should.be.rejected; 
      await decentragram.uploadImage(hash, imgDesc, {from: 0x0}).should.be.rejected; 
    })


    it('lists images', async () => {
      //test if you will be able to list out all the images in the contract
      const image = await decentragram.images(imageCount - 1)
      assert.equal(image.id.toNumber(), imageCount.toNumber() - 1, "Image ID is correct")
      assert.equal(image.hash, hash, 'Image hash is correct')
      assert.equal(image.description, imgDesc, 'Image description is correct')
      assert.equal(image.tipAmount.toNumber(), 0, 'Image tip amount is correct')
      assert.equal(image.author, author, 'Image author is correct')
    })


    it('allows tip of images', async() => {
      //make sure that tipping functionallity works 
      let oldAuthorBalance
      oldAuthorBalance = await web3.eth.getBalance(author)
      oldAuthorBalance = new web3.utils.BN(oldAuthorBalance)
      let tipAmount = web3.utils.toWei('1', 'Ether')

      result = await decentragram.tipImageOwner(imageCount-1, {from: tipper, value: tipAmount})

      //Success
      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), imageCount.toNumber() - 1, "Image ID is correct")
      assert.equal(event.hash, hash, 'Image hash is correct')
      assert.equal(event.description, imgDesc, 'Image description is correct')
      assert.equal(event.tipAmount, '1000000000000000000', 'Image tip amount is correct')
      assert.equal(event.author, author, 'Image author is correct')

      //Check author's balance is updated 
      let newAuthorBalance; 
      newAuthorBalance = await web3.eth.getBalance(author)
      newAuthorBalance = new web3.utils.BN(newAuthorBalance)

      tipAmount = new web3.utils.BN(tipAmount)

      const expectedOwnerBlance = oldAuthorBalance.add(tipAmount)
      assert.equal(newAuthorBalance.toString(), expectedOwnerBlance.toString(), 'Author\'s balance is updated successfully')
    })

    it('rejects improper tip', async() => {
      //check if the tipping call is incorrect
      await decentragram.tipImageOwner(99, {from: tipper, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected
    })
  })
})