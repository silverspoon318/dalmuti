(function(){
  "use strict";

  var deepExtend = require( 'deep-extend' );
  var DALMUTI = { 
    isStart: false,
    grade: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ],
    card: [ { grade: -1, id: 1 }, { grade: -1, id: 2 } ],
    max: 80,
    perCard: 2,
    users: {},
    turn: 0,
    floorCard: { grade: 0, count: 0, isAnything: true },
    kingUser: null
  };
  var WEBSOCKET;

  function mainService( websocket ){
    WEBSOCKET = websocket; 

    return func;
  };

  var func = {
    init: function( clients ){
      if( DALMUTI.isStart ){

        func.giveCard( clients );
        return;
      }

      DALMUTI.isStart = true;

      var num = 3; 

      for( var g in DALMUTI.grade ){
        var grade = DALMUTI.grade[ g ];
        for( var i = 1, j = grade; i <= j; i++ ){
          DALMUTI.card.push({ id: num, grade: grade });

          if( grade == 12 && i == 12 ){
            func.giveCard( clients );
            return;
          }

          num++;
        }
      }
    },

    start: function( SERVER ){
      var clientsLength = Object.keys( SERVER.clients ).length;

      if( !DALMUTI.isStart ){
        if( clientsLength == SERVER.needUser ){
          func.allSend( SERVER.clients, { msg: 'game start' } );
          func.init( SERVER.clients );

          return;
        }
      }

      DALMUTI.serverClients = clientsLength; 

      func.allSend( SERVER.clients, DALMUTI );
    },

    giveCard: function( clients ){
      while( DALMUTI.card.length > 0 ){
        for( var c in clients ){
          for( var q = 0, w = DALMUTI.perCard; q <= w; q++ ){
          
            if( DALMUTI.card.length <= 0 ){
              DALMUTI.turnUser = Object.keys( DALMUTI.users )[ DALMUTI.turn ];
              func.allSend( clients, { msg: 'card end' } );
              return;
            }

            func.giveOneCard( c, clients[ c ] );
          }

          clients[ c ].send( JSON.stringify( DALMUTI.card ) );
        }
      }
    },

    giveOneCard: function( id, client ){
      var idx = func.random();

      if( DALMUTI.card[ idx ] ){
        var card = DALMUTI.card[ idx ];

        DALMUTI.card.splice( idx, 1 );
        if( DALMUTI.users[ id ] === undefined )
          DALMUTI.users[ id ] = [];

        DALMUTI.users[ id ].push( card );
        client.send( JSON.stringify( card ) );
        return;
      }

      while( DALMUTI.card[ idx ] === undefined ){
      
        if( DALMUTI.card[ func.random() ] ){
          var card = DALMUTI.card[ idx ];

          DALMUTI.card.splice( idx, 1 );
          DALMUTI.users[ id ].push( card );
          client.send( JSON.stringify( card ) );
          return;
        }
      }
    },

    removeCard: function( SERVER, data ){
      /* 체크 */
      if( DALMUTI.turnUser != data.user ){
        func.oneSend( SERVER.clients[ data.user ], { msg: 'Not your turn.' } ); 
        return false;
      }

      var card = data.card
        , normalCount = 0;
        , jokerCount = 0;
        , beforeCard = { grade: 0 };

      for( var c in card ){
        var cd = card[ c ];

        if( cd.grade == -1 ){
          jokerCount++;
          continue;
        }

        if( beforeCard.grade != 0 && beforeCard.grade != cd.grade ){
          func.oneSend( SERVER.clients[ data.user ], { msg: 'Only cards of the same rank are possible.' } ); 
          return false;
        }

        if( !DALMUTI.floorCard.isAnything ){
          if( DALMUTI.floorCard.grade <= cd.grade ){
            func.oneSend( SERVER.clients[ data.user ], { msg: 'Only grades smaller than floor cards are allowed.' } ); 
            return false;
          }
        
          if( DALMUTI.floorCard.count != Object.keys( card ).length ){
            func.oneSend( SERVER.clients[ data.user ], { msg: 'Its different from the number of cards on the floor.' } ); 
            return false;
          }
        }

        beforeCard = cd;
        normalCount++;

        if( c == Object.keys( card ).length -1 ){
          if( normalCount == 0 && jokerCount >= 1 ){
            func.oneSend( SERVER.clients[ data.user ], { msg: 'Joker error.' } ); 
            return false;
          }

          var userCard = DALMUTI.users[ data.user ]
            , isAnything = false;

          for( var co in card ){
            for( var k in userCard ){
              if( card[ co ].id == userCard[ k ].id ){
                DALMUTI.users[ data.user ].splice( k, 1 );
              }
            }
          }

          func.turnNext( SERVER, data, { grade: cd.grade, count: parseInt( c ) +1, isAnything: isAnything } );
          break;
        }
      }
    },

    pass: function( SERVER, data ){
      func.turnNext( SERVER, {user: DALMUTI.kingUser}, DALMUTI.floorCard );
    },

    turnNext: function( SERVER, data, floorCard ){
      if( DALMUTI.turn == SERVER.needUser -1 )
        DALMUTI.turn = 0;
      else
        DALMUTI.turn++;

      floorCard.isAnything = false;
      if( DALMUTI.kingUser == data.user )
        floorCard.isAnything = true;

      DALMUTI.kingUser = data.user;
      DALMUTI.floorCard = floorCard;
      DALMUTI.turnUser = Object.keys( DALMUTI.users )[ DALMUTI.turn ];
      DALMUTI.msg = null;

      func.allSend( SERVER.clients, DALMUTI );
    },

    random: function(){
      return Math.floor( Math.random() * DALMUTI.card.length );
    },

    getDalmuti: function(){
      return DALMUTI;           
    },

    oneSend: function( client, obj ){
      var sendData = deepExtend( DALMUTI, obj );

      if( client.readyState === WEBSOCKET.OPEN ){
      
        if( DALMUTI.isStart ){
          if( DALMUTI.users ){
            sendData.my = { sessionId: client.sessionId, card: DALMUTI.users[ client.sessionId ] };
          }
        }

        client.send( func.serial( DALMUTI ) ); 
        client.send( func.serial( sendData ) ); 
      }
    },

    allSend: function( clients, obj ){
      var sendData = deepExtend( DALMUTI, obj );

      for( var c in clients ){
        var client = clients[ c ];
        if( client.readyState === WEBSOCKET.OPEN ){
        
          if( DALMUTI.isStart ){
            if( DALMUTI.users ){
              sendData.my = { sessionId: client.sessionId, card: DALMUTI.users[ client.sessionId ] };
            }
          }

          client.send( func.serial( DALMUTI ) ); 
          client.send( func.serial( sendData ) ); 
        }
      }
    },

    allUserCard: function(){
      return DALMUTI.users;                
    },

    serial: function( obj ){
      return JSON.stringify( obj );           
    }
  };

  module.exports = mainService;
})();
