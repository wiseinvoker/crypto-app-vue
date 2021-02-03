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
        candleStickChartConfig: {
          "type": "stock",
          "theme": "light",
          "dataDateFormat": "YYYY-MM-DD, JJ:NN",
          "mouseWheelZoomEnabled": true,
          "pathToImages": "http://cdn.amcharts.com/lib/3/images/",
          categoryAxesSettings: {
            minPeriod: "mm"
          },
          "dataSets": [{
            "fieldMappings": [{
              "fromField": "open",
              "toField": "open"
            }, {
              "fromField": "close",
              "toField": "close"
            }, {
              "fromField": "high",
              "toField": "high"
            }, {
              "fromField": "low",
              "toField": "low"
            }, {
              "fromField": "volume",
              "toField": "volume"
            }],
            "color": "#7f8da9",
            "dataProvider": this.chartData,
            "title": this.symbol,
            "categoryField": "date"
          }],
          "panels": [{
            "title": "Price",
            "showCategoryAxis": true,
            "percentHeight": 70,
            "valueAxes": [{
              "id": "v1",
              "dashLength": 5
            }],

            "categoryAxis": {
              "dashLength": 5
            },

            "stockGraphs": [{
              "type": "candlestick",
              "id": "g1",
              "openField": "open",
              "closeField": "close",
              "highField": "high",
              "lowField": "low",
              "valueField": "close",
              "lineColor": "#00a928",
              "fillColors": "#00a928",
              "negativeLineColor": "#db4c3c",
              "negativeFillColors": "#db4c3c",
              "fillAlphas": 1,
              "useDataSetColors": false,
              "showBalloon": true,
              "useNegativeColorIfDown": false,
              "balloonText": "Open:<b>[[open]]</b><br>Low:<b>[[low]]</b><br>High:<b>[[high]]</b><br>Close:<b>[[close]]</b>",
            }],

            "stockLegend": {
              "valueTextRegular": undefined,
              "periodValueTextComparing": "[[percents.value.close]]%"
            }
          },
            {
              "title": "Volume",
              "percentHeight": 30,
              "marginTop": 1,
              "showCategoryAxis": true,
              "valueAxes": [{
                "dashLength": 5
              }],
              "categoryAxis": {
                "dashLength": 5
              },

              "stockGraphs": [{
                "valueField": "volume",
                "type": "column",
                "fillColors": '#7f8da9',
                "showBalloon": true,
                "fillAlphas": 1
              }],

              "stockLegend": {
                "markerType": "none",
                "markerSize": 0,
                "labelText": "",
                "periodValueTextRegular": "[[value.close]]"
              }
            }
          ],
          "chartScrollbarSettings": {
            "graph": "g1",
            "graphType": "line",
            "usePeriod": "mm"
          },
          "chartCursorSettings": {
            "valueLineBalloonEnabled": true,
            "valueLineEnabled": true
          },
          "legendSettings": {
            "useMarkerColorForLabels": true
          }
        },
        lineCartConfig: {
          "type": "stock",
          "theme": "light",
          "dataDateFormat": "YYYY-MM-DD JJ:NN",
          "mouseWheelZoomEnabled": true,
          "pathToImages": "http://cdn.amcharts.com/lib/3/images/",
          categoryAxesSettings: {
            minPeriod: "mm"
          },
          "dataSets": [{
            "color": "#00a928",
            "fieldMappings": [ {
              "fromField": "value",
              "toField": "value"
            } ],
            "dataProvider": this.chartData,
            "categoryField": "date"
          }],
          "panels": [ {
            "showCategoryAxis": true,
            "title": "Price",
            "stockGraphs": [ {
              "id": "g1",
              "valueField": "value",
              "useDataSetColors": false
            } ],
            "stockLegend": {
              "periodValueTextRegular": "[[value.close]]"
            }
          },
            {
              "title": "Volume",
              "percentHeight": 30,
              "showCategoryAxis": true,
              "stockGraphs": [ {
                "valueField": "volume",
                "type": "column",
                "showBalloon": false,
                "fillAlphas": 1
              } ],
              "stockLegend": {
                "periodValueTextRegular": "[[value.close]]"
              }
            }
          ],
          "chartScrollbarSettings": {
            "graph": "g1",
            "graphType": "line",
            "usePeriod": "mm"
          },
          "chartCursorSettings": {
            "valueLineBalloonEnabled": true,
            "valueLineEnabled": true
          },
          "legendSettings": {
            "useMarkerColorForLabels": true
          }
        }
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
          if (this.lastEpoch && currentTick['time'] > this.lastEpoch) {
            if (currentTick['time'] % this.timeInterval < 1000) {
              console.log('Tick:', currentTick)
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
        const baseURL = 'https://api.binance.com/api/v1/klines'
        const mlAPIURL = 'http://127.0.0.1:8000/api/v1/cryptoforecast'
        const response = await fetch(`${baseURL}?symbol=${this.symbol}&interval=${this.interval}&limit=100`)
        if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' + response.status);
          return;
        }
        const data = await response.json()
        this.chartData = data.map((val) => {
          return {
            "date": new Date(val[0]),
            "open": parseFloat(val[1]),
            "high": parseFloat(val[2]),
            "low": parseFloat(val[3]),
            "close": parseFloat(val[4]),
            "volume": parseFloat(val[5]),
            "value": parseFloat(val[4])
          }
        })
        // Get last 5 elements in data
        let lastElements = data.slice(Math.max(data.length - 5, 0))
        let lastPrices = lastElements.map((val) => parseFloat(val[4]))
        this.lastEpoch = lastElements[lastElements.length - 1][0]
        const res = await fetch(mlAPIURL, { 
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(lastPrices),
        })

        const resData = await res.json()

        resData.map((val, index) => {
          this.chartData.push({
            "date": new Date(this.lastEpoch + (this.timeInterval * (index + 1))),
            "pred": parseFloat(val),
          })
        })

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
      toCandleStickChart() {
        this.chartType = 'cs';
        const dataSet = this.chart.dataSets[0];
        const panel = this.chart.panels[0];
        dataSet.fieldMappings = [];
        dataSet.fieldMappings.push({
          fromField: "close",
          toField: "close",
        });
        dataSet.fieldMappings.push({
          fromField: "open",
          toField: "open"
        });
        dataSet.fieldMappings.push({
          fromField: "high",
          toField: "high"
        });
        dataSet.fieldMappings.push({
          fromField: "low",
          toField: "low"
        });
        dataSet.fieldMappings.push({
          fromField: "volume",
          toField: "volume"
        });
        dataSet.fieldMappings.push({
          fromField: "value",
          toField: "value"
        });
        panel.stockGraphs[0] = {
          id: "g1",
          type: "candlestick",
          balloonText: "Open:<b>[[open]]</b><br>Low:<b>[[low]]</b><br>High:<b>[[high]]</b><br>Close:<b>[[close]]</b>",
          closeField: "close",
          fillColors: "#00a928",
          highField: "high",
          lineColor: "#00a928",
          lineAlpha: 1,
          lowField: "low",
          fillAlphas: 1,
          negativeFillColors: "#db4c3c",
          negativeLineColor: "#db4c3c",
          openField: "open",
          valueField: "value",
          proCandlesticks: false,
          useDataSetColors: false
        };
        panel.stockLegend.valueTextRegular = "[[close]] ";
        this.chart.validateNow()
      },
      toLineChart() {
        this.chartType = 'lc';
        const dataSet = this.chart.dataSets[0];
        const panel = this.chart.panels[0];
        dataSet.fieldMappings = [];
        dataSet.fieldMappings.push({
          fromField: "value",
          toField: "value",
        });
        dataSet.fieldMappings.push({
          fromField: "volume",
          toField: "volume"
        });
        panel.stockGraphs[0] = {
          id: "g1",
          type: "line",
          valueField: "value",
          lineThickness: 1,
          useDataSetColors: false,
          lineColor: "#00a928",
          showBalloon: true,
          balloonText: "<b>[[value]]</b>"
        };
        panel.stockLegend.periodValueTextRegular = "[[value.close]] ";
        this.chart.validateNow()
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