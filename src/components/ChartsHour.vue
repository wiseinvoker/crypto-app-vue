<template>
  <div class="info-card">
    <div class="row">
      <!-- <div class="col-12  align-items-center">
                <div class="row chart-bar">
                    <div class="chart-type">
                        <label>Hours&nbsp;</label>
                        <button class="btn btn-primary btn-sm mr-2" :class="[{'active': chartType==='cs'}]" @click="toCandleStickChart">Candlestick</button>
                        <button class="btn btn-primary btn-sm" :class="[{'active': chartType==='lc'}]" @click="toLineChart">Line Chart</button>
                    </div>
                </div>
            </div> -->
      <div class="chart-panel col" ref="chartdivhour" id="chartdivhour"></div>
    </div>
    <div class="spinner" v-if="chartLoading">
      <div class="circle-spinner"></div>
    </div>
  </div>
</template>
<script>
import "amcharts3/amcharts/amcharts";
import "amcharts3/amcharts/serial";
import "amstock3/amcharts/amstock";
import "amcharts3/amcharts/xy";
import { mapState } from "vuex";
import store from "../store";
import { BASEURL, ML_API_URL } from "../constants"

export default {
  name: "charts-hour",
  props: ["symbol"],
  data() {
    return {
      chartData: [],
      lastEpoch: null,
      chart: null,
      interval: "1h",
      timeInterval: 60 * 60 * 1000,
      chartLoading: true,
      chartType: "cs",
    };
  },
  computed: {
    ...mapState(["tickers"]),
  },
  watch: {
    tickers: {
      immediate: true,
      deep: true,
      handler: function (value) {
        const currentTick = value[this.symbol];
        let currentTickTime;
        if (
          this.lastEpoch &&
          currentTick &&
          currentTick["time"] > this.lastEpoch
        ) {
          if (currentTick["time"] % this.timeInterval < 1000) {
            if (this.chart && this.chart.dataSets[0]) {
              let isFound = false;
              // this.chart.dataSets[0].dataProvider
              currentTickTime =
                currentTick["time"] - (currentTick["time"] % this.timeInterval);
              for (var i = 0; i < this.chartData.length; i++) {
                if (currentTickTime == this.chartData[i]["time"]) {
                  this.chartData[i]["value"] = currentTick["price"];
                  isFound = true;
                  this.chart.dataSets[0].dataProvider = this.chartData;
                  this.chart.validateData();
                  break;
                }
              }
              if (!isFound) {
                this.chart.dataSets[0].dataProvider.push({
                  date: new Date(currentTick["time"]),
                  time: currentTick["time"],
                  value: currentTick["price"],
                });
                this.chart.validateData();
              }
            }
          }
        }
      },
    },
  },
  mounted() {
    this.fetchChartData();
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.clear();
      this.chart = null;
      this.chartData = [];
    }
  },
  methods: {
    zoomChart() {
      if (this.chartData.length > 30) {
        this.chart.scrollbarChart.zoomToIndexes(
          this.chartData.length - 2,
          this.chartData.length - 1
        );
      }
    },
    async fetchChartData(isUpdate = false) {
      this.chartLoading = true;
      const response = await fetch(
        `${BASEURL}?symbol=${this.symbol}&interval=${this.interval}&limit=100`
      );
      if (response.status !== 200) {
        console.log(
          "Looks like there was a problem. Status Code: " + response.status
        );
        return;
      }
      const data = await response.json();
      this.chartData = data.map((val) => {
        return {
          date: new Date(val[0]),
          time: val[0],
          open: parseFloat(val[1]),
          high: parseFloat(val[2]),
          low: parseFloat(val[3]),
          close: parseFloat(val[4]),
          volume: parseFloat(val[5]),
          value: parseFloat(val[4]),
        };
      });
      // Get last 20 elements in data
      let lastElements = data.slice(Math.max(data.length - 5, 0));
      let lastPrices = lastElements.map((val) => parseFloat(val[4]));
      this.lastEpoch = lastElements[lastElements.length - 1][0];
      let res = await fetch(
        `${ML_API_URL}?symbol=${this.symbol}&interval=${this.interval}&steps=20`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(lastPrices),
        }
      );

      let resData = await res.json();

      resData.predicted.map((val, index) => {
        this.chartData.push({
          date: new Date(this.lastEpoch + this.timeInterval * (index + 1)),
          time: this.lastEpoch + this.timeInterval * (index + 1),
          predLstm: parseFloat(val),
        });
      });
      store.commit("UPDATE_HOUR_SUGGEST", resData.suggestion);
      // Predict by MASS algorithm
      lastElements = data.slice(Math.max(data.length - 30, 0));
      lastPrices = lastElements.map((val) => parseFloat(val[4]));
      res = await fetch(
        `${ML_API_URL}?symbol=${this.symbol}&interval=${this.interval}&steps=15&method=mass`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(lastPrices),
        }
      );
      resData = await res.json();

      resData.predicted.map((val, index) => {
        this.chartData[
          this.chartData.length - 15 + index
        ].predMass = parseFloat(val);
      });

      if (isUpdate) {
        this.chart.dataSets[0].dataProvider = this.chartData;
        this.chart.validateData();
      } else {
        this.showChart();
      }
      this.chartLoading = false;
      this.zoomChart();
    },
    toCandleStickChart() {
      this.chartType = "cs";
      const dataSet = this.chart.dataSets[0];
      const panel = this.chart.panels[0];
      dataSet.fieldMappings = [];
      dataSet.fieldMappings.push({
        fromField: "close",
        toField: "close",
      });
      dataSet.fieldMappings.push({
        fromField: "open",
        toField: "open",
      });
      dataSet.fieldMappings.push({
        fromField: "high",
        toField: "high",
      });
      dataSet.fieldMappings.push({
        fromField: "low",
        toField: "low",
      });
      dataSet.fieldMappings.push({
        fromField: "volume",
        toField: "volume",
      });
      dataSet.fieldMappings.push({
        fromField: "value",
        toField: "value",
      });
      panel.stockGraphs[0] = {
        id: "g1",
        type: "candlestick",
        balloonText:
          "Open:<b>[[open]]</b><br>Low:<b>[[low]]</b><br>High:<b>[[high]]</b><br>Close:<b>[[close]]</b>",
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
        useDataSetColors: false,
      };
      panel.stockLegend.valueTextRegular = "[[close]] ";
      this.chart.validateNow();
    },
    toLineChart() {
      this.chartType = "lc";
      const dataSet = this.chart.dataSets[0];
      const panel = this.chart.panels[0];
      dataSet.fieldMappings = [];
      dataSet.fieldMappings.push({
        fromField: "value",
        toField: "value",
      });
      dataSet.fieldMappings.push({
        fromField: "volume",
        toField: "volume",
      });
      panel.stockGraphs[0] = {
        id: "g1",
        type: "line",
        valueField: "value",
        lineThickness: 1,
        useDataSetColors: false,
        lineColor: "#00a928",
        showBalloon: true,
        balloonText: "<b>[[value]]</b>",
      };
      panel.stockLegend.periodValueTextRegular = "[[value.close]] ";
      this.chart.validateNow();
    },
    showChart() {
      this.chart = window.AmCharts.makeChart("chartdivhour", {
        type: "stock",
        theme: "light",
        dataDateFormat: "YYYY-MM-DD HH",
        mouseWheelZoomEnabled: true,
        pathToImages: "http://cdn.amcharts.com/lib/3/images/",
        categoryAxesSettings: {
          minPeriod: "hh",
        },
        dataSets: [
          {
            fieldMappings: [
              {
                fromField: "value",
                toField: "value",
              },
            ],
            title: this.symbol,
            // "color": "#7f8da9",
            dataProvider: this.chartData,
            categoryField: "date",
            // "compared": true
          },
          {
            fieldMappings: [
              {
                fromField: "predLstm",
                toField: "predLstm",
              },
            ],
            title: "LSTM",
            color: "#7f8da9",
            dataProvider: this.chartData,
            categoryField: "date",
            compared: true,
          },
          {
            fieldMappings: [
              {
                fromField: "predMass",
                toField: "predMass",
              },
            ],
            title: "MASS",
            // "color": "#7f8da9",
            dataProvider: this.chartData,
            categoryField: "date",
            compared: true,
          },
        ],
        panels: [
          {
            title: "Hour",
            recalculateToPercents: "never",
            showCategoryAxis: true,
            percentHeight: 70,
            valueAxes: [
              {
                id: "v1",
                dashLength: 3,
              },
            ],

            categoryAxis: {
              dashLength: 5,
              parseDates: true,
              guides: [
                {
                  date: new Date(this.lastEpoch + this.timeInterval),
                  lineAlpha: 1,
                  label: "Now",
                  inside: true,
                  lineThickness: 1,
                  lineColor: "#ff8800",
                },
              ],
            },

            stockGraphs: [
              {
                id: "g1",
                type: "line",
                valueField: "value",
                lineThickness: 1,
                useDataSetColors: false,
                lineColor: "#00a928",
                connect: false,
                showBalloon: true,
                balloonText: "<b>[[value]]</b>",
              },
              {
                id: "g2",
                type: "line",
                valueField: "predLstm",
                lineThickness: 3,
                useDataSetColors: false,
                // "lineColor": "#00a928",
                showBalloon: true,
                balloonText: "<b>[[predLstm]]</b>",
                comparable: true,
                compareField: "predLstm",
              },
              {
                id: "g3",
                type: "line",
                valueField: "predMass",
                lineThickness: 3,
                useDataSetColors: false,
                // "lineColor": "#00a928",
                showBalloon: true,
                balloonText: "<b>[[predMass]]</b>",
                comparable: true,
                compareField: "predMass",
              },
            ],

            stockLegend: {
              valueTextRegular: undefined,
              periodValueTextComparing: "[[percents.value.close]]%",
            },
          },
        ],
        chartScrollbarSettings: {
          graph: "g1",
          graphType: "line",
          usePeriod: "hh",
        },
        chartCursorSettings: {
          valueBalloonsEnabled: true,
          valueLineBalloonEnabled: true,
          valueLineEnabled: true,
        },
        legendSettings: {
          useMarkerColorForLabels: true,
        },
      });
    },
  },
};
</script>
