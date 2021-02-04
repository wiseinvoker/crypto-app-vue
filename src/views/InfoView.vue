<template>
    <div class="container-fluid">
        <div class="row flex-xl-nowrap">
            <div class="col">
                <div class="row">
                    <div class="col-lg-4 mb-3">
                        <charts-min :symbol="symbol"></charts-min>
                    </div>
                    <div class="col-lg-4 mb-3">
                        <charts-hour :symbol="symbol"></charts-hour>
                    </div>
                    <div class="col-lg-4 mb-3">
                        <coin-charts :symbol="symbol" :suggestion="suggestDay"></coin-charts>
                    </div>
                </div>
                <div class="row">
                  <div class="col-lg-4 col-md-4">
                    <b-card
                      border-variant="primary"
                      header="Trade"
                      header-bg-variant="secondary"
                      header-text-variant="white"
                      align="center"
                    >
                      <b-card-text>
                        <div class="mb-2">
                          <label class="mr-sm-2" for="order-qty">Quantity:</label>
                          <b-form-input class="qty" id="order-qty" placeholder="Amount" type="number" v-model="orderQty" min="0.00"></b-form-input>
                        </div>
                        <div class="mt-2">
                          <b-button class="mr-5" variant="success" @click="placeOrder(orderQty, 'buy')">B u y</b-button>
                          <b-button class="ml-5" variant="danger" @click="placeOrder(orderQty, 'sell')">S e l l</b-button>
                        </div>
                      </b-card-text>
                    </b-card>
                  </div>
                  <div class="col-lg-4 col-md-4">
                    <b-card
                      border-variant="primary"
                      header="Suggestion"
                      header-bg-variant="info"
                      header-text-variant="white"
                      align="center"
                    >
                      <b-card-text>
                        <h5>{{ suggestionMin }} for short term</h5>
                        <h5>{{ suggestionHour }} for mid term</h5>
                        <h5>{{ suggestionDay }} for long term</h5>
                      </b-card-text>
                    </b-card>
                  </div>
                  <div class="col-lg-4 col-md-4">
                    <b-card
                      border-variant="primary"
                      header="Account"
                      header-bg-variant="primary"
                      header-text-variant="white"
                      align="center"
                    >
                      <b-card-text>
                        <!-- <h5>Profit: {{ Math.round(profit.history * 100) / 100 }} {{ quote }}</h5> -->
                        <h5>Profit: {{ Math.round(profitPercent * 1000) / 1000 }}%</h5>
                        <h5 v-for="(item, index) in balances" :key="index">
                          {{ item.asset }}: {{ Math.round(item.free * 100) / 100 }}
                        </h5>
                      </b-card-text>
                    </b-card>
                  </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
  import CoinCharts from '../components/CoinCharts.vue'
  import ChartsHour from '../components/ChartsHour.vue'
  import ChartsMin from '../components/ChartsMin.vue'
  import {subscribeSymbol} from '../services/binance'
  import { mapState } from 'vuex'

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  export default {
    props:['symbol'],
    name: 'info-view',
    data() {
      return {
        baseURL: 'http://127.0.0.1:8000/api/v1',
        name: '',
        nameState: null,
        profit: { history: 0 },
        asset: '',
        quote: '',
        initialBalance: [],
        profitPercent: 0,
        balances: [],
        suggestMin: '',
        suggestHour: '',
        suggestDay: '',
        orderQty: 0,
      };
    },
    filters: {
      priceformat: function(value) {
        if(!value) return "";
        return parseFloat(value).toLocaleString()
      },
      timeformat: function(value) {
        if(!value) return "";
        const dt = new Date(value);
        return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.toTimeString().split(' ')[0]}`
      }
    },
    components: {
      CoinCharts,
      ChartsHour,
      ChartsMin,
    },
    computed: {
      currency() {
        return this.$store.getters.getSymbolById(this.symbol) || {}
      },
      ticker() {
        console.log('symbol', this.symbol);
        console.log('ticker', this.$store.getters.getTickerById(this.symbol))
        return this.$store.getters.getTickerById(this.symbol) || {}
      },
      ...mapState(['suggestionDay', 'suggestionHour', 'suggestionMin', 'tickers'])
    },
    watch: {
      tickers: {
        immediate: true,
        deep: true,
        handler: function (value) {
          const currentTick = value[this.symbol]
          const price = currentTick ? currentTick['price'] : undefined
          if(price && this.balances.length && this.initialBalance.length){
            const current_networth = parseFloat(this.balances[0].free) * price + parseFloat(this.balances[1].free)
            const initial_networth = this.initialBalance[0] * price + this.initialBalance[1]
            this.profitPercent = (current_networth - initial_networth) / initial_networth * 100
          }
        }
      }
    },
    mounted() {
      subscribeSymbol(this.symbol);
    },
    async created() {
      await this.fetchProfitData()
      await this.fetchAccountData()
    },
    methods: {
      async fetchProfitData() {
        let response = await fetch(`${this.baseURL}/profit?crypto=${this.symbol}`)
        if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' + response.status);
          return;
        }
        const profitData = await response.json()
        this.profit = profitData
        this.asset = profitData.coins[0]
        this.quote = profitData.coins[1]
        this.initialBalance = profitData.initial
      },
      async fetchAccountData() {
        let response = await fetch(`${this.baseURL}/bnaccount`)
        if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' + response.status);
          return;
        }
        const acctData = await response.json()
        if (this.balances.length) this.balances = []
        acctData.balances.map( item => {
          if ( item.asset === this.asset || item.asset === this.quote ) {
            this.balances.push(item)
          }
        })
      },
      async placeOrder(qty, type) {
        console.log('Place order:', qty, type)
        if(!qty) return
        let api_url;
        if (type == 'buy') {
          api_url = this.baseURL + '/buyorder'
        } else if (type == 'sell') {
          api_url = this.baseURL + '/sellorder'
        } else {
          return
        }
        const response = await fetch(api_url, {
           method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({crypto: this.symbol, quantity: qty }),
        })
        if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' + response.status);
          return;
        }
        const data = await response.json()
        console.log('Order detail', data)
        await this.fetchAccountData()
        await this.fetchProfitData()
        this.orderQty = 0
      },
    }
  }
</script>
