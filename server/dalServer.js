var WebSocket = require( 'ws' )
  , wss = new WebSocket.Server({ port: 51999 })
  , cookie = require( 'cookie' )
  , mainSvc = require( './service/mainService' )( WebSocket );

var CLIENTS = {};
var SERVER = { readyLength: 0, needUser: 4, names: {}, my: null, master: null };
mainSvc.init();

wss.on( 'connection', function( ws ){
  var cookies = cookie.parse( ws.upgradeReq.headers.cookie );

  if( CLIENTS[ cookie.sessionId ] === undefined ){
    CLIENTS[ cookies.sessionId ] = ws;
    CLIENTS[ cookies.sessionId ].sessionId = cookies.sessionId;
    CLIENTS[ cookies.sessionId ].ready = 0;
  }

  ws.on( 'message', function( msg ){
    var data = JSON.parse( msg );

    try{
      switch( parseInt( data.step ) ){
        case 0: // game init.
          mainSvc.allSend( CLIENTS, { dalmuti: mainSvc.getDalmuti(), server: SERVER } );
        break;
        case 1: // game start.
          var DALMUTI = mainSvc.getDalmuti()
            , count = 0
            , start = function(){
              if( cookies.sessionId !== undefined ){

                if( SERVER.master === null )
                  SERVER.master = cookies.sessionId; 

                CLIENTS[ cookies.sessionId ].ready = 1;
                SERVER.readyLength++;
                SERVER.names[ cookies.sessionId ] = data.name;

                mainSvc.start( CLIENTS, SERVER, cookies.sessionId );
              }
            };

          if( DALMUTI.gameStatus == 1 ){
            mainSvc.oneSend( ws, { dalmuti: mainSvc.addMsg( '다른 게임 실행 중입니다.' ), server: SERVER, isDeny: true } );
            return;
          }

          if( SERVER.names[ cookies.sessionId ] ){
            mainSvc.oneSend( ws, { dalmuti: mainSvc.addMsg( '이미 접속한 사용자 입니다.' ), server: SERVER, isDeny: true } );
            return;
          }

          if( Object.keys( SERVER.names ).length == 0 ){
            start();
            return;
          }

          for( var i in SERVER.names ){
            if( SERVER.names[ i ] == data.name ){
              mainSvc.oneSend( ws, { dalmuti: mainSvc.addMsg( '동일한 이름이 있습니다.' ), server: SERVER, isDeny: true } );
              return;
            }

            count++;

            if( count == Object.keys( SERVER.names ).length )
              start();
          }

        break;
        case 2: // card remove.
          mainSvc.removeCard( CLIENTS, SERVER, data );
        break;
        case 3: // pass.
          mainSvc.pass( CLIENTS, SERVER, data );
        break;

        case 101: // new game
          if( SERVER.master !== null && SERVER.master != cookies.sessionId ){
            mainSvc.oneSend( ws, { dalmuti: mainSvc.addMsg( '마스터가 아닙니다.' ), server: SERVER, isDeny: true } );
            return;
          }
          
          SERVER = { readyLength: 0, needUser: SERVER.needUser, names: {}, my: null, master: null };
          mainSvc.allSend( CLIENTS, { dalmuti: mainSvc.getDalmuti(), server: SERVER, isRefresh: true } );
          CLIENTS = {};
          mainSvc.init();
        break;
        case 102: // change need user.
          if( SERVER.master !== null && SERVER.master != cookies.sessionId ){
            mainSvc.oneSend( ws, { dalmuti: mainSvc.addMsg( '마스터가 아닙니다.' ), server: SERVER, isDeny: true } );
            return;
          }

          var DALMUTI = mainSvc.getDalmuti();

          if( DALMUTI.gameStatus == 1 ){
            mainSvc.oneSend( ws, { dalmuti: mainSvc.addMsg( '다른 게임 실행 중입니다.' ), server: SERVER, isDeny: true } );
            return;
          }

          if( parseInt( data.needUser ) < 4 ){
            mainSvc.oneSend( ws, { dalmuti: mainSvc.addMsg( '최소 필요 인원은 4명 입니다.' ), server: SERVER, isDeny: true } );
            return;
          }

          SERVER.needUser = parseInt( data.needUser );
          mainSvc.allSend( CLIENTS, { dalmuti: mainSvc.getDalmuti(), server: SERVER, isRefresh: true } );
          mainSvc.start( CLIENTS, SERVER, cookies.sessionId );
        break;

        case 201: // chatting.
          mainSvc.allSend( CLIENTS, { dalmuti: mainSvc.getDalmuti(), server: SERVER, chatMsg: data.msg, userName: SERVER.names[ cookies.sessionId ] } );
        break;
      }
    } catch( e ){

      mainSvc.allSend( CLIENTS, { dalmuti: mainSvc.addMsg( e ), server: SERVER } );
    }
  });
});
