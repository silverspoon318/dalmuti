var GRADE = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ]
  , CARD = [ {grade: -1, id: 1}, {grade: -1, id: 2} ]
  , MAX = 80
  , USER = {}; 

var DALMUTI = { isStart:false };

(function(){
  "use strict";

  var mainService = {
    init: function( clients ){
      if( DALMUTI.isStart ){

        mainService.giveCard( clients );
        return;
      }

      DALMUTI.isStart = true;

      var num = 3; 

      for( var g in GRADE ){

        var grade = GRADE[ g ];
        for( var i = 1, j = grade; i <= j; i++ ){
          CARD.push({ id: num, grade: grade });

          if( grade == 12 && i == 12 ){
            mainService.giveCard( clients );
            return;
          }

          num++;
        }
      }
    },

    start: function( clients ){
      mainService.init( clients );
    },

    giveCard: function( clients ){
      for( var c in clients ){
        for( var q = 0, w = 5; q < w; q++ ){
        
          if( CARD.length == 0 )
            clients[ c ].send( JSON.stringify({ msg: 'card end' }) );

          mainService.giveOneCard( c, clients[ c ] );
        }

        clients[ c ].send( JSON.stringify( CARD ) );
        clients[ c ].send( JSON.stringify( USER ) );
      }
    },

    giveOneCard: function( id, client ){
      var idx = mainService.random();

      if( CARD[ idx ] ){
        var card = CARD[ idx ];

        CARD.splice( idx, 1 );
        if( USER[ id ] === undefined )
          USER[ id ] = [];

        USER[ id ].push( card );
        client.send( JSON.stringify( card ) );
        return;
      }

      while( CARD[ idx ] === undefined ){
      
        if( CARD[ mainService.random() ] ){
          var card = CARD[ idx ];

          CARD.splice( idx, 1 );
          USER[ id ].push( card );
          client.send( JSON.stringify( card ) );
          return;
        }
      }
    },

    random: function(){
      return Math.floor( Math.random() * CARD.length );
    }
  };

  module.exports = mainService;
})();
