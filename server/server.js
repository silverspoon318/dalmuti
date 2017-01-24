var WebSocket = require( 'ws' )
  , wss = new WebSocket.Server({ port: 51999 })
  , cookie = require( 'cookie' )
  , mainSvc = require( './service/mainService' )( WebSocket );

var SERVER = { clients:{}, needUser: 4 };
mainSvc.init();

wss.on( 'connection', function( ws ){
  var cookies = cookie.parse( ws.upgradeReq.headers.cookie );

  if( SERVER.clients[ cookie.sessionId ] === undefined ){
    SERVER.clients[ cookies.sessionId ] = ws;
    SERVER.clients[ cookies.sessionId ].sessionId = cookies.sessionId;
  }

  ws.on( 'message', function( msg ){
    var data = JSON.parse( msg );

    switch( parseInt( data.step ) ){
      case 0:
        mainSvc.start( SERVER, cookies.sessionId );
      break; 

      case 1:
        mainSvc.removeCard( SERVER, data );
      break;

      case 2:
        mainSvc.pass( SERVER, data );
      break;
    }
  });
});
