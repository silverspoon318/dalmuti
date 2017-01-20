(function(){
  "use strict";

  var config = {
    wsUrl: 'ws://de-php-api.fttinc.kr:51999'
  };

  var func = {
    wsConnect: function(){
      var ws = new WebSocket( config.wsUrl );

      ws.onopen = function(){
        console.info( 'ws server open.' );

        ws.send( 'hello' );
      };

      ws.onmessage = function( evt ){
        var data = evt.data;

        if( data == null ){
          console.log( data );
          return false;
        }

        data = JSON.parse( data );
        console.log( data );
      };

      ws.onclose = function(){
        console.info( 'ws server close.' );
      };
    }
  };

  func.wsConnect();
})();
