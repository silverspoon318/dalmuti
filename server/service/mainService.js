(function(){
  "use strict";

  var deepExtend = require( 'deep-extend' );
  var DALMUTI = {}
    , WEBSOCKET;

  function mainService( websocket ){
    WEBSOCKET = websocket; 

    return func;
  };

  var func = {
    optionInit: function(){
      DALMUTI = {
        gameStatus: 0,
        grade: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ],
        card: [ { id: 1, grade: -1 }, { id: 1, grade: -1 } ],
        max: 80,
        perCard: 1,
        users: {},
        turn: 0,
        floorCard: { grade: 0, count: 0, isAnything: true },
        kingUser: null,
        winner: []
      }
    },

    init: function(){
      func.optionInit();
      var num = 3; 

      for( var g in DALMUTI.grade ){
        var grade = DALMUTI.grade[ g ];

        for( var i = 1, j = grade; i <= j; i++ ){
          DALMUTI.card.push({ id: num, grade: grade });
          num++;
        }
      }
    },

    start: function( SERVER, sessionId ){
      var clientsLength = Object.keys( SERVER.clients ).length;

      if( DALMUTI.gameStatus == 1 ){
        if( !DALMUTI.users[ sessionId ] ){
          SERVER.clients[ sessionId ].send( JSON.stringify( { msg: 'Wait for another game in progress.' } ) );
          delete SERVER.clients[ sessionId ];
          return;
        }
      }

      if( DALMUTI.gameStatus != 1 ){
        if( clientsLength == SERVER.needUser ){
          func.init();

          DALMUTI.gameStatus = 1;

          func.allSend( SERVER.clients, { msg: 'game start.' } );
          func.giveCard( SERVER.clients );

          return;
        }
      }

      DALMUTI.serverClients = clientsLength; 

      func.allSend( SERVER.clients, DALMUTI );
    },

    giveCard: function( clients ){
      while( DALMUTI.card.length > 0 ){
        for( var c in clients ){
          for( var q = 0, w = DALMUTI.perCard; q < w; q++ )
            func.giveOneCard( c, clients[ c ] );

          if( DALMUTI.card.length <= 0 ){
            DALMUTI.turnUser = Object.keys( DALMUTI.users )[ DALMUTI.turn ];
            func.allSend( clients, { msg: 'card end.' } );
            break;
          }

          func.oneSend( clients[ c ], DALMUTI.card );
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
        func.oneSend( client, card );
        return;
      }

      while( DALMUTI.card[ idx ] === undefined ){
      
        if( DALMUTI.card[ func.random() ] ){
          var card = DALMUTI.card[ idx ];

          DALMUTI.card.splice( idx, 1 );
          DALMUTI.users[ id ].push( card );
          func.oneSend( client, card );
          return;
        }
      }
    },

    removeCard: function( SERVER, data ){
      if( DALMUTI.gameStatus != 1 ){
        func.oneSend( SERVER.clients[ data.user ], { msg: 'Game is not start.' } ); 
        return false;
      }

      if( DALMUTI.turnUser != data.user ){
        func.oneSend( SERVER.clients[ data.user ], { msg: 'Not your turn.' } ); 
        return false;
      }

      if( Object.keys( data.card ).length == 0 ){
        func.oneSend( SERVER.clients[ data.user ], { msg: 'Card is null.' } ); 
        return false;
      }

      var card = data.card
        , normalCount = 0
        , jockerCount = 0
        , beforeCard = { grade: 0 };

      for( var c in card ){
        var cd = card[ c ];

        if( cd.grade == -1 ){
          jockerCount++;

          if( jockerCount == Object.keys( card ).length ){
            func.oneSend( SERVER.clients[ data.user ], { msg: 'Joker error.' } ); 
            return false;
          }
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

        if( c == Object.keys( card ).length -1 ){
          var userCard = DALMUTI.users[ data.user ];

          for( var co in card ){
            for( var k in userCard ){
              if( card[ co ].id == userCard[ k ].id ){
                DALMUTI.users[ data.user ].splice( k, 1 );

                if( Object.keys( userCard ).length == 0 ){
                  func.finish( SERVER, data );
                  return false;
                }
              }
            }

            if( co == Object.keys( card ).length -1 ){
              func.turnNext( SERVER, data, { grade: cd.grade, count: parseInt( c ) +1 } );
              return;
            }
          }

          break;
        }
      }
    },

    pass: function( SERVER, data ){
      if( DALMUTI.turnUser != data.user ){
        func.oneSend( SERVER.clients[ data.user ], { msg: 'You can pass only on your turn' } );
        return;
      }

      func.turnNext( SERVER, { user: DALMUTI.kingUser }, DALMUTI.floorCard );
    },

    turnNext: function( SERVER, data, floorCard ){
      DALMUTI.turn++;
      if( DALMUTI.turn == SERVER.needUser )
        DALMUTI.turn = 0;

      var nextUser = Object.keys( DALMUTI.users )[ DALMUTI.turn ];

      DALMUTI.kingUser = data.user;
      DALMUTI.turnUser = nextUser;

      while( DALMUTI.users[ DALMUTI.turnUser ].length == 0 ){
        DALMUTI.turn++;
        if( DALMUTI.turn == SERVER.needUser )
          DALMUTI.turn = 0;

        nextUser = Object.keys( DALMUTI.users )[ DALMUTI.turn ];
        DALMUTI.turnUser = nextUser;

        if( DALMUTI.users[ DALMUTI.kingUser ].length == 0 )
          DALMUTI.kingUser = nextUser;
      }

      floorCard.isAnything = false;
      if( DALMUTI.turnUser == nextUser && DALMUTI.kingUser == nextUser )
        floorCard.isAnything = true;

      DALMUTI.floorCard = floorCard;
      DALMUTI.msg = null;

      func.allSend( SERVER.clients, DALMUTI );
    },

    finish: function( SERVER, data ){
      DALMUTI.winner.push( data.user );

      if( DALMUTI.winner.length == Object.keys( DALMUTI.users ).length -1 ){
        DALMUTI.gameStatus = 2;
        func.allSend( SERVER.clients, { msg: 'game end.' } );
        return;
      }

      func.turnNext( SERVER, { user: data.user }, DALMUTI.floorCard );
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
      
        if( DALMUTI.gameStatus >= 1 ){
          if( DALMUTI.users ){
            sendData.my = { sessionId: client.sessionId, card: DALMUTI.users[ client.sessionId ] };
          }
        }

        client.send( func.serial( sendData ) ); 
      }
    },

    allSend: function( clients, obj ){
      var sendData = deepExtend( DALMUTI, obj );

      for( var c in clients ){
        var client = clients[ c ];

        if( client.readyState === WEBSOCKET.OPEN ){
          if( DALMUTI.gameStatus >= 1 ){
            if( DALMUTI.users ){
              sendData.my = { sessionId: client.sessionId, card: DALMUTI.users[ client.sessionId ] };
            }
          }

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
