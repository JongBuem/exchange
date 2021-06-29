"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Market_1 = require("./container/Market");
var Candle_1 = require("./container/Candle");
var request = require("request");
function setMarketData(market, v) {
  market.tradeTime = new Date(v["trade_timestamp"]);
  market.price = v["trade_price"];
  market.open = v["opening_price"];
  market.high = v["high_price"];
  market.low = v["low_price"];
  market.prevClose = v["prev_closing_price"];
  market.change = v["change"];
  market.changePrice = v["change_price"];
  market.changeRate = v["change_rate"];
}
/**
 * Create new Market object arrays.
 * @param market example: ['KRW-BTC', 'KRW-XRP']
 */
function ticker(market) {
  return new Promise(function (resolve, reject) {
    var options = {
      method: "GET",
      url: "https://api.upbit.com/v1/ticker",
      qs: { markets: market.toString() },
    };
    request(options, function (error, response, body) {
      if (error) reject(error);
      else {
        var data_1 = [];
        body = JSON.parse(body.toString());
        body.forEach(function (v) {
          var market = new Market_1.default(
            v["market"].split("-")[0],
            v["market"].split("-")[1]
          );
          setMarketData(market, v);
          data_1.push(market);
        });
        resolve(data_1);
      }
    });
  });
}
/**
 * Updates object [market] every specified [time] time.
 * @param market An object or an Array<Market> to update
 * @param time update interval(ms)
 * @param {(error) => any} errorHandler
 * @param {(market) => any} callback called when updated, optional
 */
function autoMarketUpdate(market, time, errorHandler, callback) {
  var run = function (market) {
    return function () {
      var options = {
        method: "GET",
        url: "https://api.upbit.com/v1/ticker",
        qs: { markets: market.market + "-" + market.coin },
      };
      request(options, function (error, response, body) {
        if (error) errorHandler(error);
        else {
          body = JSON.parse(body.toString())[0];
          setMarketData(market, body);
          if (callback) callback(market);
        }
      });
    };
  };
  if (Array.isArray(market))
    market.forEach(function (v) {
      return run(v);
    });
  else run(market);
}
function setCandle(v, candle, type) {
  if (type === void 0) {
    type = 0;
  }
  candle.accTradePrice = v.candle_acc_trade_volume;
  candle.accTradePrice = v.candle_acc_trade_price;
  candle.price = v["trade_price"];
  candle.high = v["high_price"];
  candle.low = v["low_price"];
  candle.open = v["opening_price"];
  console.log(type);
  if (type === 0) setMinutesCandle(v, candle);
  if (type === 1) setDayCandle(v, candle);
  if (type === 2) setWeekMonthCandle(v, candle);
  return candle;
}
function setMinutesCandle(v, candle) {
  candle.unit = v.unit;
  return candle;
}
function setWeekMonthCandle(v, candle) {
  console.log(v);
  candle.firstDayOfPeriod = v.first_day_of_period;
  return candle;
}
function setDayCandle(v, candle) {
  candle.changePrice = v.change_price;
  candle.changeRate = v.change_rate;
  candle.convertedTradePrice = v.converted_trade_price;
  candle.prevClosingPrice = v.prev_closing_price;
  return candle;
}
/**
 * get minutes candles
 * @param market 'KRW-BTC' or ['KRW-BTC', 'KRW-XRP']
 * @param unit 1, 3, 5, 15, 10, 30, 60, 240
 * @param count count of candles
 * @param to yyyy-MM-dd'T'HH:mm:ssXXX
 */
function candlesMinutes(market, unit, count, to) {
  return new Promise(function (resolve, reject) {
    var options = {
      method: "GET",
      url: "https://api.upbit.com/v1/candles/minutes/" + unit,
      qs: {
        market: market.toString(),
      },
    };
    // @ts-ignore
    if (count) options.qs.count = count;
    // @ts-ignore
    if (to) options.qs.to = to;
    request(options, function (error, response, body) {
      if (error) reject(error);
      else
        resolve(
          JSON.parse(body.toString()).map(function (v) {
            return setCandle(
              v,
              new Candle_1.default(
                v["market"].split("-")[0],
                v["market"].split("-")[1]
              )
            );
          })
        );
    });
  });
}
exports.default = {
  ticker: ticker,
  autoMarketUpdate: autoMarketUpdate,
  candlesMinutes: candlesMinutes,
};
