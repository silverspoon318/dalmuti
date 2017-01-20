/* ftt.date.js 
 *
 * Id : util/ftt.date 
 * Dependency :
 * Type : util 
 * Desc
 * : ftt date js 
 *
 */
"use strict";

define( 'ftt.date', function(){

  var dates = {

    /* Desc
     * : new Date() 값을 YYYY-mm-dd H:i:s Full date 반환.
     *
     * Arguments
     * @nowDate : [Date] 변환 시간.
     *
     */
    fullDate: function( nowDate ){
      if( nowDate === undefined ) return false;

      var cMonth = ''
        , cDate = ''
        , cHour = '' 
        , cMinutes = ''
        , cSecond = '';

      cMonth = parseInt(nowDate.getMonth()) + 1;
      if( cMonth.toString().length == 1 ) cMonth = '0' + cMonth;

      if( nowDate.getDate().toString().length == 1 ) cDate = '0' + nowDate.getDate();
      else cDate = nowDate.getDate();

      if( nowDate.getHours().toString().length == 1 ) cHour = '0' + nowDate.getHours();
      else cHour = nowDate.getHours();

      if( nowDate.getMinutes().toString().length == 1 ) cMinutes = '0' + nowDate.getMinutes();
      else cMinutes = nowDate.getMinutes();

      cSecond = nowDate.getSeconds();

      return nowDate.getFullYear() + '-' + cMonth + '-' + cDate + ' ' + cHour + ':' + cMinutes + ':' + cSecond; 
    },

    /* Desc
     * : new Date() 값을 H:i:s Hour date 반환.
     *
     * Arguments
     * @nowDate : [Date] 변환 시간.
     *
     */
    hourDate: function( nowDate ){
      if( nowDate === undefined ) return false;

      var cHour = '' 
        , cMinutes = ''
        , cSecond = '';

      if( nowDate.getHours().toString().length == 1 ) cHour = '0' + nowDate.getHours();
      else cHour = nowDate.getHours();

      if( nowDate.getMinutes().toString().length == 1 ) cMinutes = '0' + nowDate.getMinutes();
      else cMinutes = nowDate.getMinutes();

      cSecond = nowDate.getSeconds();

      return cHour + ':' + cMinutes + ':' + cSecond; 
    },

    /* Desc
     * : 현재 YYYY-mm-dd H:i:s Full date 반환.
     */
    nowDate : function(){
      var nowDate = new Date();

      return dates.fullDate( nowDate );
    },

    /* Desc
     * : 현재 YYYY-mm-dd H:i:s Full date 반환.
     *
     * Arguments
     * @nowDate : [Date] 현재 시간.
     * @addDay : [Integer] 추가할 날짜.
     *
     * : arguments가 하나로 addDay만 호출한 경우 현재 시간 기준으로 반환
     */
    addDay : function( nowDate, addDay ){
      if( arguments.length == 1 ){
        addDay = nowDate;
        nowDate = new Date(); 
      }

      nowDate.setDate( nowDate.getDate() + addDay );

      return dates.fullDate( nowDate );
    },

    /* Desc
     * : DB Date string 을 javascript new Date() 변환.
     *
     * Arguments
     * @dateString : [String] 시간 String 값.
     *
     * : 멀티 브라우저 호환. "." "," "-" "/" "|" ":" Date 구분자 체크. 
     */
    changeDate : function( dateString ){
      var dStr = dateString.split( /[\.\,\-\/\|: ]/ );

      return new Date( dStr[0], dStr[1] - 1, dStr[2], dStr[3], dStr[4], dStr[5] );
    }
  }

  return dates;
});
