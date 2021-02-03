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
                  <div class="col-lg-2 col-md-4">
                    <b-input-group>
                      <b-form-input placeholder="Amount" class="qty" type="number" v-model="buyQty" min="0.00"></b-form-input>
                      <b-input-group-append>
                        <b-button variant="success" @click="orderBuy(buyQty)">Buy</b-button>
                      </b-input-group-append>
                    </b-input-group>
                  </div>
                  <div class="col-lg-2 col-md-4">
                    <b-input-group>
                      <b-form-input placeholder="Amount" class="qty" type="number" v-model="sellQty" min="0.00"></b-form-input>
                      <b-input-group-append>
                        <b-button variant="danger" @click="orderSell(sellQty)">Sell</b-button>
                      </b-input-group-append>
                    </b-input-group>
                  </div>
                  <div class="col-lg-4 col-md-6">
                    <h4>Suggestion For Minute: {{ suggestionMin }}</h4>
                    <h4>Suggestion For Hour: {{ suggestionHour }}</h4>
                    <h4>Suggestion For Day: {{ suggestionDay }}</h4>
                  </div>
                  <div class="col-lg-4 col-md-6">
                    <h4>Profit: {{ Math.round(profit.history * 100) / 100 }} {{ quote }}</h4>
                    <h4 v-for="(item, index) in balances" :key="index">
                      {{ item.asset }}: {{ Math.round(item.free * 100) / 100 }}
                    </h4>
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
        balances: [],
        suggestMin: '',
        suggestHour: '',
        suggestDay: '',
        buyQty: 0,
        sellQty: 0,
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
      ...mapState(['suggestionDay', 'suggestionHour', 'suggestionMin'])
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
        console.log('Profit: ', profitData)
        this.profit = profitData
        this.asset = profitData.coins[0]
        this.quote = profitData.coins[1]
      },
      async fetchAccountData() {
        let response = await fetch(`${this.baseURL}/bnaccount`)
        if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' + response.status);
          return;
        }
        const acctData = await response.json()
        console.log('Account: ', acctData)
        if (this.balances.length) this.balances = []
        acctData.balances.map( item => {
          if ( item.asset === this.asset || item.asset === this.quote ) {
            this.balances.push(item)
          }
        })
      },
      async orderBuy(qty) {
        console.log('Buy Qty', qty)
        const response = await fetch(this.baseURL + '/buyorder', {
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
        console.log('Order: ', data)
        await this.fetchAccountData()
        await this.fetchProfitData()

      },
      async orderSell(qty) {
        console.log('Sell Qty', qty)
        const response = await fetch(this.baseURL + '/sellorder', {
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
        console.log('Order: ', data)
        await this.fetchAccountData()
        await this.fetchProfitData()
      },
      checkFormValidity() {
        const valid = this.$refs.form.checkValidity()
        this.nameState = valid
        return valid
      },
      resetModal() {
        this.name = ''
        this.nameState = null
      },
      handleOk(bvModalEvt) {
        // Prevent modal from closing
        bvModalEvt.preventDefault()
        // Trigger submit handler
        this.handleSubmit()
      },
      handleSubmit() {
        // Exit when the form isn't valid
        if (!this.checkFormValidity()) {
          return
        }
        // Hide the modal manually
        this.$nextTick(() => {
          this.$bvModal.hide('modal-buycoin')
        })
      }
    }
  }
</script>
