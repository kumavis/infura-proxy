const ProviderEngine = require('web3-provider-engine')
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js')
const PkHookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet-ethtx.js')
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js')
const SanitizerSubprovider = require('web3-provider-engine/subproviders/sanitizer.js')
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js')

module.exports = rpcWrapperEngine

function rpcWrapperEngine(opts){
  opts = opts || {}

  var engine = opts.engine || new ProviderEngine()

  // tx signing
  var privateKey = opts.privateKey
  var addresses = [opts.addressHex]

  engine.addProvider(new PkHookedWalletSubprovider({
    getAccounts: function(cb){
      cb(null, addresses)
    },
    getPrivateKey: function(from, cb){
      cb(null, privateKey)
    },
  }))

  // filters
  engine.addProvider(new FilterSubprovider())
  
  // pending nonce
  engine.addProvider(new NonceSubprovider())

  // parity fixes
  engine.addProvider(new SanitizerSubprovider())

  // data source
  engine.addProvider(new RpcSubprovider({
    rpcUrl: opts.rpcUrl,
  }))

  // start polling
  engine.start()

  return engine
}