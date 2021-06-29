const request = require("request");
const { v4: uuidv4 } = require("uuid"); //npm install uuidv4 --save
const sign = require("jsonwebtoken").sign;
const crypto = require("crypto");
const queryEncode = require("querystring").encode;

const access_key = "JongBuem";
const secret_key = "EmatEdJas9sHG0+CvEVaVpVL8ZfMTu3E3XAuWM5rR3I=";
const server_url = "http://ubuntu.securekim.com";

async function getBalance() {
  const payload = {
    access_key: access_key,
    nonce: uuidv4(),
  };
  const token = sign(payload, secret_key);
  const options = {
    method: "GET",
    url: server_url + "/v1/accounts",
    headers: { Authorization: `Bearer ${token}` },
  };
  return new Promise(function (resolve, reject) {
    request(options, (error, response, body) => {
      // console.log(body); //모든정보 다출력해서 주석처리해버림
      if (error) reject();
      console.log(response.statusCode);
      resolve(body);
    });
  });
}

//얼마너치살건지
async function API_buyImmediate(market, price) {
  const body = {
    market: market,
    side: "bid",
    volume: null,
    price: price.toString(),
    ord_type: "price",
  };
  const query = queryEncode(body);
  const hash = crypto.createHash("sha512");
  const queryHash = hash.update(query, "utf-8").digest("hex");
  const payload = {
    access_key: access_key,
    nonce: uuidv4(),
    query_hash: queryHash,
    query_hash_alg: "SHA512",
  };
  const token = sign(payload, secret_key);
  const options = {
    method: "POST",
    url: server_url + "/v1/orders",
    headers: { Authorization: `Bearer ${token}` },
    json: body,
  };
  return new Promise(function (resolve, reject) {
    request(options, (error, response, body) => {
      if (error) reject();
      console.log(response.statusCode);
      resolve(body);
      console.log(market, "매수");
    });
  });
}

//몇개팔건지
async function API_sellImmediate(market, volume) {
  const body = {
    market: market,
    side: "ask",
    volume: volume.toString(),
    price: null,
    ord_type: "market",
  };
  const query = queryEncode(body);
  const hash = crypto.createHash("sha512");
  const queryHash = hash.update(query, "utf-8").digest("hex");
  const payload = {
    access_key: access_key,
    nonce: uuidv4(),
    query_hash: queryHash,
    query_hash_alg: "SHA512",
  };
  const token = sign(payload, secret_key);
  const options = {
    method: "POST",
    url: server_url + "/v1/orders",
    headers: { Authorization: `Bearer ${token}` },
    json: body,
  };
  return new Promise(function (resolve, reject) {
    request(options, (error, response, body) => {
      if (error) reject();
      console.log(response.statusCode);
      resolve(body);
      console.log(market, "매도");
    });
  });
}

var index_1 = require("./upbit-api/index");
const config = require("./config/config.json");
const MARKETS = config.markets;
const tax = 0.0005; //세금 0.05%
var volume = {}; //코인들의 매수당시 시세

//변동성 돌파 전략 은 일일단위로 정한기준 이상을 넘어서는 상승추세에 올라타 일단위로 수익을 실현
// ??하루 단위로?? 못참지
function market_price() {
  for (i in MARKETS) {
    index_1.default
      .candlesMinutes(MARKETS[i], 15) //30분 봉 (1, 3, 5, 15, 10, 30, 60, 240)
      .then(function (tradeList) {
        return tradeList.forEach(function (candle) {
          coin = Object.keys(candle).map((i) => {
            return [String(i), candle[i]];
          });
          var coin_name = coin[1][1]; //코인이름
          var coin_price = coin[3][1]; //코인 현재가격
          var coin_high = coin[4][1]; //코인 하이
          var coin_low = coin[5][1]; //코인 로우
          var coin_end = coin[6][1]; //전캔들 종가
          // console.log(candle);
          // console.log(coin_name, coin_price, coin_high, coin_low, coin_end);
          sellorbuy(coin_name, coin_price, coin_high, coin_low, coin_end);
        });
      })
      .catch(function (err) {
        return console.log(err);
      });
  }
}

async function sellorbuy(coin_name, coin_price, coin_high, coin_low, coin_end) {
  try {
    var count = 0;
    var _balance = await getBalance(); //나의지갑
    _balance = JSON.parse(_balance);
    for (let i = 0; i < _balance.length; i++) {
      if (coin_name == _balance[i].currency) {
        count = i;
      }
    }
    // 공식
    // 전날 고가 -저가 = range
    // 매수기준 = 당일 시작가+range *k -> k는 변동비율 보통 0.5를 많이사용
    // 실시간 가격이 매수기준을 돌파하면 매수
    // 다음날 시가에 매도
    var range = coin_high - coin_low; //고점 -저점
    var buy = range * 0.5 + coin_end; // 매수 기준점
    buy = buy - coin_price * tax; //매수하고 싶은가격 (수수료포함)
    // 캔들
    var end_high = coin_end + coin_end * 0.2; // 전 캔들보다 2%상승 가격
    var end_low = coin_end - coin_end * 0.2; // 전 캔들보다 2%하락 가격
    var coin_pric_ = coin_price - coin_price * tax; //매수시 현재 가격
    //
    var KRW_balance = _balance[0].balance; // 나의잔고
    var _balance_volume = _balance[count].balance; //나의지갑의 코인 갯수

    // 매수
    // 현재코인 매수가격이 적절할때
    // 전 캔들보다 중 상향가능성이 있다
    if (coin_pric_ >= buy && coin_pric_ > end_high) {
      // 최소의 종자돈 보호
      if (KRW_balance >= 500000) {
        body = await API_buyImmediate("KRW-" + coin_name, KRW_balance / 20); //매수(코인이름, 매수가격)
        if (typeof volume[coin_name] == "undefined") {
          volume[coin_name] = coin_pric_; //매수한 코인 시세
        } else {
          volume[coin_name] = coin_pric_; //매수한 코인 시세
        }
      }
    }
    var start_money = volume[coin_name]; //매수당시 시세
    var start_up = volume[coin_name] * 0.4; // 매수가격의 4%
    var low_money = coin_pric_ - coin_pric_ * 0.2; // 2%하락한 가격
    //매도
    // 시작금액이 현재시장가보다 2%떨어지면
    // 매수가에 4%상승시
    if (start_money < low_money || start_money + start_up) {
      //지갑에 돈이 있어야 매도
      if (KRW_balance > 0) {
        body = await API_sellImmediate("KRW-" + coin_name, _balance_volume); // 가진것의 모든것을 매도
        if (typeof volume[coin_name] == "undefined") {
          volume[coin_name] = 0;
        } else {
          volume[coin_name] = 0;
        }
      }
    }
    // 전 캔들보다 0.2%하락 중이면 하양가능성이 포착
    else if (coin_pric_ < end_low) {
      if (KRW_balance > 0) {
        body = await API_sellImmediate("KRW-" + coin_name, _balance_volume / 5); // 가진것의 조금만 팔아보자
        // if (typeof volume[coin_name] == "undefined") {
        //   volume[coin_name] = ?
        // } else {
        //   volume[coin_name] = ?
        // }
      }
    }
  } catch (err) {
    console.log(err);
  }
}

async function main() {
  var _balance = await getBalance(); //나의지갑
  _balance = JSON.parse(_balance);
  for (i = 1; i < _balance.length; i++) {
    volume[_balance[i].currency] = _balance[i].balance;
  }
  setInterval(async () => {
    market_price();
    // var _balance = await getBalance(); //나의지갑
    // console.log(_balance);
    // console.log(volume);
  }, 10000);
}
main();
