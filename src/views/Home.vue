<template>
    <div>
      
    </div>
</template>
<script>
  // import CryptoNews from '../components/CryptoNews.vue'
  import CoinCharts from '../components/CoinCharts.vue'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  export default {
    // props:['symbol'],
    name: 'home-view',
    data() {
      return {

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
      // CryptoNews,
      CoinCharts
    },
    computed: {
      currency() {
        // return this.$store.getters.getSymbolById(this.symbol) || {}
      },
      ticker() {
        // return this.$store.getters.getTickerById(this.symbol) || {}
      }
    }
  }
</script>
