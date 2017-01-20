(function(){
  "use strict";

  require( [
      'ftt.date'
    ], function( 
      date 
    ){

    var config = {
      wsUrl: 'ws://de-php-api.fttinc.kr:31999'
    };

    window.fttMonitor987 = { 
      'ws': null,
      'chart': null,
      'chartLabel': [],
      'chartData': []
    };

    var divTopRight = $( '#d_top_right' )
      , divStatus = divTopRight.find( '.status' )
      , divNow = divTopRight.find( '.now' )
      , divWrap = $( '#d_wrap' )
      , divBox = $( '#d_box' ).show().clone()
      , divDesc = $( '#d_desc' )
      , divConts = $( '#d_conts' ); 

    var func = {
      wsConnect: function(){
        if( window.fttMonitor987[ 'ws' ] !== null )
          return false;

        var ws = new WebSocket( config.wsUrl );

        window.fttMonitor987[ 'ws' ] = ws;

        ws.onopen = function(){
          console.info( 'ws server open.' );
          ws.send( 'check start.' );

          if( divDesc.css( 'display' ) == 'none' )
            divStatus.css( 'color', 'black' ).text( config.wsUrl + ' connect.' );
          else
            divStatus.css( 'color', 'white' ).text( config.wsUrl + ' connect.' );

          divWrap.empty();
        };

        ws.onmessage = function( evt ){
          var ret = JSON.parse( evt.data );
          ret.now = date.nowDate();
          divNow.text( ret.now );

          console.info( ret );

          if(window.fttMonitor987[ 'chartData' ][ ret.key ] === undefined ){
            window.fttMonitor987[ 'chartLabel' ][ ret.key ] = [];
            window.fttMonitor987[ 'chartData' ][ ret.key ] = [];
          }

          if( ret.err != null || ret.response.statusCode != 200 ){
            func.makeUi( ret, -1 );
            return false;
          }

          func.makeUi( ret, JSON.parse( ret.result ).Code );
        };

        ws.onclose = function(){
          window.fttMonitor987[ 'ws' ] = null;

          if( divDesc.css( 'display' ) == 'none' )
            divStatus.css( 'color', 'red' ).text( config.wsUrl + ' close.' );
          else
            divStatus.css( 'color', 'white' ).text( config.wsUrl + ' close.' );

          console.info( 'ws server close, reconnect.' );
        };
      },

      makeUi: function( ret, code ){
        var api = ret.api
          , successLength = Object.keys( api.successCode ).length
          , apiBox = $( '#d_box_' + ret.key );

        if( apiBox.length <= 0 ){
          apiBox = divBox.clone(); 
          apiBox.attr( 'id', 'd_box_' + ret.key );

          divWrap.append( apiBox );
        }

        apiBox.attr( 'class', 'box error' );
        apiBox.find( '.box_left > .title > span' ).text( ret.key );
        apiBox.find( 'p[class=spend]' ).text( ret.spendTime + ' ms' );
        apiBox.find( 'p[class=code]' ).text( '오류' );

        for( var c in api.successCode ){
          if( api.successCode[ c ] == code ){
            apiBox.attr( 'class', 'box success' );
            apiBox.find( 'p[class=code]' ).text( '정상' );
          }
        }

        if( divDesc.data( 'key' ) == ret.key || divDesc.data( 'key' ) === undefined ){
          var dError = divConts.find( '#d_error' );
          dError.hide().find( 'p' ).empty();

          if( ret.err )
            dError.show().find( 'p' ).text( ret.err.code );

          divDesc.css( 'background-color', apiBox.css( 'border-color' ) );
          var viewJson = '';

          for( var a in ret ){
            switch( a ){
              case "result":
                try{
                  viewJson += a + ':\n' + JSON.stringify( JSON.parse( ret[ a ] ), null, 4 ) + '\n';
                } catch( err ) {
                  viewJson += a + ': ' + ret[ a ] + '\n'; 
                }
                continue;
                break;
              case "api":
                viewJson += a + ':\n' + JSON.stringify( ret[ a ], null, 4 ) + '\n';
                continue;
                break;
              case "spendTime":
                viewJson += a + ': ' + ret[ a ] + ' ms\n'; 
                continue;
                break; 
              case "key":
              case "err":
                continue;
                break;
              case "response":
                viewJson += 'statusCode: ' + ret[ a ].statusCode + '\n';
                break;

              default:
                viewJson += a + ': ' + ret[ a ] + '\n'; 
                break;
            }
          };

          divDesc.data( 'key', ret.key );
          divConts.find( 'h4 > span' ).text( ret.key );
          var dResult = divConts.find( '#d_result' );
          dResult.find( 'pre' ).attr( 'class', 'lang-json' );
          dResult.find( 'pre > code' ).text( viewJson );

          if( ret.response ){
            var dHeader = divConts.find( '#d_header' );
            dHeader.find( 'pre' ).attr( 'class', 'lang-json' );
            dHeader.find( 'pre > code' ).text( JSON.stringify( ret.response.headers, null, 4 ) );
          }

          func.chart( divConts.find( 'canvas' ), apiBox, ret );
          divConts.show();
        }

        apiBox.click(function(){
          divWrap.css( 'opacity', 0 );
          
          window.fttMonitor987[ 'chart' ].destroy();
          divConts.hide();
          divConts.find( 'h4 > span' ).empty();
          divConts.find( '#d_result' ).find( 'pre code' ).empty();
          divConts.find( '#d_header' ).find( 'pre code' ).empty();

          divStatus.css( 'color', 'white' );

          divDesc
            .css( 'background-color', apiBox.css( 'border-color' ) )
            .data( 'key', ret.key )
            .show();
        });

        $( 'pre code' ).each(function( k, code ) {
          hljs.highlightBlock( code );
        });
      },

      click: function(){
        $( '#d_desc .close' ).click(function(){
          divDesc.hide();
          divWrap.css( 'opacity', 1 );

          if( window.fttMonitor987[ 'ws' ] != null )
            divStatus.css( 'color', 'black' );
          else
            divStatus.css( 'color', 'red' );
        });

        $( '#btn_conn' ).click(function(){ func.wsConnect(); });
        $( '#btn_close' ).click(function(){
          if( window.fttMonitor987[ 'ws' ] !== null )
            window.fttMonitor987[ 'ws' ].close();
        });
      },

      chart: function( canvas, apiBox, ret ){
        if( ret === undefined )
          return false;

        if( window.fttMonitor987[ 'chartData' ][ ret.key ].length > 5 ){ 
          window.fttMonitor987[ 'chartLabel' ][ ret.key ].shift();
          window.fttMonitor987[ 'chartData' ][ ret.key ].shift();
        }

        window.fttMonitor987[ 'chartLabel' ][ ret.key ].push( date.hourDate( new Date() ) ); 
        window.fttMonitor987[ 'chartData' ][ ret.key ].push( ret.spendTime ); 

        var data = window.fttMonitor987[ 'chartData' ][ ret.key ].slice();

        window.fttMonitor987[ 'chart' ] = new Chart( canvas, {
          type: 'line', 
          data: {
            labels: window.fttMonitor987[ 'chartLabel' ][ ret.key ],
            datasets:[
              {
                fill: false,
                backgroundColor: 'white',
                borderColor: apiBox.css( 'border-color' ),
                label: ret.key,
                data: data,
              } 
            ] 
          },
          options: {
            responsive: false,
            scales: {
              xAxes: [{
                scaleLabel: {
                  display: true,
                  labelString: '현재 시간 (H:i:s)'    
                }
              }],
              yAxes: [{
                scaleLabel: {
                  display: true,
                  labelString: '소요 시간 (ms)'             
                }
              }]
            }
          }
        }); 
      }
    };

    func.wsConnect();
    func.click();
  }); 
})();
