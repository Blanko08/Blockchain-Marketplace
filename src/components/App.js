import React, { Component } from 'react';
import './App.css';
import Navbar from './Navbar';
import Main from './Main';
import Web3 from 'web3';
import Marketplace from '../abis/Marketplace.json';

class App extends Component {
  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadWeb3() {
    if(window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } else if(window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert('No ethereum browser is installed. Try it installing MetaMask.');
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3;
	
    // Cargar cuenta
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });

    // Recoger contrato
    const networkId = await web3.eth.net.getId();
    const netWorkData = Marketplace.networks[networkId];
    if(netWorkData) {
      // Asignar contracto
      const marketplace = new web3.eth.Contract(Marketplace.abi, netWorkData.address);
      this.setState({ marketplace });

      // Recoge el contador de productos
      const productCount = await marketplace.methods.productCount().call();
      this.setState({ productCount });

      // Recoge todos los productos.
      for(var i = 1; i <= productCount; i++) {
        const product = await marketplace.methods.products(i).call();
        this.setState({
          products: [...this.state.products, product]
        });
      }

      this.setState({ loading: false });
    } else {
      window.alert('Marketplace contract not deployed to detected network.');
    }
  }

  createProduct = (name, price) => {
    this.setState({ loading: true });

    this.state.marketplace.methods.createProduct(name, price).send({ from: this.state.account })
    .on('confirmation', (confirmationNumber) => {
      this.setState({ loading: false });
      window.location.reload();
    });
  }

  purchaseProduct = (id, price) => {
    this.setState({ loading: true });

    this.state.marketplace.methods.purchaseProduct(id).send({ from: this.state.account, value: price })
    .on('confirmation', (confirmationNumber) => {
      this.setState({ loading: false });
      window.location.reload();
    });
  }

  constructor(props) {
    super(props);
    this.state = {
      account: '',
      marketplace: {},
      productCount: 0,
      products: [],
      loading: true
    }
  }

  render() {
    let content;
    if(this.state.loading) {
      content = <p id="loader" className="text-center">Loading...</p>
    } else {
      content = <Main 
        products={ this.state.products }
        createProduct={ this.createProduct }
        purchaseProduct={ this.purchaseProduct }
      />
    }

    return (
      <div>
        <Navbar account={ this.state.account } />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                { content }
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
