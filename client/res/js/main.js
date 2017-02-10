(function(){
  "use strict";

  var dalmuti = window.dalmuti = {
    ws: null,
    wsUrl: 'ws://de-php-api.fttinc.kr:51999',
    cardUp: [] 
  };

  var divConnect = $( '#d_connect' )
    , uConnectUser = $( '#u_connect_user' )
    , divGame = $( '#d_game' );

  var BODY = $( 'body' ) 
    , CONNECT = $( '#d_connect' ) 
    , GAME = $( '#d_game' ) 
    , RESULT = $( '#d_result' ).find( 'pre' )
    , USERS = $( '#d_users' ).find( 'pre' )
    , WINNER = $( '#d_winner' ).find( 'pre' )
    , FLOOR = $( '#d_floor' )
    , MY = $( '#d_my' )
    , CHAT = $( '#d_chat' )
    , DIV_CHAT_MSG = CHAT.find( '#d_msg' )
    , IN_NAME = $( '#i_name' )
    , IN_NEED_USER = $( '#i_need_user' )
    , IN_CHAT_MSG = $( '#i_chat_msg' )
    , BTN_NEED_USER = $( '#btn_need_user' )
    , BTN_NEW = $( '#btn_new' )
    , BTN_START = $( '#btn_start' );

  var wsFunc = {
    wsConnect: function(){
      var ws = window.dalmuti.ws = new WebSocket( dalmuti.wsUrl );

      ws.onopen = function(){
        console.info( 'ws server open.' );
        wsFunc.sendMsg({ step: 0 });
      };

      ws.onmessage = function( evt ){
        var data = JSON.parse( evt.data );
        console.clear();
        console.log( data );

        if( data.chatMsg ){
          IN_CHAT_MSG.val( '' );

          if( data.userName == data.server.names[ data.server.my.sessionId ] )
            DIV_CHAT_MSG.append( '&nbsp;<small class="float-right text-red">'+ data.chatMsg + '&nbsp;</small><br />' );
          else
            DIV_CHAT_MSG.append( '&nbsp;<small><b>' + data.userName + '</b> : ' + data.chatMsg + '</small><br />' );

          DIV_CHAT_MSG.scrollTop( DIV_CHAT_MSG.prop( 'scrollHeight' ) );
          return;
        }

        if( data.isDeny ){
          alert( data.dalmuti.msg );
          return;
        }

        if( data.isRefresh )
          location.reload();

        func.show( data );
      };

      ws.onclose = function(){
        console.info( 'ws server close.' );
      };
    },

    sendMsg: function( obj ){
      window.dalmuti.ws.send( JSON.stringify( obj ) );         
    }
  };

  var func = {
    info: function( server, dalmuti ){
      RESULT.empty();
      USERS.empty();
      WINNER.empty();

      RESULT.append( '<h4>' + server.names[ server.my.sessionId ] + '</h4>' );

      if( dalmuti.turnUser == server.my.sessionId ){
        RESULT.append( '<b class="text-red">내 차례</b>\n\n' );

        if( dalmuti.kingUser == server.my.sessionId )
          RESULT.append( '<b class="text-red">왕이에요</b>\n\n' );

        if( dalmuti.floorCard.isAnything )
          RESULT.append( '다시 왕이 되어서, 새로운 조합의 카드를 낼 수 있어요\n\n' );
      }

      USERS.append( '왕인 유저 : ' + server.names[ dalmuti.kingUser ] + '\n' );
      USERS.append( '현재 유저 : ' + server.names[ dalmuti.turnUser ] + '\n\n' );
      USERS.append( '\n\n' );
      if( dalmuti.users ){
        for( var d in dalmuti.users ){
          USERS.append( '유저 "' + server.names[ d ] + '" 남은 카드수 : ' + dalmuti.users[ d ].length + '\n\n' );
        }
      }

      if( dalmuti.winner ){
        WINNER.show();

        for( var w in dalmuti.winner ){
          WINNER.append( '순위 ' + ( parseInt( w ) +1 ) + '위 : ' + server.names[ dalmuti.winner[ w ] ] + '\n' );
        }
      }

      if( dalmuti.msg != null )
        RESULT.append( '\n' + dalmuti.msg );
    },

    show: function( data ){
       var server = data.server
         , dalmuti = data.dalmuti;

       if( server.names[ server.my.sessionId ] )
         CHAT.show();

       if( dalmuti.gameStatus >= 1 && server.names[ server.my.sessionId ] ){
         func.viewGame();
         func.info( server, dalmuti );
         func.viewCard( server, dalmuti );
       } else {

         if( server.names[ server.my.sessionId ] ){
           IN_NAME.attr( 'disabled', true ).val( server.names[ server.my.sessionId ] ).css({ 'font-size': '12pt', 'font-weight': 'bold' });
           BTN_START.attr( 'disabled', true ).css({ 'background-color': '#ccc', 'width': '13em' }).text( '필요 인원을 기다려 주세요.' );
         }

         CONNECT.show();
         CONNECT.find( '#s_need_user' ).html( '<b>' + server.needUser + '명</b>' );
       }

       IN_NEED_USER.val( server.needUser );

       uConnectUser.empty();
       for( var n in server.names )
         uConnectUser.append( '<li><b>' + server.names[ n ] + '</b></li>' );
    },

    viewGame: function(){
      CONNECT.hide();
      GAME.show();
    },

    viewCard: function( server, dalmuti ){
      MY.empty();
      FLOOR.html( '<b>바닥 카드 : ' + dalmuti.floorCard.grade + ' - ' + dalmuti.floorCard.count + '</b>' );

      var mycard = dalmuti.mycard;
      mycard = _.sortBy( mycard, 'grade' );

      for( var m in mycard ){
        if( mycard[ m ] == null )
          continue;

        var card = 
          $( '<div />' )
          .attr( 'class', 'card' )
          .data({ id: mycard[ m ].id, grade: mycard[ m ].grade })
          .click( function(){
            var oThis = $( this )
              , cls = oThis.attr( 'class' )
              , id = oThis.data( 'id' )
              , grade = oThis.data( 'grade' );

            if( cls == 'card-up' )
              $( this ).attr( 'class', 'card' );
            else
              $( this ).attr( 'class', 'card-up' );

            MY.find( 'div' ).each( function( k, v ){
              if( k == MY.find( 'div' ).length -1 ){
                window.dalmuti.cardUp = [];

                MY.find( '.card-up' ).each( function( k, v ){
                  var t = $( v )
                    , id = t.data( 'id' )
                    , grade = t.data( 'grade' );

                  window.dalmuti.cardUp.push({ id: id, grade: grade });
                });
              }
            });
          })
          .append( $( '<img />' ).attr( 'src', 'img/card/g_' + mycard[ m ].grade + '.jpg' ) );

        MY.append( card );
      }


      MY.append(
        $( '<div />' ).attr( 'class', 'button' ).append(
          $( '<button />' ).attr( 'class', 'btn' ).html( '<b>카드 내기</b>' ).click( function(){
            wsFunc.sendMsg({ step: 2, user: server.my.sessionId, card: window.dalmuti.cardUp });
            window.dalmuti.cardUp = [];
          })
        ).append(
          $( '<button />' ).attr( 'class', 'btn bg-orange' ).html( '<b>패스</b>' ).click( function(){
            wsFunc.sendMsg({ step: 3, user: server.my.sessionId });
            window.dalmuti.cardUp = [];
          })
        )
      );
    },

    action: function(){
      BTN_NEED_USER.click(function(){
        wsFunc.sendMsg({ step: 102, needUser: IN_NEED_USER.val() });
        location.reload();
      });

      BTN_NEW.click(function(){
        wsFunc.sendMsg({ step: 101 });
        location.reload();
      });

      BTN_START.click(function(){
        if( IN_NAME.val() == '' ){
          alert( '이름을 누군지 잘~ 알 수 있도록 입력해 주세요.' ); 
          return;
        }

        wsFunc.sendMsg({ step: 1, name: IN_NAME.val() });
      });

      IN_CHAT_MSG.keypress(function( e ){
        if( e.which == 13 ){
          var msg = IN_CHAT_MSG.val();
        
          wsFunc.sendMsg({ step: 201, msg: msg });
        }
      });
    }
  };

  func.action();
  wsFunc.wsConnect();
})();
