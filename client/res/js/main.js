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
    , WINNER = $( '#d_winner' ).hide().find( 'pre' )
    , FLOOR = $( '#d_floor' )
    , MY = $( '#d_my' )
    , OTHER = $( '#d_other' )
    , IN_NAME = $( '#i_name' )
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
      if( dalmuti.users ){
        for( var d in dalmuti.users ){
          USERS.append( '유저 ' + server.names[ d ] + ' 남은 카드수 : ' + dalmuti.users[ d ].length + '\n\n' );
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

       if( dalmuti.gameStatus >= 1 ){
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

       if( server.names[ server.my ] ){
         func.viewGame( server );
         return false;
       }

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
      OTHER.empty();
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
          .append( $( '<img />' ).attr( 'src', 'img/g_' + mycard[ m ].grade + '.jpg' ) );

        MY.append( card );
      }


      MY.append(
        $( '<div />' ).attr( 'class', 'button' ).append(
          $( '<button />' ).attr( 'class', 'btn' ).text( '카드 내기' ).click( function(){
            wsFunc.sendMsg({ step: 2, user: server.my.sessionId, card: window.dalmuti.cardUp });
            window.dalmuti.cardUp = [];
          })
        ).append(
          $( '<button />' ).attr( 'class', 'btn' ).text( '패스' ).click( function(){
            wsFunc.sendMsg({ step: 3, user: server.my.sessionId });
            window.dalmuti.cardUp = [];
          })
        )
      );
    },

    action: function(){
      BTN_START.click( function(){
        wsFunc.sendMsg({ step: 1, name: IN_NAME.val() });
      });
    }
  };

  func.action();
  wsFunc.wsConnect();
})();
