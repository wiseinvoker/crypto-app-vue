<template>
    <div class="info-card">
        <div class="row">
            <div class="chart-panel col" ref="chartdivmin" id="chartdivmin">
            </div>
        </div>
        <div class="spinner" v-if="chartLoading">
            <div class="circle-spinner"></div>
        </div>
    </div>
</template>
<script>
  import 'amcharts3/amcharts/amcharts'
  import 'amcharts3/amcharts/serial'
  import 'amstock3/amcharts/amstock'
  import 'amcharts3/amcharts/xy'
  import { mapState } from 'vuex'
  import store from '../store'

  export default {
    name: 'charts-min',
    props: ['symbol'],
    data() {
      return {
        chartData: [],
        lastEpoch: null,
        chart: null,
        interval: '1m',
        timeInterval: 60 * 1000,
        chartLoading: true,
        chartType: 'cs',
      }
    },
    computed: {
      ...mapState(['tickers'])
    },
    watch: {
      tickers: {
        immediate: true,
        deep: true,
        handler: function (value) {
          const currentTick = value[this.symbol]
          let currentTickTime
          if (this.lastEpoch && currentTick && currentTick['time'] > this.lastEpoch) {
            if (currentTick['time'] % this.timeInterval < 1000) {
              if (this.chart && this.chart.dataSets[0]) {
                let isFound = false
                // this.chart.dataSets[0].dataProvider
                currentTickTime = currentTick['time'] - (currentTick['time'] % this.timeInterval)
                for (var i = 0; i < this.chartData.length; i++) {
                  if (currentTickTime == this.chartData[i]['time']) {
                    this.chartData[i]['value'] = currentTick['price']
                    isFound = true
                    this.chart.dataSets[0].dataProvider = this.chartData;
                    this.chart.validateData()
                    break
                  }
                }
                if (!isFound) {
                  this.chart.dataSets[0].dataProvider.push({
                    'date': new Date(currentTick['time']),
                    'time': currentTick['time'],
                    'value': currentTick['price']
                  })
                  this.chart.validateData()
                }
              }
            }
          }
        }
      }
    },
    mounted() {
      this.fetchChartData();
    },
    beforeDestroy() {
      if(this.chart) {
        this.chart.clear();
        this.chart = null;
        this.chartData = [];
      }
    },
    methods: {
      zoomChart() {
        if(this.chartData.length > 30){
          this.chart.scrollbarChart.zoomToIndexes(this.chartData.length - 2, this.chartData.length - 1)
        }
      },
      async fetchChartData(isUpdate = false) {
        this.chartLoading = true
        //proxyuUrl is done to avoid cross-origin error as it is directly called from javascript.
        const BASE_URL = 'https://api.binance.com/api/v1/klines'
        const ML_API_URL = 'http://127.0.0.1:8000/api/v1/cryptoforecast'
        const response = await fetch(`${BASE_URL}?symbol=${this.symbol}&interval=${this.interval}&limit=100`)
        if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' + response.status);
          return;
        }
        const data = await response.json()
        this.chartData = data.map((val) => {
          return {
            "date": new Date(val[0]),
            "time": val[0],
            "open": parseFloat(val[1]),
            "high": parseFloat(val[2]),
            "low": parseFloat(val[3]),
            "close": parseFloat(val[4]),
            "volume": parseFloat(val[5]),
            "value": parseFloat(val[4])
          }
        })
        // Get last 20 elements in data
        let lastElements = data.slice(Math.max(data.length - 5, 0))
        let lastPrices = lastElements.map((val) => parseFloat(val[4]))
        this.lastEpoch = lastElements[lastElements.length - 1][0]
        const res = await fetch(`${ML_API_URL}?symbol=${this.symbol}&interval=${this.interval}&steps=20`, { 
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(lastPrices),
        })

        const resData = await res.json()

        resData.predicted.map((val, index) => {
          this.chartData.push({
            "date": new Date(this.lastEpoch + (this.timeInterval * (index + 1))),
            "time": this.lastEpoch + (this.timeInterval * (index + 1)),
            "pred": parseFloat(val),
          })
        })
        store.commit('UPDATE_MIN_SUGGEST', resData.suggestion)

        if (isUpdate) {
          this.chart.dataSets[0].dataProvider = this.chartData;
          this.chart.validateData()
        }
        else {
          this.showChart();
        }
        this.chartLoading = false;
        this.zoomChart();
      },
      showChart() {
        this.chart = window.AmCharts.makeChart("chartdivmin", {
          "type": "stock",
          "theme": "light",
          "dataDateFormat": "YYYY-MM-DD JJ:NN",
          "mouseWheelZoomEnabled": true,
          "pathToImages": "http://cdn.amcharts.com/lib/3/images/",
          "categoryAxesSettings": {
            "minPeriod": "mm"
          },
          "dataSets": [{
            "fieldMappings": [{
              "fromField": "value",
              "toField": "value"
            }],
            "title": this.symbol,
            // "color": "#7f8da9",
            "dataProvider": this.chartData,
            "categoryField": "date",
            // "compared": true
          },{
            "fieldMappings": [{
              "fromField": "pred",
              "toField": "pred"
            }],
            "title": "Predicted",
            "color": "#7f8da9",
            "dataProvider": this.chartData,
            "categoryField": "date",
            "compared": true
          }],
          "panels": [
            {
              "title": "Price by the minute",
              "recalculateToPercents": "never",
              "showCategoryAxis": true,
              "percentHeight": 70,
              "valueAxes": [{
                "id": "v1",
                "dashLength": 3
              }],

              "categoryAxis": {
                "dashLength": 5,
                "parseDates": true,
                "guides": [{
                  "date": new Date(this.lastEpoch + this.timeInterval),
                  "lineAlpha": 1,
                  "label": "Now",
                  "inside": true,
                  "lineThickness": 1,
                  "lineColor": "#ff8800"
                }],
              },

              "stockGraphs": [{
                "id": "g1",
                "type": "line",
                "valueField": "value",
                "lineThickness": 1,
                "useDataSetColors": false,
                "lineColor": "#00a928",
                "connect": false,
                "showBalloon": true,
                "balloonText": "<b>[[value]]</b>"
              },{
                "id": "g2",
                "type": "line",
                "valueField": "pred",
                "lineThickness": 3,
                "useDataSetColors": false,
                // "lineColor": "#00a928",
                "showBalloon": true,
                "balloonText": "<b>[[pred]]</b>",
                "comparable": true,
                "compareField": "pred"
              }],

              "stockLegend": {
                "valueTextRegular": undefined,
                "periodValueTextComparing": "[[percents.value.close]]%"
              }
            },
          ],
          "chartScrollbarSettings": {
            "graph": "g1",
            "graphType": "line",
            "usePeriod": "mm"
          },
          "chartCursorSettings": {
            "valueBalloonsEnabled": true,
            "valueLineBalloonEnabled": true,
            "valueLineEnabled": true
          },
          "legendSettings": {
            "useMarkerColorForLabels": true
          }
        });
      }
    }
  }
</script>