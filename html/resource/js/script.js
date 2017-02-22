/***************************************

 [GAME - Great Dalmuti] script.js

***************************************/
var dalmutiUI = function (data) {
  // [ 선언 ]
  var gameStatus = data.dalmuti.gameStatus,
    uiStatus = $('#fWrap').attr('class'),
    myData = {
      id: data.server.my.sessionId,
      name: data.server.names[data.server.my.sessionId],
      cardList: data.dalmuti.mycard,
      elements:{
        wrap: $('#game #playerInfo'),
        name: $('#game #playerInfo .player_menu .my_info .name .val'),
        remain: $('#game #playerInfo .player_menu .my_info .remain_card .val'),
        msg: $('#game #playerInfo .player_menu .my_info .msg .val'),
        selected: $('#game #playerInfo .player_menu .my_info .select_card .val'),
        cardSet: $('#game #playerInfo .card_set'),
        cards: $('#game #playerInfo .card_set .card'),
        selectedCard: $('#game #playerInfo .card_set .selected')
      }
    },
    lobbyData = {
      num: data.server.readyLength,
      max: data.server.needUser,
      msg: data.dalmuti.msg,
      elements:{
        userWrap: $('#lobby #userInfo'),
        userList: $('#lobby #userInfo .user_list'),
        noticeWrap: $('#lobby #gameInfo .notice'),
        btnWrap: $('#lobby .btn_area'),
        btnStart: $('#lobby .btn_area .btn_start'),
        userNum: $('#lobby .user_num .now'),
        userMax: $('#lobby .user_num .max'),
        msg: $('#lobby .loading .msg')
      }
    },
    userData = {
      info: data.dalmuti.users,
      list: data.server.names,
      turnUser: data.dalmuti.turnUser,
      turnNum: data.dalmuti.turn,
      lastUser: data.dalmuti.kingUser,
      winner: data.dalmuti.winner,
      num: data.server.readyLength,
      max: data.server.needUser,
      msg: data.dalmuti.msg,
      master: data.server.master,
      elements: {
        gameWrap: $('#game #userList'),
        turnNow: $('#game #cardSlot .game_data .turn .now'),
        turnMax: $('#game #cardSlot .game_data .turn .max'),
        turnUser: $('#game #cardSlot .game_data .turn_user .val'),
        lastUser: $('#game #cardSlot .game_data .last_user .val'),
        ranking: $('#result .ranking ul')
      }
    },
    slotData = {
      grade: data.dalmuti.floorCard.grade,
      count: data.dalmuti.floorCard.count,
      isAnything: data.dalmuti.floorCard.isAnything,
      elements: {
        wrap: $('#game #cardSlot .card_data'),
        card: $('#game #cardSlot .card_data .card'),
        count: $('#game #cardSlot .count .val')
      }
    };

  this.layoutSet = {
    msg: function(str) {
      // 메시지 출력(공통)
      var msg = ( str === undefined ) ? data.userData.msg : str;

      if ( gameStatus == 0 ) {
        // lobby msg
        $(lobbyData.elements.msg).html(str);

      }else if( gameStatus == 1){
        // game msg
        $(myData.elements.msg).html(str);
      }
    },
    chat: function(data){
      var name = data.userName,
        msg = data.chatMsg,
        isPlayer = ( name === myData.name ) ? 'player' : '';
      console.log(myData.name)
      var chatEle = '<div class="'+isPlayer+'"><span class="name">'+name+'</span><span class="msg">'+msg+'</span></div>';
      $('.chat .msg_area').append(chatEle);
    },
    lobbySet: function() {
      // 로비 셋팅
      $( lobbyData.elements.userList ).empty();
      for (var key in userData.info){
        var userName = userData.list[key],
          userId = key,
          isPlayer = ( myData.id === key ) ? 'player' : '',
          listEle = '<div class="'+isPlayer+'" data-id="'+userId+'"><span class="bu"></span><span class="name">'+userName+'</span></div>';
        $(lobbyData.elements.userList).append(listEle);
      };

      // userNum
      $(lobbyData.elements.userNum).text(userData.num);
      $(lobbyData.elements.userMax).text(userData.max);
      // check master
      if ( userData.master === myData.id ) $('#fWrap').attr('data-user', 'master');
      // btnActive
      if ( userData.num == userData.max ) {
        $(lobbyData.elements.btnStart).addClass('ready');
      }
      // 닉네임 입력
      $('#lobby .inp_user .btn_nick').on('click', function(){
        if ( userData.list[myData.id] !== undefined ){
          $('#lobby .inp_user').hide();
        }
      });

    },
    tableSet: function(){
      // 게임 초기시작
      var playerCardEle = $('#contents #game #playerInfo .card_set'),
        playerCardList = data.dalmuti.mycard,
        flipIdx = 0,
        flipAni = function (idx) {
        var isLastCard = (idx - 1 == $(playerCardList).length) ? true : false;
        setTimeout(function(){
          if ( !isLastCard ) {
            $(playerCardEle).children('.card').eq(idx).toggleClass('flip');
            flipIdx++;
            flipAni(flipIdx);
          }else{
            $(playerCardEle).children('.card').on('click', function(){
              var currentCard = $(playerCardEle).find('.selected'),
                currentNum = ( currentCard.length > 0 ) ? $(currentCard).eq(0).find('.num').text() : null,
                selectNum = $(this).find('.num').text();

              if ( currentNum == null || currentNum == selectNum ){
                $(this).toggleClass('selected');
              }else{
                layoutSet.msg('선택한 카드와 다른 카드입니다.');
              }
              $(myData.elements.selected).text($(playerCardEle).find('.selected').length);
            });
            return false
          }
        }, 300)
      };

      // hide lobby
      $('#fWrap').addClass('hide_lobby');

      // add user data
      for (var key in userData.info) {
        var remainCard = userData.list[key].length,
          userName = userData.list[key],
          startUser = ( key === userData.turnUser ) ? 'turn' : '',
          target = $('#userList ul'),
          isPlayer = ( myData.id === key ) ? 'player' : '',
          userEle = '<li class="' + isPlayer + ' ' + startUser + '" data-id="' + key + '">' +
            '<div class="wrap_list">' +
            '<span class="icons"><span class="icon_lead"></span><span class="icon_player"></span><span class="icon_rank"></span></span>' +
            '<span class="name">' + userName + '</span>' +
            '<span class="remain_card"><span class="val">' + remainCard + '</span></span>' +
            '</div>' +
            '</li>';
        $(target).append(userEle);
      }

      // add game data
      (function(){
        var turnUser = data.server.names[userData.turnUser],
          lastUser = data.server.names[userData.lastUser];

        // turnNum
        $(userData.elements.turnNow).text(userData.turnNum);
        $(userData.elements.turnMax).text(userData.max);
        $(userData.elements.turnUser).text(turnUser);
        $(userData.elements.lastUser).text(lastUser);
      })();


      // player data
      var remainCard = Object.keys(myData.cardList).length;
      $(myData.elements.remain).text(remainCard);
      $(myData.elements.name).text(myData.name);

      // addCard
      $(playerCardList).each(function(idx, cardData){
        var cardId = cardData.id,
          cardGrade = cardData.grade,
          cardEle = '<div class="card type'+cardGrade+'" data-id="'+cardId+'"><div class="wrap_card"><span class="front"></span><span class="back"><span class="num">'+cardGrade+'</span></span></div></div>';
        $('#playerInfo .card_set').append(cardEle);
      });

      // card flip ani
      setTimeout(function(){
        $('#fWrap').attr('class', 'status-game');
        setTimeout(function(){
          flipAni(flipIdx);
        }, 1400)
      }, 1400);

    },
    playSet: function() {
      // 게임 중
      // send animation
      (function(){
        $(myData.elements.selectedCard).addClass('send');
        setTimeout(function(){
          $(myData.elements.selectedCard).remove();
        }, 500);
      })();

      // cardSlot set
      (function(){
        $(slotData.elements.card).removeClass('flip');
        $(slotData.elements.count).addClass('hide');
        setTimeout(function(){
          $(slotData.elements.card).attr('class', 'card flip type'+slotData.grade+'');
          $(slotData.elements.count).removeClass('hide').text(slotData.count);
        }, 500);
      })();

      // game data set
      (function(){
        var turnUser = data.server.names[userData.turnUser],
          lastUser = data.server.names[userData.lastUser];

        // turnNum
        $(userData.elements.turnNow).text(userData.turnNum);
        $(userData.elements.turnUser).text(turnUser);
        $(userData.elements.lastUser).text(lastUser);
      })();

      // user data set
      (function(){
        var eleList = $(userData.elements.gameWrap),
          leadUser = $(eleList).find('li[data-id='+userData.lastUser+']'),
          turnUser =  $(eleList).find('li[data-id='+userData.turnUser+']');

        // userList Set
        $(eleList).removeClass('turn lead');
        $(leadUser).addClass('lead');
        $(turnUser).addClass('turn');

        if ( userData.winner.length > 0 ){
          $(userData.winner).each(function (idx, id){
            var strRank = 'rank'+(idx+1);
            $(eleList).find('li[data-id='+id+']').addClass(strRank);
          });
        }

        // check myTurn
        if ( myData.id == userData.turn) {
          $(myData.elements.wrap).addClass('turn');
          layoutSet.msg('당신의 턴 입니다.');
        }else{
          $(myData.elements.wrap).removeClass('turn');
          layoutSet.msg('');
        }
      })();

      // playerInfo set
      (function(){
        var remainCard = Object.keys(myData.cardList).length;

        $(myData.elements.selected).text(0);
        $(myData.elements.remain).text(remainCard);
      })();
    },
    resultSet: function() {
      $('#fWrap').attr('class', 'status-result');
      $(userData.winner).each(function(idx, key){
        var targetEle = $(userData.elements.ranking),
          rank = '<span class="rank">'+idx+'위</span>',
          userName = '<span class="name">'+userData.list[key]+'</span>';

        $(targetEle).append('<li>'+rank+userName+'</li>');
      })
    }
  };

  // [ 실행 ]
  if ( gameStatus == 0 && uiStatus == 'status-lobby') {
    // 로비
    return this.layoutSet.lobbySet();
  }else if ( gameStatus == 1 ) {
    // 게임 시작
    if ( uiStatus == 'status-lobby' ) {
      // 게임 초기시작(테이블 셋팅)
      return this.layoutSet.tableSet();
    }else if ( uiStatus == 'status-game' ) {
      // 게임 중
      return this.layoutSet.playSet();
      /*
       [게임 중 변경되는 UI]
       차례(유저, 플레이어)
       남은 카드 수(유저)
       내야할 카드와 장수
       */
    }
  }else if ( gameStatus == 2 ) {
    // 게임 종료
    return this.layoutSet.resultSet();
  }

}
