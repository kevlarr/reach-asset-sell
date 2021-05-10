import React from 'react';
import algosdk from 'algosdk';
import * as reach from '@reach-sh/stdlib/ALGO';
import * as backend from '../build/index.main.mjs';
import {TextBox} from './components';

class CreateAsset extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      title: 'SuperCoolAsset',
      edition: '1',
      symbol: 'SCA',
      note: '',
    };
  }

  render() {
    return <div>
      <h1>Create asset</h1>
      <form
        style={{display: 'flex', flexDirection: 'column'}}
        onSubmit={e => this.props.createAsset(this.state)}
      >
        <label>Title</label>
        <input
          type="text"
          value={this.state.title}
          max={32}
          onChange={e => this.setState({title: e.target.value})}
          required
        />

        <label>Symbol</label>
        <input
          type="text"
          value={this.state.symbol}
          max={16}
          onChange={e => this.setState({symbol: e.target.value})}
          required
        />

        <label>Edition</label>
        <input
          type="number"
          min={1}
          max={1000}
          value={this.state.edition}
          onChange={e => this.setState({edition: e.target.value})}
          required
        />

        <label>Note</label>
        <input
          type="text"
          max={32}
          value={this.state.note}
          onChange={e => this.setState({note: e.target.value})}
        />

        <button>Submit</button>
      </form>
    </div>;
  }
}

class CreatingAsset extends React.Component {
  render() {
    return <p>Creating asset...</p>;
  }
}

class PublishListing extends React.Component {
  constructor(props) {
    super(props);
    this.state = {price: '1'};
  }

  render() {
    return <form onSubmit={() => this.props.publishPrice(this.state.price)}>
      <label>Price</label>
      <input
        type="number"
        value={this.state.price}
        min={1}
        max={5}
        onChange={e => this.setState({price: e.target.value})}
        required
      />
      <button>Publish</button>
    </form>;
  }
}

export class Seller extends React.Component {
  constructor(props) {
    super(props);
    this.state = {view: 'CreateAsset'};
  }

  get assetDetails() {
    if (!this.state.asset) { return; }

    return JSON.stringify(this.state.asset, null, 2);
  }

  get ctcDetails() {
    if (!this.state.ctcInfo) { return; }

    return JSON.stringify(this.state.ctcInfo, null, 2);
  }

  get content() {
    switch (this.state.view) {
      case 'CreateAsset':
        return <CreateAsset {...{
          createAsset: this.createAsset.bind(this),
        }} />;

      case 'CreatingAsset':
        return <CreatingAsset />;

      case 'AssetCreated':
        return <div>
          <button onClick={this.deploy.bind(this)}>Deploy</button>
        </div>;

      case 'Deploying':
        return <div>
          Deploying Reach app...
        </div>;

      case 'PublishListing':
        return <PublishListing {...{
          asset: this.state.asset,
          publishPrice: this.publishPrice.bind(this),
        }} />;

      case 'Published':
        return <div></div>;
    }
  }

  render() {
    return <div>
      <h1>Seller</h1>

      {this.state.asset &&
        <div>
          <h2>Asset</h2>
          <TextBox>{this.assetDetails}</TextBox>
        </div>
      }

      {this.state.ctcInfo &&
        <div>
          <h2>CTC</h2>
          <TextBox>{this.ctcDetails}</TextBox>
        </div>
      }

      {this.content}
    </div>;
  }

  async createAsset(asset) {
    this.setState({view: 'CreatingAsset'});

    const {algod, account} = this.props;
    const {addr, sk} = account.networkAccount;
    const suggestedParams = await algod.getTransactionParams().do();

    // A "note" string needs to be encoded as a UInt8Array
    const note_bytes = new TextEncoder().encode(asset.note || '');

    // An NFT is any ASA with..
    //   * Total:    1
    //   * Decimals: 0
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParams(
      addr, // from
      note_bytes, // note
      1, // total
      0, // decimals
      false, // defaultFrozen

      // TODO: set these to null..?
      addr, // manager
      addr, // reserve
      addr, // freeze
      addr, // clawback

      asset.symbol, // unitName
      asset.title, // assetName
      '', // assetUrl
      '', // assetMetadataHash

      suggestedParams,
    );
    const stxn = txn.signTxn(sk);

    // TODO
    // So there's a mix of `algod.<method>` and `reach.<method>`, with the latter
    // generally proxying to an algod instance... but using the `reach.` proxy
    // methods each manually await retrieving an algod instance, which seems... wrong.
    //
    // I *THINK* that `reach` should *PROBABLY* only be used for specific
    // calls to the backend and that `algod` calls should be preferred... maybe?
    const {txId} = await algod.sendRawTransaction(stxn).do();

    await reach.waitForConfirmation(txId);

    const pending = await algod.pendingTransactionInformation(txId).do();

    asset.id = pending['asset-index'];

    // Need to actually "mint" the asset to the creator's account
    // before being able to transfer ownership
    await reach.transfer(account, account, 1, asset.id);

    this.setState({view: 'AssetCreated', asset});
  }

  async deploy() {
    this.setState({view: 'Deploying'});

    const {account} = this.props;
    const ctc = await account.deploy(backend);
    const ctcInfo = await ctc.getInfo();

    this.setState({ctc, ctcInfo, view: 'PublishListing'});
  }

  async publishPrice(price) {
    const {asset, ctc} = this.state;
    const atomicPrice = reach.parseCurrency(price);

    // This creates a backend participant with an object that fulfills the necessary interface.
    await backend.Seller(ctc, {
      assetId: asset.id,
      price: atomicPrice,
    });

    this.setState({view: 'Published'});
  }
}