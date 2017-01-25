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
        card: [ { id: 1, grade: -1 }, { id: 2, grade: -1 } ],
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

    start: function( CLIENTS, SERVER, sessionId ){
      if( DALMUTI.gameStatus == 1 ){
        if( !DALMUTI.users[ sessionId ] ){
          func.oneSend( CLIENTS[ sessionId ], { dalmuti: func.addMsg( '다른 게임 실행 중입니다.' ), server: SERVER } );
          delete CLIENTS[ sessionId ];
          return;
        }
      }

      if( DALMUTI.gameStatus != 1 ){
        if( SERVER.readyLength == SERVER.needUser ){
          func.init();

          DALMUTI.gameStatus = 1;

          func.allSend( CLIENTS, { dalmuti: func.addMsg( '게임 시작합니다.' ), server: SERVER } );
          func.giveCard( CLIENTS, SERVER );
          return;
        }
      }

      func.allSend( CLIENTS, { dalmuti: DALMUTI, server: SERVER } );
    },

    giveCard: function( CLIENTS, SERVER ){
      while( DALMUTI.card.length > 0 ){
        for( var c in CLIENTS ){
          for( var q = 0, w = DALMUTI.perCard; q < w; q++ )
            func.giveOneCard( c, CLIENTS[ c ], SERVER );

          if( DALMUTI.card.length <= 0 ){
            DALMUTI.turnUser = Object.keys( DALMUTI.users )[ DALMUTI.turn ];
            DALMUTI.kingUser = Object.keys( DALMUTI.users )[ DALMUTI.turn ];
            func.allSend( CLIENTS, { dalmuti: func.addMsg( '카드 나눠주기 끝났습니다. 게임 시작할께요.' ), server: SERVER } );
            break;
          }

          func.oneSend( CLIENTS[ c ], { dalmuti: DALMUTI, server: SERVER } );
        }
      }
    },

    giveOneCard: function( id, client, SERVER ){
      var idx = func.random();

      if( DALMUTI.card[ idx ] ){
        var card = DALMUTI.card[ idx ];

        DALMUTI.card.splice( idx, 1 );
        if( DALMUTI.users[ id ] === undefined )
          DALMUTI.users[ id ] = [];

        DALMUTI.users[ id ].push( card );
        func.oneSend( client, { dalmuti: DALMUTI, server: SERVER } );
        return;
      }

      while( DALMUTI.card[ idx ] === undefined ){
      
        if( DALMUTI.card[ func.random() ] ){
          var card = DALMUTI.card[ idx ];

          DALMUTI.card.splice( idx, 1 );
          DALMUTI.users[ id ].push( card );
          func.oneSend( client, { dalmuti: DALMUTI, server: SERVER } );
          return;
        }
      }
    },

    removeCard: function( CLIENTS, SERVER, data ){
      if( DALMUTI.gameStatus != 1 ){
        func.oneSend( CLIENTS[ data.user ], { dalmuti: func.addMsg( '게임이 아직 시작되지 않았습니다.' ), server: SERVER } );
        return false;
      }

      if( DALMUTI.turnUser != data.user ){
        func.oneSend( CLIENTS[ data.user ], { dalmuti: func.addMsg( '자기 차례가 아니에요.' ), server: SERVER } );
        return false;
      }

      if( Object.keys( data.card ).length == 0 ){
        func.oneSend( CLIENTS[ data.user ], { dalmuti: func.addMsg( '카드를 선택해 주세요.' ), server: SERVER } );
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
            func.oneSend( CLIENTS[ data.user ], { dalmuti: func.addMsg( '조커는 다른 카드와 함께 내야합니다.' ), server: SERVER } );
            return false;
          }

          continue;
        }

        if( beforeCard.grade != 0 && beforeCard.grade != cd.grade ){
          func.oneSend( CLIENTS[ data.user ], { dalmuti: func.addMsg( '같은 등급의 카드만 낼 수 있어요.' ), server: SERVER } );
          return false;
        }

        if( !DALMUTI.floorCard.isAnything ){
          if( DALMUTI.floorCard.grade <= cd.grade ){
            func.oneSend( CLIENTS[ data.user ], { dalmuti: func.addMsg( '바닥의 카드 등급보다 낮은 등급만 낼 수 있어요.' ), server: SERVER } );
            return false;
          }
        
          if( DALMUTI.floorCard.count != Object.keys( card ).length ){
            func.oneSend( CLIENTS[ data.user ], { dalmuti: func.addMsg( '바닥의 카드와 동일한 수량만 낼 수 있어요.' ), server: SERVER } );
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
                  func.finish( CLIENTS, SERVER, data );
                  return false;
                }
              }
            }

            if( co == Object.keys( card ).length -1 ){
              func.turnNext( CLIENTS, SERVER, data, { grade: cd.grade, count: parseInt( c ) +1 } );
              return;
            }
          }

          break;
        }
      }
    },

    pass: function( CLIENTS, SERVER, data ){
      if( DALMUTI.turnUser != data.user ){
        func.oneSend( CLIENTS[ data.user ], { dalmuti: func.addMsg( '자기 차례에만 패스 할 수 있습니다.' ), server: SERVER } );
        return;
      }

      if( DALMUTI.floorCard.grade == 0 ){
        func.oneSend( CLIENTS[ data.user ], { dalmuti: func.addMsg( '바닥 카드가 없으므로 패스 할 수 없어요.' ), server: SERVER } );
        return;
      }

      func.turnNext( CLIENTS, SERVER, { user: DALMUTI.kingUser }, DALMUTI.floorCard );
    },

    turnNext: function( CLIENTS, SERVER, data, floorCard ){
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

      func.allSend( CLIENTS, { dalmuti: DALMUTI, server: SERVER } );
    },

    finish: function( CLIENTS, SERVER, data ){
      DALMUTI.winner.push( data.user );

      if( DALMUTI.winner.length == Object.keys( DALMUTI.users ).length -1 ){
        DALMUTI.gameStatus = 2;
        func.allSend( CLIENTS, { dalmuti: func.addMsg( '게임이 끝났습니다. 순위를 확인해 주세요.' ), server: SERVER } );
        return;
      }

      func.turnNext( CLIENTS, SERVER, { user: data.user }, DALMUTI.floorCard );
    },

    random: function(){
      return Math.floor( Math.random() * DALMUTI.card.length );
    },

    getDalmuti: function(){
      return DALMUTI;
    },

    addMsg: function( msg ){
      DALMUTI.msg = msg; 

      return DALMUTI;
    },

    oneSend: function( client, obj ){
      if( client.readyState === WEBSOCKET.OPEN ){
        obj.server.my = { sessionId: client.sessionId };

        if( DALMUTI.gameStatus >= 1 ){
          if( DALMUTI.users )
            obj.dalmuti.mycard = DALMUTI.users[ client.sessionId ];
        }

        client.send( func.serial( obj ) ); 
      }
    },

    allSend: function( CLIENTS, obj ){
      for( var c in CLIENTS ){
        var client = CLIENTS[ c ];

        if( client.readyState === WEBSOCKET.OPEN ){
          obj.server.my = { sessionId: client.sessionId };

          if( DALMUTI.gameStatus >= 1 ){
            if( DALMUTI.users )
              obj.dalmuti.mycard = DALMUTI.users[ client.sessionId ];
          }

          client.send( func.serial( obj ) ); 
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
