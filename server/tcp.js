var require = __meteor_bootstrap__.require,
    net = require('net'),
    colors = require('colors'),
    //port = 2001,
    //host = "172.23.45.67";
    port = 2002,
    host = "172.23.45.16";

colors.setTheme({
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

/*
// Connects to MSSQL database.
// Query with explicit connection
var sql = require('node-sqlserver');

// Requires that you have a ODBC connection setup.
var conn_str = 
    "DSN=TheDsn;" +
    "UID=TheUsername;" +
    "PWD=ThePassword;" +
    "DATABASE=TheDatabase";
    
sql.open(conn_str, function (err, conn) {
    if (err) {
        console.log("Error opening the connection: " + err);
        return;
    }
    console.log("Running query...");
    conn.queryRaw("SELECT FirstName, LastName FROM Employee", function (err, results) {
        if (err) {
            console.log("Error running query: " + err);
            return;
        }
        console.log("Running query finished.");
        for (var i = 0; i < results.rows.length; i++) {
            console.log("FirstName: " + results.rows[i][0] + " LastName: " + results.rows[i][1]);
        }
    });
});
*/
    
var SOH_LENGTH_STX_SIZE = 1+4+1;
var TAG_INDEX = 6;

var SOH = 0x01;
var STX = 0x02;
var ETX = 0x03;
var EOT = 0x04;
var BBX = "BBX"; 

var m_receiveBuffer = [];

var socket = net.createConnection(port, host);
logger('XGate'.info, 'Socket created.');

socket.on('data', function(incomingData) {

  logger('XGate'.data, '\n--------------------------------------------------------------');    
  // Log the response from the server.
  logger('XGate'.data, 'RESPONSE: ' + incomingData);
    
    // <summary>
    // The XGateCom connect to XGateServer using a TcpAsyncSocket.
    // All communication to the XGateServer should use XGateCom class.
    // If the connection is lost, XGateCom will attempt to reconnect
    // to XGate automatically.
    // </summary>
    // <remarks>
    // |SOH|Length|STX|Tag|ETX|Type|ETX|Status|ETX|time|ETX| ... |ETX||EOT||CRC|
    // -------------------------------------------------------------------------
    // SOH Byte size = 1
    // LENGTH Byte size = 4
    // STX Byte size = 1
    // ETX Byte size = 1
    // EOT Byte size = 1
    //
    // The Length describes the total byte length from SOH to end of CRC.
    // </remarks>  
    
    // Put all the incoming data into the buffer at the end
    for(var i = 0; i < incomingData.length; i++)
      m_receiveBuffer.push(incomingData[i]);
        
    while (m_receiveBuffer.length > 7)
    {
      // pull out one message worth of data to parse
      var sizeResults = decodeNext(m_receiveBuffer, 1, STX);
      var lengthOfMessage = sizeResults.result;
             
      if (m_receiveBuffer.length < lengthOfMessage) // if we don't have enough, bail and wait for another message
        break;
             
      var data = [];
      for (var x = 0; x < lengthOfMessage; x++)
      {
          data.push(m_receiveBuffer.shift());
      }       
    
    
      Fiber(function() {
      
      var currentIndex = TAG_INDEX;
      var tagResults = decodeNext(data, currentIndex, ETX);
      var tag = tagResults.result;
      currentIndex = tagResults.currentIndex;
      logger('XGate'.data, 'TAG: ' +tag);      
      
      var typeResults = decodeNext(data, currentIndex, ETX);
      var type = typeResults.result;
      currentIndex = typeResults.currentIndex;
      logger('XGate'.data, 'TYPE: ' + type);
      
      var statusResults = decodeNext(data, currentIndex, ETX);
      var status = statusResults.result;
      currentIndex = statusResults.currentIndex;
      logger('XGate'.data, 'STATUS: ' + status);    
      
      var timeResults = decodeNext(data, currentIndex, ETX);
      var time = timeResults.result;
      currentIndex = timeResults.currentIndex;
      logger('XGate'.data, 'TIME: ' + time);    
      
      var networkIDResults = decodeNext(data, currentIndex, ETX);
      var networkID = networkIDResults.result;
      currentIndex = networkIDResults.currentIndex;
      logger('XGate'.data, 'NETWORKID: ' + networkID);    
      
      var formNumResults = decodeNext(data, currentIndex, ETX);
      var formNum = formNumResults.result;
      currentIndex = formNumResults.currentIndex;
      logger('XGate'.data, 'FORM NUM: ' + formNum);    
      
      var formSizeResults = decodeNext(data, currentIndex, ETX);
      var formSize = formSizeResults.result;
      currentIndex = formSizeResults.currentIndex;
      logger('XGate'.data, 'FORM SIZE: ' + formSize);    

      var fields = [];
      for (var i = 0; i < formSize; i++)
      {
        var fieldIndexResults = decodeNext(data, currentIndex, ETX);
        var fieldIndex = fieldIndexResults.result;     
        currentIndex = fieldIndexResults.currentIndex;
        var fieldDataResults = decodeNext(data, currentIndex, ETX);
        var fieldData = fieldDataResults.result;
        currentIndex = fieldDataResults.currentIndex;
        logger('XGate'.data, 'Field: ' + fieldIndex + ' Data: ' + fieldData);
        
        fields[fieldIndex] = fieldData;
      }
     
      // store vehicle location if it is available in the msg
      if (type == BBX && fields[148] != null && fields[149] != null)
      {
        // remove any spaces between signs on the number
        // + 51.5445 = +51.5445
        // - 114.000 = -114.000
        var lon = fields[148].replace(" ",""); 
        var lat = fields[149].replace(" ",""); 
      


          vehiclesMatched = Vehicles.findOne({name: networkID});
          if (vehiclesMatched != null)
          {
            Vehicles.update(vehiclesMatched._id, {$set: {lon: parseFloat(lon), lat: parseFloat(lat), time: time}});      
            console.log('Updated: ' + networkID );
          }
          else
          {
            Vehicles.insert({name: networkID, lon: parseFloat(lon), lat: parseFloat(lat), time: time});      
            console.log('Inserted: ' + networkID);
          }
               
   
    
      }
                   }
        ).run();    

    }  
    
    console.log('Total Length of Buffer: ' + m_receiveBuffer.length);
    
}).on('connect', function() {
    logger('XGate'.info, 'Connected to XGate server.');
}).on('end', function() {
    logger('XGate'.info, 'Diconnected from XGate server');
});

function decodeNext(data, index, seperator) {
    var decodeResult = "";
    var offset = 0;
  
    while(true) {
        var byteData = data[index + offset];
        offset++;
        if (byteData == seperator)
            break;
            
        decodeResult = decodeResult + String.fromCharCode(byteData);
    }
      
    return { result: decodeResult, currentIndex: index + offset };
}

function logger(title, message) {
    while (title.length < 26) {
        title = title + ' ';
    }
    console.log(title + message);
}

