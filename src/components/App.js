import React, { Component } from 'react';
import Web3 from 'web3';
import Identicon from 'identicon.js';
import './App.css';
import Decentragram from '../abis/Decentragram.json'
import Navbar from './Navbar'
import Main from './Main'


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


  async loadBlockchainData() {
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    this.setState({
      account: accounts[0]
    })

    //get the smart contract off of the blockchain
    const netID = await web3.eth.net.getId()
    const networkData = Decentragram.networks[netID]
    if(networkData){
      const decentragram = web3.eth.Contract(Decentragram.abi, networkData.address)
      this.setState({ decentragram})

      const imagesCount = await decentragram.methods.imagesCount().call()
      this.setState({ imagesCount})

      this.setState({loading: false})
    } else {
      window.alert('Decentragram contract has not been deployed to detected network ')
    }
    
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : (this.state.permission ? <Main
            // Code...
            /> : <p style={{marginTop: '20%', textAlign: 'center'}}>{this.state.message}</p>)
          }
      </div>
    );
  }
}

export default App;