"use strict";
var index_1 = require("../index");
index_1.default.ticker(["KRW-BTC"]).then(function (v) {
  var KRWBTC = v[0];
  console.log(KRWBTC);
  index_1.default.autoMarketUpdate(
    KRWBTC,
    5000,
    function (e) {
      return console.error(e);
    },
    function (market) {
      return console.log(market);
    }
  );
});

index_1.default
  .candlesMinutes("KRW-XRP", 30)
  .then(function (tradeList) {
    return tradeList.forEach(function (candle) {
      return console.log(candle);
    });
  })
  .catch(function (err) {
    return console.log(err);
  });
