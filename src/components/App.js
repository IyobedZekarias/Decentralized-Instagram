import React, { Component } from 'react';
import Web3 from 'web3';
import Identicon from 'identicon.js';
import './App.css';
import Decentragram from '../abis/Decentragram.json'
import Navbar from './Navbar'
import Main from './Main'

//Connect to ipfs for image upload
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })


class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      permission: false,
      message: 'connect to blockchain using metamask',
      decentragram: null, 
      loading: false, 
      images: [], 
      //magesCount: 0

    }
  }

  //make sure permissions are granted to a wallet before anything is able to be done on the page
  componentDidMount = async() => {
    this.getPermission()
  }

  getPermission = async() => {
    try{
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      this.setState({permission: true, loading: true})
      await this.loadWeb3()
      await this.loadBlockchainData()
    } catch {
      this.setState({
        message: 'blockchain connection required to use decentragram'
      })
      this.getPermission()
    }
    
  }

  //load the web3 and set it to be ethereum enabled on teh page
  async loadWeb3() {
    if(window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if(window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask')
    }
  }


  //get everything off of the blockchain
  async loadBlockchainData() {
    //get the first account that the user wants to use
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    this.setState({
      account: accounts[0]
    })

    //get the smart contract off of the blockchain
    const netID = await web3.eth.net.getId()
    const networkData = Decentragram.networks[netID]
    if(networkData){
      //set decentragram as the contract in state
      const decentragram = web3.eth.Contract(Decentragram.abi, networkData.address)
      this.setState({ decentragram })

      //get the image count from the smart contract
      const imagesCount = await decentragram.methods.imageCount().call()
      this.setState({ imagesCount })

      //loop through the images and get their hashes from the smart contract 
      for(let i = 0; i < parseInt(imagesCount._hex); i++){
        const image = await decentragram.methods.images(i).call()
        this.setState({
          images: [...this.state.images, image]
        })
      }

      //order the images
      this.setState({
        images: this.state.images.sort((a,b) => b.tipAmount - a.tipAmount)
      })
      this.setState({loading: false})
    } else {
      window.alert('Decentragram contract has not been deployed to detected network ')
    }
    
  }

  //take the uploaded image and put it in readable format for ipfs
  captureFile = event => {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
    
  }

  //send the image to ipfs 
  //and take the returned hash and upload it to the smart contract
  uploadImage = description => {
    console.log("Submitting file to ipfs...")
    
    ipfs.add(this.state.buffer, (error, result) => {
      console.log('ipfs result', result )
      if (error){
        console.log(error)
        return 
      }


      //upload the result to the smart contract
      this.setState({ loading: true })
      this.state.decentragram.methods
        .uploadImage(result[0].hash, description)
        .send({ from: this.state.account })
        .on('transactionHash', hash => {
          this.setState({ loading: false})
      })
    })
  }

  //make it so that images are able to be tipped .1 ETH
  tipImageOwner = (id) => {
    this.setState({ loading: true })
    let value = window.web3.utils.toWei('.1', 'Ether')
    this.state.decentragram.methods
      .tipImageOwner(id)
      .send({ from: this.state.account, value: value  })
      .on('transactionHash', hash => {
        this.setState({ loading: false })
      })
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : (this.state.permission ? 
              <Main 
                captureFile={this.captureFile} 
                uploadImage={this.uploadImage}
                images={this.state.images}
                tipImageOwner={this.tipImageOwner}/> 
              : <p style={{marginTop: '20%', textAlign: 'center'}}>{this.state.message}</p>)
          }
      </div>
    );
  }
}

export default App;