#!/usr/bin/env node

const request = require('request')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const ethUtil = require('ethereumjs-util')
const SigningProvider = require('./signer.js')

const PORT = process.env.PORT || 8545
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x01e59d658778f5c5521625abd84a30f03a6b24ebbdcd4eddcdacf7fc6d163b03'
if (!PRIVATE_KEY) throw new Error('Env var PRIVATE_KEY not specified.')
const RPC_NODE = process.env.RPC_NODE || 'https://ropsten.infura.io/'
if (!RPC_NODE) throw new Error('Env var RPC_NODE not specified.')

// calculate faucet address
var signerPrivateKey = ethUtil.toBuffer(PRIVATE_KEY)
var signerAddress = ethUtil.privateToAddress(signerPrivateKey)
var signerAddressHex = '0x'+signerAddress.toString('hex')

console.log('Acting as signer for address:', signerAddressHex)

//
// create provider
//

// ProviderEngine based caching layer, with fallback to geth
var provider = SigningProvider({
  rpcUrl: RPC_NODE,
  addressHex: signerAddressHex,
  privateKey: signerPrivateKey,
})

startServer()

//
// create webserver
//
function startServer() {

  const app = express()
  app.use(cors())
  app.use(bodyParser.json({ type: '*/*' }))

  app.post('/', function(req, res){

    // parse request
    var payload = req.body

    if (typeof payload !== 'object') {
      return didError(new Error('payload parse failure - '+payload))
    }

    provider.sendAsync(payload, function(err, response){
      if (err) return didError(err)
      res.send(response)
    })

    function didError(err){
      console.error(err.stack || err)
      res.status(500).json({ error: err.message || err })
    }

    function invalidRequest(){
      res.status(400).json({ error: 'Not a valid request.' })
    }

  })

  app.listen(PORT, function(){
    console.log('ethereum rpc listening on', PORT)
    console.log('and proxying to', RPC_NODE)
  })

}


function validateRequest( requestObject ){
  return typeof requestObject === 'object' && !!requestObject.method
}

