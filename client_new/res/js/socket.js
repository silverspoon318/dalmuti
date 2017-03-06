$(function(){
  "use strict"; 

  var dalmuti = window.dalmuti = {
    ws: null,
    wsUrl: 'ws://de-php-api.fttinc.kr:51999',
    data: {},
    cardUp: [] 
  };
  var inChatMsg = $( '#i_chat_msg' )
    , inChatMsg2 = $( '#i_chat_msg2' )
    , inNick = $( '#i_nick' )
    , divPlayerAdd = $( '#d_player_add' )
    , divChat = $( '#chat' )
    , divChat2 = $( '#chat2' )
    , divPlayerInfo = $( '#playerInfo' )
    , btnJoin = $( '#btn_join' )
    , btnSend = $( '#btn_send' )
    , btnPass = $( '#btn_pass' );

  var wsFunc = {
    wsConnect: function(){
      var ws = window.dalmuti.ws = new WebSocket( dalmuti.wsUrl );

      ws.onopen = function(){
        console.info( 'ws server open.' );
        wsFunc.sendMsg({ step: 0 });
      };

      ws.onmessage = function( evt ){
        var data = JSON.parse( evt.data );
        console.log( data );

        wsFunc.onMsg( data );
      };

      ws.onclose = function(){
        console.info( 'ws server close.' );
      };
    },

    onMsg: function( data ){
      data.dalmuti.mycard = _.sortBy( data.dalmuti.mycard, 'grade' );
      window.dalmuti.data = data;
      var uiSet = null; 

      if( data.isRefresh )
        location.reload();

      if( data.isDeny ){
        alert( data.dalmuti.msg );
        return;
      }

      if( data.server.names[ data.server.my.sessionId ] ){
        divPlayerAdd.hide();
        divChat.show();
      }

      if( !window.dalmuti.isFlip ){ 
        uiSet = new dalmutiUI( data );

        if( data.dalmuti.msg )
          uiSet.layoutSet.msg( data.dalmuti.msg );

        uiSet.layoutSet.turnCheck();

        if( data.chatMsg ){
          uiSet.layoutSet.chat( data );
          divChat.find( '.msg_area' ).scrollTop( divChat.find( '.msg_area' ).prop( 'scrollHeight' ) );
          divChat2.find( '.msg_area' ).scrollTop( divChat2.find( '.msg_area' ).prop( 'scrollHeight' ) );
          inChatMsg.val( '' );
          inChatMsg2.val( '' );
          return;
        }
      }
    },

    sendMsg: function( obj ){
      window.dalmuti.ws.send( JSON.stringify( obj ) );         
    }
  };

  function action(){
    inChatMsg.keypress(function( e ){
      if( e.which == 13 )
        wsFunc.sendMsg({ step: 201, msg: inChatMsg.val() });
    });

    inChatMsg2.keypress(function( e ){
      if( e.which == 13 )
        wsFunc.sendMsg({ step: 201, msg: inChatMsg2.val() });
    });

    btnJoin.click(function(){
      if( inNick.val() == '' ){
        alert( '사용자 이름을 입력해 주세요.' ); 
        return;
      }

      wsFunc.sendMsg({ step: 1, name: inNick.val() });
    });

    btnSend.click(function(){
      var divSelected = divPlayerInfo.find( '.selected' );
      divSelected.each(function( k, v ){
        var oThis = $( this );

        window.dalmuti.cardUp.push({ id: oThis.data( 'id' ), grade: oThis.data( 'grade' ) });

        if( k == divSelected.length - 1 ){
          wsFunc.sendMsg({ step: 2, user: window.dalmuti.data.server.my.sessionId, card: window.dalmuti.cardUp });
          window.dalmuti.cardUp = [];
        }
      });
    });

    btnPass.click(function(){
      wsFunc.sendMsg({ step: 3, user: window.dalmuti.data.server.my.sessionId });
      window.dalmuti.cardUp = [];
    });
  }

  wsFunc.wsConnect();
  action();
});  
