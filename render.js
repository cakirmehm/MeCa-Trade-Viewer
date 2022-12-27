var symbolsUSDT = [];
var symbolsBTC = [];

var priceCandles = [];
var volumes = [];
var burl = "https://api.binance.com";
var selectedSymbol = "BTCUSDT";
var selectedInterval = "1m";
var axisXTickCount = 2;

var main = document.getElementById("main");
var tableCandles = document.getElementById("candles");
var matrixTable = document.getElementById("matrix");
var symbolPairElem = document.getElementById("symbolPair");

class Ohlc {
  constructor(OpenTime, Open, High, Low, Close, Volume) {
    this.OpenTime = OpenTime;
    this.Open = Open;
    this.High = High;
    this.Low = Low;
    this.Close = Close;
    this.Volume = Volume;
  }

  ToTableRow() {
    return (
      "<tr><td>" +
      this.OpenTime +
      "</td><td>" +
      this.Open +
      "</td><td>" +
      this.High +
      "</td><td>" +
      this.Low +
      "</td><td>" +
      this.Close +
      "</td><td>" +
      this.Volume +
      "</td></tr>"
    );
  }
}

// Interval : 1m 3m 5m 15m 30m 1h 2h 4h 6h 8h 12h 1d 3d 1w 1M

function init() {
  var url = getCandles("BTCUSDT", "1m", 60);
  tableCandles = document.getElementById("candles");
  //var url = getBestPriceOnOrderBook("ETHUSDT");
  //var url = getQueryDepthURL("ETHUSDT", 50);
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.onload = function () {
    //console.log(request.responseText);
    //main.innerHTML = request.responseText;
    fillDataPoints(request.responseText);
    drawPriceChart(
      selectedSymbol + " " + selectedInterval,
      priceCandles,
      volumes
    );

    if (tableCandles != null)
      tableCandles.innerHTML = createCandleTable(request.responseText);

    //main.innerHTML += tableCandles;
  };
  request.send();
}

function fillDataPoints(responseText) {
  var ob = JSON.parse(responseText);
  var len = ob.length;
  var minPrice = 99999999;
  var maxVolume = 0;

  priceCandles = [];
  volumes = [];

  for (var i = 0; i < len; i++) {
    var dateTime = new Date(ob[i][0]);
    var dateTimeAsString = dateTime.customFormat(
      "#DD#.#MM#.#YYYY# #hh#:#mm#:#ss#"
    );

    var dArr = {
      x: dateTime,
      y: [
        parseFloat(ob[i][1]),
        parseFloat(ob[i][2]),
        parseFloat(ob[i][3]),
        parseFloat(ob[i][4]),
      ],
    };
    var vArr = { x: dateTime, y: parseFloat(ob[i][5]), color: "green" };

    priceCandles.push(dArr);
    volumes.push(vArr);

    if (parseFloat(ob[i][4]) < minPrice) minPrice = parseFloat(ob[i][4]);

    if (parseFloat(ob[i][5]) > maxVolume) maxVolume = parseFloat(ob[i][5]);
  }

  for (var i = 0; i < len; i++) {
    if (priceCandles[i].y[0] > priceCandles[i].y[3]) volumes[i].color = "red";
  }
}

function createCandleTable(responseText) {
  var ob = JSON.parse(responseText);
  var len = ob.length;
  var iHtml =
    "<th>Time</th><th>Open</th><th>High</th><th>Low</th><th>Close</th><th>Volume</th>";

  for (var i = 0; i < len; i++) {
    var dateTime = new Date(ob[i][0]);
    var dateTimeAsString = dateTime.customFormat(
      "#DD#.#MM#.#YYYY# #hh#:#mm#:#ss#"
    );
    let ohlc = new Ohlc(
      dateTimeAsString,
      ob[i][1],
      ob[i][2],
      ob[i][3],
      ob[i][4],
      ob[i][5]
    );

    iHtml += ohlc.ToTableRow();
  }

  return iHtml;
}

function createTableMatrix() {
  var url = getSymbolTickers();
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.onload = function () {
    initSymbols(request.responseText);

    matrixTable.innerHTML += createTableMatrixHTML();
    matrixTable.style.display = "block";
  };
  request.send();
}

function initSymbols(responseText) {
  symbolsUSDT = [];
  symbolsBTC = [];
  var oAll = JSON.parse(responseText);
  for (var i = 0; i < oAll.length; i++) {
    var symPair = oAll[i].symbol;
    var regUSDT = new RegExp(".+USDT$");
    var regBTC = new RegExp(".+BTC$");

    if (symPair.match(regUSDT)) symbolsUSDT.push(symPair);
    else if (symPair.match(regBTC)) symbolsBTC.push(symPair);
  }
}

function createTableMatrixHTML() {
  var retHtml =
    "<tr><th>SYMBOL</th><th>Current</th><th>15m</th><th>1h</th><th>4h</th><th>1d</th><th>1w</th><th>1M</th></tr>";

  var rsiArr = [0, 5, 24, 29, 31, 71];

  for (var i = 0; i < symbolsUSDT.length; i++) {
    var sym = symbolsUSDT[i];
    var symPrice = 0; //getCurrentPrice(sym);

    retHtml += "<tr><td>" + sym + "</td>";
    retHtml += "<td>" + symPrice + "</td>";
    for (var j = 0; j < 6; j++) {
      retHtml += "<td>" + rsiArr[j] + "</td>";
    }
    retHtml += "</tr>";
  }

  return retHtml;
}

function getCurrentPrice(sym) {
  var retVal = "";
  var url = getSymbolTicker(sym);
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.onload = function () {
    var ob = JSON.parse(request.responseText);
    return ob.price;
  };
  request.send();
  return retVal;
}

function drawCandles() {
  tableCandles = document.getElementById("candles");
  symbolPairElem = document.getElementById("symbolPair");

  selectedSymbol = symbolPairElem != null ? symbolPairElem.value : "BTCUSDT";

  var url = getCandles(selectedSymbol, selectedInterval, 60);
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.onload = function () {
    fillDataPoints(request.responseText);
    drawPriceChart(
      selectedSymbol + " " + selectedInterval,
      priceCandles,
      volumes
    );

    //createTableMatrix();
    if (tableCandles != null)
      tableCandles.innerHTML = createCandleTable(request.responseText);
  };
  request.send();
}

function drawPriceChart(title, candles, volumes) {
  var chart = new CanvasJS.Chart("chartContainer", {
    interactivityEnabled: true,
    title: {
      text: title,
    },
    zoomEnabled: true,
    axisY: {
      includeZero: false,
      title: "Prices",
      prefix: "$ ",
      labelFontSize: 12,
      labelFontFamily: "tahoma",
      labelMinWidth: 100,
      labelTextAlign: "center",
    },
    axisX: {
      interval: axisXTickCount,
      intervalType: "minute",
      valueFormatString: "YYYY-MM-DD HH:mm",
      labelAngle: -45,
      labelFontSize: 12,
      labelFontFamily: "tahoma",
      gridThickness: 1,
      gridColor: "lightgray",
    },
    axisY2: {
      title: "Volume",
      labelFontSize: 12,
      labelFontFamily: "tahoma",
    },
    data: [
      {
        type: "candlestick",
        //fillOpacity: .3,
        color: "brown",
        risingColor: "lime",

        dataPoints: candles,
      },
      {
        type: "column",
        showInLegend: true,
        axisYType: "secondary",
        //bevelEnabled: true,
        fillOpacity: 0.3,
        color: "brown",
        risingColor: "lime",
        dataPoints: volumes,
      },
    ],
  });
  chart.render();
}

function intervalChanged(temp) {
  selectedInterval = temp;

  if (selectedInterval == "1m") axisXTickCount = 2;
  else if (selectedInterval == "5m") axisXTickCount = 5;
  else if (selectedInterval == "15m") axisXTickCount = 15;
  else if (selectedInterval == "1h") axisXTickCount = 60;
  else if (selectedInterval == "4h") axisXTickCount = 240;
  else if (selectedInterval == "1d") axisXTickCount = 1440;
  else if (selectedInterval == "3d") axisXTickCount = 4320;
  else if (selectedInterval == "1w") axisXTickCount = 30240;
  else if (selectedInterval == "1M") axisXTickCount = 120960;
}

Date.prototype.customFormat = function (formatString) {
  var YYYY,
    YY,
    MMMM,
    MMM,
    MM,
    M,
    DDDD,
    DDD,
    DD,
    D,
    hhhh,
    hhh,
    hh,
    h,
    mm,
    m,
    ss,
    s,
    ampm,
    AMPM,
    dMod,
    th;
  var dateObject = this;
  YY = ((YYYY = dateObject.getFullYear()) + "").slice(-2);
  MM = (M = dateObject.getMonth() + 1) < 10 ? "0" + M : M;
  MMM = (MMMM = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ][M - 1]).substring(0, 3);
  DD = (D = dateObject.getDate()) < 10 ? "0" + D : D;
  DDD = (DDDD = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][dateObject.getDay()]).substring(0, 3);
  th =
    D >= 10 && D <= 20
      ? "th"
      : (dMod = D % 10) == 1
      ? "st"
      : dMod == 2
      ? "nd"
      : dMod == 3
      ? "rd"
      : "th";
  formatString = formatString
    .replace("#YYYY#", YYYY)
    .replace("#YY#", YY)
    .replace("#MMMM#", MMMM)
    .replace("#MMM#", MMM)
    .replace("#MM#", MM)
    .replace("#M#", M)
    .replace("#DDDD#", DDDD)
    .replace("#DDD#", DDD)
    .replace("#DD#", DD)
    .replace("#D#", D)
    .replace("#th#", th);

  h = hhh = dateObject.getHours();
  if (h == 0) h = 24;
  if (h > 12) h -= 12;
  hh = h < 10 ? "0" + h : h;
  hhhh = hhh < 10 ? "0" + hhh : hhh;
  AMPM = (ampm = hhh < 12 ? "am" : "pm").toUpperCase();
  mm = (m = dateObject.getMinutes()) < 10 ? "0" + m : m;
  ss = (s = dateObject.getSeconds()) < 10 ? "0" + s : s;
  return formatString
    .replace("#hhhh#", hhhh)
    .replace("#hhh#", hhh)
    .replace("#hh#", hh)
    .replace("#h#", h)
    .replace("#mm#", mm)
    .replace("#m#", m)
    .replace("#ss#", ss)
    .replace("#s#", s)
    .replace("#ampm#", ampm)
    .replace("#AMPM#", AMPM);
};

// Kline/candlestick bars for a symbol.
/* getCandles
[
  [
    1499040000000,      // Open time
    "0.01634790",       // Open
    "0.80000000",       // High
    "0.01575800",       // Low
    "0.01577100",       // Close
    "148976.11427815",  // Volume
    1499644799999,      // Close time
    "2434.19055334",    // Quote asset volume
    308,                // Number of trades
    "1756.87402397",    // Taker buy base asset volume
    "28.46694368",      // Taker buy quote asset volume
    "17928899.62484339" // Ignore.
  ]
]
*/
function getCandles(symbol, interval) {
  return (
    burl + "/api/v3/klines" + "?symbol=" + symbol + "&interval=" + interval
  );
}

/**
 *
 * @param {Symbol} symbol
 * @param {15m|1h|4h|2d|1w|1m...} interval
 * @param {*} startTime
 * @param {*} endTime
 * @returns
 */
function getCandles(symbol, interval, startTime, endTime) {
  return (
    burl +
    "/api/v3/klines" +
    "?symbol=" +
    symbol +
    "&interval=" +
    interval +
    "&startTime=" +
    startTime +
    "&endTime=" +
    endTime
  );
}

function getCandles(symbol, interval, limit) {
  return (
    burl +
    "/api/v3/klines" +
    "?symbol=" +
    symbol +
    "&interval=" +
    interval +
    "&limit=" +
    limit
  );
}

// Current average price for a symbol.
function getAvgPrice(symbol) {
  return burl + "/api/v3/avgPrice" + "?symbol=" + symbol;
}

// 24 hour rolling window price change statistics.
/*
{
  "symbol": "BNBBTC",
  "priceChange": "-94.99999800",
  "priceChangePercent": "-95.960",
  "weightedAvgPrice": "0.29628482",
  "prevClosePrice": "0.10002000",
  "lastPrice": "4.00000200",
  "lastQty": "200.00000000",
  "bidPrice": "4.00000000",
  "bidQty": "100.00000000",
  "askPrice": "4.00000200",
  "askQty": "100.00000000",
  "openPrice": "99.00000000",
  "highPrice": "100.00000000",
  "lowPrice": "0.10000000",
  "volume": "8913.30000000",
  "quoteVolume": "15.30000000",
  "openTime": 1499783499040,
  "closeTime": 1499869899040,
  "firstId": 28385,   // First tradeId
  "lastId": 28460,    // Last tradeId
  "count": 76         // Trade count
}
*/
function get24hPriceChange(symbol) {
  return burl + "/api/v3/ticker/24hr" + "?symbol=" + symbol;
}

// Latest price for a symbol.
/*
{
  "symbol": "LTCBTC",
  "price": "4.00000200"
}
*/
function getSymbolTicker(symbol) {
  return burl + "/api/v3/ticker/price" + "?symbol=" + symbol;
}

// Latest price for symbols.
/*
{
  "symbol": "...",
  "price": "4.00000200"
}
{
  "symbol": "...",
  "price": "1.923"
}
...
*/
function getSymbolTickers() {
  return burl + "/api/v3/ticker/price";
}

// Best price/qty on the order book for a symbol or symbols.
/*
{
  "symbol": "LTCBTC",
  "bidPrice": "4.00000000",
  "bidQty": "431.00000000",
  "askPrice": "4.00000200",
  "askQty": "9.00000000"
}
*/
function getBestPriceOnOrderBook(symbol) {
  return burl + "/api/v3/ticker/bookTicker" + "?symbol=" + symbol;
}

/*
{
  "lastUpdateId": 1027024,
  "bids": [
    [
      "4.00000000",     // PRICE
      "431.00000000"    // QTY
    ]
  ],
  "asks": [
    [
      "4.00000200",
      "12.00000000"
    ]
  ]
}
*/
function getQueryDepthURL(symbol, limit) {
  return burl + "/api/v3/depth" + "?symbol=" + symbol + "&limit=" + limit;
}
