(function(){
  "use strict";

  var dalmuti = window.dalmuti = {
    ws: null,
    wsUrl: 'ws://de-php-api.fttinc.kr:51999',
    cardUp: {} 
  };

  var BODY = $( 'body' ) 
    , RESULT = $( '#d_result' )
    , FLOOR = $( '#d_floor' )
    , MY = $( '#d_my' )
    , OTHER = $( '#d_other' );

  var server = {
    wsConnect: function(){
      var ws = window.dalmuti.ws = new WebSocket( dalmuti.wsUrl );

      ws.onopen = function(){
        console.info( 'ws server open.' );

        server.sendMsg({ step: 0 });
      };

      ws.onmessage = function( evt ){
        var data = evt.data;

        if( data == null ){
          console.log( data );
          return false;
        }

        data = JSON.parse( data );
        console.clear();
        console.log( data );
        RESULT.empty().text( data.msg );

        if( data.isStart ){
          func.init( data );
          func.viewCard( data );
        }
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
    init: function( data ){
      if( data.turnUser == data.my.sessionId )
        BODY.attr( 'class', 'myturn' );
      else
        BODY.attr( 'class', '' );
    },

    viewCard: function( data ){
      MY.empty();
      OTHER.empty();
      FLOOR.text( data.floorCard.grade + ' - ' + data.floorCard.count );

      var my = data.my;

      for( var m in my.card ){
        if( my.card[ m ] == null )
          continue;

        var card = 
          $( '<div />' )
          .attr( 'class', 'card' )
          .data({ id: my.card[ m ].id, grade: my.card[ m ].grade })
          .text( my.card[ m ].grade + ' / ' + my.card[ m ].id )
          .click( function(){
            var oThis = $( this )
              , cls = oThis.attr( 'class' )
              , id = oThis.data( 'id' )
              , grade = oThis.data( 'grade' );

            if( cls == 'card-up' )
              $( this ).attr( 'class', 'card' );
            else
              $( this ).attr( 'class', 'card-up' );

            window.dalmuti.cardUp = [];

            MY.find( '.card-up' ).each( function( k, v ){

              var t = $( v )
                , id = t.data( 'id' )
                , grade = t.data( 'grade' );

              window.dalmuti.cardUp.push({ id: id, grade: grade });
            });
          });

        MY.append( card );
      }

      MY.append(
        $( '<button />' ).attr( 'class', 'btn' ).text( 'give' ).click( function(){
          server.sendMsg({ step: 1, user: my.sessionId, card: window.dalmuti.cardUp });
        })
      ).append(
        $( '<button />' ).attr( 'class', 'btn' ).text( 'pass' ).click( function(){
          server.sendMsg({ step: 2, user: my.sessionId });
        })
      );
    },
  };

  server.wsConnect();
})();
