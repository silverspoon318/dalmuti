var WebSocket = require( 'ws' )
  , wss = new WebSocket.Server({ port: 51999 })
  , cookie = require( 'cookie' )
  , mainSvc = require( './service/mainService' );

var GLOBAL = { clients:{}, needUser: 5 };

wss.on( 'connection', function( ws ){
  var cookies = cookie.parse( ws.upgradeReq.headers.cookie );

  if( GLOBAL.clients[ cookie.sessionId ] === undefined )
    GLOBAL.clients[ cookies.sessionId ] = ws;

  ws.on( 'message', function( msg ){
    mainSvc.start( GLOBAL.clients );

    for( var c in GLOBAL.clients ){
      var client = GLOBAL.clients[ c ];

      if(client.readyState === WebSocket.OPEN) {

        if( GLOBAL.clients.length == GLOBAL.needUser ){
          client.send({ msg: 'start' });

          return;
        }

        var data = { currentUser: Object.keys( GLOBAL.clients ).length };
        client.send( JSON.stringify( data ) );
      }
    }
  });
});
