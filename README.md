# :art: 자동매매 :art:

## **목차**

- [주요기능](#1-주요기능)
- [코드리뷰](#2-코드리뷰)
- [개선방안](#3-개선방안)

---

## **1. 주요기능**

- upbit 시세 가져오기
- 변동성 돌파 전략
- 캔들을 이용한 매도 매수
- 구매시세와 판매시세

---

## **2. 코드리뷰**

<br>

## 변동성 돌파 전략이란?<br>

변동성 돌파 전략 은 일일단위로 정한기준 이상을 넘어서는 상승추세에 올라타 일단위로 수익을 실현

## 2-1. upbit api 이용하여 시세 가져오기

```js
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
        }); // 알고리즘
      })
      .catch(function (err) {
        return console.log(err);
      });
  }
}
```

<br>

## 2-2. 변동성 돌파 전략

> 전날 고가 -저가 = range<br>
> 매수기준 = 당일 시작가+range \*k -> k는 변동비율 보통 0.5를 많이사용<br>
> 실시간 가격이 매수기준을 돌파하면 매수<br>
> 다음날 시가에 매도<br>

```js
// 공식
// 전날 고가 -저가 = range
// 매수기준 = 당일 시작가+range *k -> k는 변동비율 보통 0.5를 많이사용
// 실시간 가격이 매수기준을 돌파하면 매수
// 다음날 시가에 매도
var range = coin_high - coin_low; //고점 -저점
var buy = range * 0.5 + coin_end; // 매수 기준점
buy = buy - coin_price * tax; //매수하고 싶은가격 (수수료포함)
```

<br>

## 2-3. 캔들 이용

> 하단의 범위 설정 이벤트 값을 이용하여 그림판(**canvas**) 크기를 변경<br> 사이즈 메뉴에서 선의 굵기 이미지 또는 범위설정 이벤트를 이용하여 **ctx.lineWidth**의 크기를 변경<br>색상 메뉴에서 해당하는 색상을 선택하게 되면 **strokeStyle,fillStyle**의 색상 값을 변경<br>

```js
// 캔들
var end_high = coin_end + coin_end * 0.2; // 전 캔들보다 2%상승 가격
var end_low = coin_end - coin_end * 0.2; // 전 캔들보다 2%하락 가격
var coin_pric_ = coin_price - coin_price * tax; //매수시 현재 가격
```

<br>

## 2-4. 구매시세와 판매시세에 따른 매도 매수

> **new FileReader()** 함수와 **readAsDataURL()** 을 이용하여 **파일을 URL**형태로 읽어옴 <br> 읽어온 파일의 URL 주소를 **img.src**를 통해 이미지 주소로 가리킴

```js
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
    var range = coin_high - coin_low; //고점 -저점
    var buy = range * 0.5 + coin_end; // 매수 기준점
    buy = buy - coin_price * tax; //매수하고 싶은가격 (수수료포함)
    var end_high = coin_end + coin_end * 0.2; // 전 캔들보다 2%상승 가격
    var end_low = coin_end - coin_end * 0.2; // 전 캔들보다 2%하락 가격
    var coin_pric_ = coin_price - coin_price * tax; //매수시 현재 가격
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
```

## **3. 개선방안**

- 너무 빠른 변동에 매도 매수를 무한 반복
- 판매 하였을때 이익율
- 얼만큼 판매하여야 이익이 클지

---
