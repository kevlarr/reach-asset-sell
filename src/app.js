import React from 'react';
import * as reach from '@reach-sh/stdlib/ALGO';
import {Seller} from './seller';
import {Buyer} from './buyer';

const DEFAULT_FUND_AMOUNT = '10';

class ConnectAccount extends React.Component {
  render() {
    return <div>
      Please wait while we connect to your account.
      If this takes more than a few seconds, there may be something wrong.
    </div>;
  }
}

class SelectRole extends React.Component {
  render() {
    const {selectRole} = this.props;

    return <div>
      <div>
        <button onClick={() => selectRole('seller')}>Seller</button>
        <p>Creates an asset, sets a price</p>
      </div>
      <div>
        <button onClick={() => selectRole('buyer')}>Buyer</button>
        <p>Reviews and transfers payment to accept asset</p>
      </div>
    </div>
  }
}

class Error extends React.Component {
  render() {
    return <div>
      <p>There was an error.</p>
      <pre>{JSON.stringify(this.props)}</pre>
    </div>;
  }
}

export class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      view: 'ConnectAccount',
    };
  }

  async componentDidMount() {
    console.assert(this.state.view === 'ConnectAccount');
    
    //const stdlib = await stdlib_loader.loadStdlib();

    try {
      const account = await reach.getDefaultAccount();
      const address = await account.getAddress();
      const algod  = await reach.getAlgodClient();
      const faucet = await reach.getFaucet();

      // User can opt into adding more ALGO but give 10 by default
      const atomicAmount = reach.parseCurrency(DEFAULT_FUND_AMOUNT);
      await reach.transfer(faucet, account, atomicAmount);

      const networkBalance = await reach.balanceOf(account);
      const balance = reach.formatCurrency(networkBalance, 4);

      this.setState({
        algod,
        account,
        address,
        balance,
        faucet,
        view: 'SelectRole',
      });
    } catch (e) {
      this.setState({view: 'Error'});
    }
  }

  get content() {
    const {algod, account} = this.state;

    switch (this.state.view) {
      case 'ConnectAccount':
        return <ConnectAccount />;

      case 'SelectRole':
        return <SelectRole {...{
          selectRole: this.selectRole.bind(this),
        }} />;

      case 'Sell':
        return <Seller {...{algod, account}} />;

      case 'Buy':
        return <Buyer {...{algod, account}} />;

      case 'Error':
        return <Error {...this.state} />
    }
  }
      
  render() {
    return <div>
      {this.content}
    </div>;
  }

  /*
   * Actions
   */
  selectRole(role) {
    const view = role === 'seller'
      ? 'Sell'
      : role === 'buyer'
      ? 'Buy'
      : null;

    this.setState({view});
  }
}