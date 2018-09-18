const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const ArkPay = require('../lib')

const fixture = file => require(`./fixtures/${file}.json`)

let gateway
beforeEach(() => {
  const mock = new MockAdapter(axios)

  for (const peer of fixture('seeds')) {
    mock.onGet(`http://${peer.ip}:4003/api/v2/peers`).reply(200, fixture('peers'))
  }

  for (const peer of fixture('peers').data) {
    mock.onGet(`http://${peer.ip}:4003/api/v2/transactions`).reply(200, fixture('transactions'))
  }

  mock.onGet('https://min-api.cryptocompare.com/data/histoday').reply(200, fixture('rates'))
  mock.onGet('https://raw.githubusercontent.com/ArkEcosystem/peers/master/devnet.json').reply(200, fixture('seeds'))

  gateway = new ArkPay()
})

describe('ArkPay', () => {
  describe('constructor', () => {
    it('should be a function', () => {
      expect(gateway.constructor).toBeFunction()
    })
  })

  describe('reset', () => {
    it('should be a function', () => {
      expect(gateway.reset).toBeFunction()
    })
  })

  describe('recipient', () => {
    it('should be a function', () => {
      expect(gateway.recipient).toBeFunction()
    })

    it('should set the recipient', () => {
      gateway.recipient('dummy')

      expect(gateway.data.transfer.recipient).toBe('dummy')
    })
  })

  describe('amount', () => {
    it('should be a function', () => {
      expect(gateway.amount).toBeFunction()
    })

    it('should set the amount', () => {
      gateway.amount('dummy')

      expect(gateway.data.transfer.amounts.fiat).toBe('dummy')
    })
  })

  describe('vendorField', () => {
    it('should be a function', () => {
      expect(gateway.vendorField).toBeFunction()
    })

    it('should set the vendorField', () => {
      gateway.vendorField('dummy')

      expect(gateway.data.transfer.vendorField).toBe('dummy')
    })
  })

  describe('currency', () => {
    it('should be a function', () => {
      expect(gateway.currency).toBeFunction()
    })

    it('should set the currency', () => {
      gateway.currency('dummy')

      expect(gateway.data.transfer.currency).toBe('dummy')
    })
  })

  describe('coin', () => {
    it('should be a function', () => {
      expect(gateway.coin).toBeFunction()
    })

    it('should set the coin', () => {
      gateway.coin('dummy')

      expect(gateway.data.network.coin).toBe('dummy')
    })
  })

  describe('network', () => {
    it('should be a function', () => {
      expect(gateway.network).toBeFunction()
    })

    it('should set the network', () => {
      gateway.network('dummy')

      expect(gateway.data.network.name).toBe('dummy')
    })
  })

  describe('seeds', () => {
    it('should be a function', () => {
      expect(gateway.seeds).toBeFunction()
    })

    it('should set the seeds', () => {
      gateway.seeds('ark', [{ ip: 'dummy', port: 'dummy' }])

      expect(gateway.data.seeds).toEqual({ ark: ['dummy'] })
    })
  })

  describe('peers', () => {
    it('should be a function', () => {
      expect(gateway.peers).toBeFunction()
    })

    it('should set the peers', () => {
      gateway.peers([{ ip: 'dummy', port: 'dummy' }])

      expect(gateway.data.network.peers).toEqual(['dummy'])
    })
  })

  describe('toObject', () => {
    it('should be a function', () => {
      expect(gateway.toObject).toBeFunction()
    })

    it('should return an object', () => {
      expect(gateway.toObject()).toBeObject()
    })
  })

  describe('prepare', () => {
    it('should be a function', () => {
      expect(gateway.prepare).toBeFunction()
    })

    it('should call all methods', async () => {
      gateway.__fetchSeeds = jest.fn()
      gateway.__fetchPeers = jest.fn()
      gateway.__fetchRates = jest.fn()

      await gateway.prepare()

      expect(gateway.__fetchSeeds).toHaveBeenCalledTimes(1)
      expect(gateway.__fetchPeers).toHaveBeenCalledTimes(1)
      expect(gateway.__fetchRates).toHaveBeenCalledTimes(1)
    })
  })

  describe('start', () => {
    it('should be a function', () => {
      expect(gateway.start).toBeFunction()
    })
  })

  describe('__fetchSeeds', () => {
    it('should be a function', () => {
      expect(gateway.__fetchSeeds).toBeFunction()
    })

    it('should fetch seeds if peers do not exist', async () => {
      expect(gateway.data.network.peers).toBeEmpty()

      await gateway.__fetchSeeds()

      expect(gateway.data.network.peers).not.toBeEmpty()
    })

    it('should not fetch seeds if peers exist', async () => {
      gateway.data.network.peers = ['dummy']

      await gateway.__fetchSeeds()

      expect(gateway.data.network.peers).toEqual(['dummy'])
    })
  })

  describe('__fetchPeers', () => {
    it('should be a function', () => {
      expect(gateway.__fetchPeers).toBeFunction()
    })

    it('should fetch peers if seeds exist', async () => {
      await gateway.__fetchSeeds()

      const count = gateway.data.network.peers.length

      await gateway.__fetchPeers()

      expect(gateway.data.network.peers.length).toBeGreaterThan(count)
    })

    it('should not fetch peers if seeds do not exist', async () => {
      await gateway.__fetchPeers()

      expect(gateway.data.network.peers).toBeEmpty()
    })
  })

  describe('__fetchRates', () => {
    it('should be a function', () => {
      expect(gateway.__fetchRates).toBeFunction()
    })

    it('should fetch the current exchange rates', async () => {
      await gateway.__fetchRates()

      expect(gateway.data.transfer.exchangeRate).not.toBeEmpty()
      expect(gateway.data.transfer.amounts.crypto).not.toBeEmpty()
    })
  })

  describe('__fetchTransfer', () => {
    it('should be a function', () => {
      expect(gateway.__fetchTransfer).toBeFunction()
    })

    it('should fetch the transaction and match', async () => {
      gateway.data.network.peers = fixture('peers').data.map(peer => peer.ip)

      gateway
          .recipient('DNjuJEDQkhrJ7cA9FZ2iVXt5anYiM8Jtc9')
          .amount(1)
          .vendorField('thisisarandomtestingvendorfieldwhatever')
          .currency('USD')
          .coin('ARK')
          .network('devnet')

      gateway.data.transfer.amounts.crypto = 1

      const transaction = await gateway.__fetchTransfer()

      expect(transaction).toEqual(fixture('transactions').data[0])
    })

    it('should fetch the transaction and not match', async () => {
      const transaction = await gateway.__fetchTransfer()

      expect(transaction).toBeFalse()
    })
  })
})
