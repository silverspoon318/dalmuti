var WebSocket = require( 'ws' )
  , wss = new WebSocket.Server({ port: 51999 })
  , cookie = require( 'cookie' )
  , mainSvc = require( './service/mainService' )( WebSocket );

var CLIENTS = {};
var SERVER = { readyLength: 0, needUser: 4, names: {}, my: null };
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
        case 0:
          mainSvc.allSend( CLIENTS, { dalmuti: mainSvc.getDalmuti(), server: SERVER } );
        break;
        case 1:
          if( cookies.sessionId !== undefined ){
            CLIENTS[ cookies.sessionId ].ready = 1;
            SERVER.readyLength++;
            SERVER.names[ cookies.sessionId ] = data.name;

            mainSvc.start( CLIENTS, SERVER, cookies.sessionId );
          }
        break; 
        case 2:
          mainSvc.removeCard( CLIENTS, SERVER, data );
        break;
        case 3:
          mainSvc.pass( CLIENTS, SERVER, data );
        break;
      }
    } catch( e ){
      mainSvc.allSend( CLIENTS, { dalmuti: mainSvc.addMsg( e.getMessage() ), server: SERVER } );
    }
  });
});
