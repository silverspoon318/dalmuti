$(function(){
  "use strict"; 

  var dalmuti = window.dalmuti = {
    ws: null,
    wsUrl: 'ws://de-php-api.fttinc.kr:51999',
    data: {},
    selectedCard: [] 
  };

  var nav = $( 'nav' ) 
    , inNeedUser = $( '#i_need_user' )
    , inChatMsg = $( '#i_chat_msg' )
    , inChatMsg2 = $( '#i_chat_msg2' )
    , inNick = $( '#i_nick' )
    , divPlayerAdd = $( '#d_player_add' )
    , divChat = $( '#chat' )
    , divChat2 = $( '#chat2' )
    , divPlayerInfo = $( '#playerInfo' )
    , btnNeedUser = $( '#btn_need_user' )
    , btnNew = $( '#btn_new' )
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
      inNeedUser.val( data.server.needUser );

      if( data.isRefresh )
        location.reload();

      if( data.isDeny ){
        alert( data.dalmuti.msg );
        return;
      }

      if( data.server.master === null || data.server.master == data.server.my.sessionId )
        nav.show();
      else
        nav.hide();

      if( data.server.names[ data.server.my.sessionId ] ){
        divChat.show();
        divPlayerAdd.hide();

      } else {
        divChat.hide();
        divPlayerAdd.show();
      }

      var uiSet = window.dalmuti.uiSet = new dalmutiUI( data );

      uiSet.layoutSet.turnCheck();

      if( data.dalmuti.msg )
        uiSet.layoutSet.msg( data.dalmuti.msg );

      if( data.chatMsg ){
        uiSet.layoutSet.chat( data );
        divChat.find( '.msg_area' ).scrollTop( divChat.find( '.msg_area' ).prop( 'scrollHeight' ) );
        divChat2.find( '.msg_area' ).scrollTop( divChat2.find( '.msg_area' ).prop( 'scrollHeight' ) );

        if( data.userName == data.server.names[ data.server.my.sessionId ] ){
          inChatMsg.val( '' );
          inChatMsg2.val( '' );
        }
        return;
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

    btnNeedUser.click(function(){
      wsFunc.sendMsg({ step: 102, needUser: inNeedUser.val() });
    });

    btnNew.click(function(){
      wsFunc.sendMsg({ step: 101 });
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
      
      if( divSelected.length == 0 )
        window.dalmuti.uiSet.layoutSet.msg( '카드를 선택해 주세요.' );

      divSelected.each(function( k, v ){
        var oThis = $( this );

        window.dalmuti.selectedCard.push({ id: oThis.data( 'id' ), grade: oThis.data( 'grade' ) });

        if( k == divSelected.length - 1 ){
          wsFunc.sendMsg({ step: 2, user: window.dalmuti.data.server.my.sessionId, card: window.dalmuti.selectedCard });
          window.dalmuti.selectedCard = [];
        }
      });
    });

    btnPass.click(function(){
      wsFunc.sendMsg({ step: 3, user: window.dalmuti.data.server.my.sessionId });
      window.dalmuti.selectedCard = [];
    });
  }

  wsFunc.wsConnect();
  action();
});  
