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
    , FLOOR = $( '#d_floor' )
    , MY = $( '#d_my' )
    , OTHER = $( '#d_other' )
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
      RESULT.append( '내 이름 : ' + server.names[ server.my.sessionId ] + '\n\n' );

      if( dalmuti.turnUser == server.my.sessionId ){
        RESULT.append( '내 차례\n\n' );

        if( dalmuti.floorCard.isAnything )
          RESULT.append( '다시 왕이되어서, 새로운 조합의 카드를 낼 수 있어요\n\n' );
      }

      if( dalmuti.kingUser == server.my.sessionId )
        RESULT.append( '왕이에요\n\n' );

      if( dalmuti.users ){
        for( var d in dalmuti.users ){
          RESULT.append( '유저 ' + server.names[ d ] + ' 남은 카드수 : ' + dalmuti.users[ d ].length + '\n' );
        }
      }

      if( dalmuti.winner ){
        for( var w in dalmuti.winner ){
          RESULT.append( '순위 ' + ( parseInt( w ) +1 ) + '위 : ' + server.names[ dalmuti.winner[ w ] ] + '\n' );
        }
      }

      if( dalmuti.msg != null )
        RESULT.append( '\n' + dalmuti.msg );
    },

    show: function( data ){
       var server = data.server
         , dalmuti = data.dalmuti;

       if( server.names[ server.my.sessionId ] ){
         func.viewGame();

         if( dalmuti.gameStatus >= 1 ){
           func.info( server, dalmuti );
           func.viewCard( server, dalmuti );
         }
       
       } else {
         CONNECT.show();

         if( server.names[ server.my ] ){
           func.viewGame( server );
           return false;
         }

         uConnectUser.empty();
         for( var n in server.names )
           uConnectUser.append( '<li>' + server.names[ n ] + '</li>' );
       }
    },

    viewGame: function(){
      CONNECT.hide();
      GAME.show();
    },

    viewCard: function( server, dalmuti ){
      MY.empty();
      OTHER.empty();
      FLOOR.text( dalmuti.floorCard.grade + ' - ' + dalmuti.floorCard.count );

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
        $( '<button />' ).attr( 'class', 'btn' ).text( 'give' ).click( function(){
          wsFunc.sendMsg({ step: 2, user: server.my.sessionId, card: window.dalmuti.cardUp });
          window.dalmuti.cardUp = [];
        })
      ).append(
        $( '<button />' ).attr( 'class', 'btn' ).text( 'pass' ).click( function(){
          wsFunc.sendMsg({ step: 3, user: server.my.sessionId });
          window.dalmuti.cardUp = [];
        })
      );
    },

    action: function(){
      BTN_START.click( function(){
        var iName = $( '#i_name' );

        wsFunc.sendMsg({ step: 1, name: iName.val() });
      });
    }
  };

  func.action();
  wsFunc.wsConnect();
})();
