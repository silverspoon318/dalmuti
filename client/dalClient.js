var express = require( 'express' )
  , cookieParser = require( 'cookie-parser' )
  , cookieSession = require( 'cookie-session' )
  , app = express();

var PORT = 40999;
var SESSION = 0;
 
app.use( cookieSession({
  name: 'sessionId',
  keys: [ 'dalmuti-!@#333', 'key2' ],
  maxAge: 24 * 60 * 60 * 1000,
}));
app.use( cookieParser() );

app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );
app.use( express.static( 'res' ) );

app.get( '/', function( req, res ){
  if( req.cookies.sessionId === undefined ){
    req.session.id = SESSION;
    SESSION++;
  }

  res.render( 'main' );
  res.end();

}).listen( PORT, function( req ){
  console.log( 'dalmuti client start. port is ' + PORT );
});
 
