var chrome = {
  listener: null,

  storage : { 

    sync: false,

    local: {
        set : function (data,callback){
           for (let k in data) {
              if (data.hasOwnProperty(k)) {
                 statement = dbConn.createStatement("SELECT * FROM storage WHERE key = :key);");
                 statement.params.key = k;
                 if (statement.executeStep()) { //TODO: chrome should be rewritten to async functions instead
                    //if key exist, update
                    statement.reset();
		    statement = dbConn.createStatement("UPDATE storage SET value=:value WHERE key=:key;");                 
                 } else {
                    //if key not exist - insert
                    statement.reset();
                    statement = dbConn.createStatement("INSERT INTO storage(key,value) VALUES(:key,:value);");
                 }
                 statement.params.key = k;
                 statement.params.value=data[k]
		 statement.execute(); //TODO: form a one request instead of chrome shit
              }
           }
           if (callback) callback();
           return;

        },
        get : function (data,callback) {
          let statement;
          var result = [];
          if (data == null) {
             statement = dbConn.createStatement("SELECT * FROM storage;");
             while (statement.executeStep()) {
  	 	result.push({[statement.row.key]:statement.row.value});
	     }	     
          } else {
            for (let k in data) { //TODO: Make a proper implementation to use only one request instead of a bunch
              if (data.hasOwnProperty(k)) {
                statement = dbConn.createStatement("SELECT * FROM storage WHERE key = :key;");
                statement.params.key = k;
                while (statement.executeStep()) {
                  result.push({[statement.row.key]:statement.row.value});
	        }
                statement.reset();
              }
            }
          }

	  return result;
        },

        QUOTA_BYTES: 102400,

	getBytesInUse : function (callback){
		callback(10);	//nobody uses it anyway.	
	},

    },

    onChanged: {
        addListener: function (onChange){
          return null;
        }
    },

  },
  runtime : {

    lastError: false, //TODO: add proper error handling maybe?

    onMessage: {
        addListener: function (onChange){
	  chrome.listener = onChange;
          return;
        }
    },

    getURL: function (url){
      return url.startsWith("/")?"resource://augmentedsteamlegacy/AugmentedSteam"+url : "resource://augmentedsteamlegacy/AugmentedSteam/"+url;
    }

  }

};

var xullisten = {
  listen_request: function(callback) { // analogue of chrome.extension.onRequest.addListener
    xulDocument.addEventListener("xul-query", function(event) {
      var node = event.target;
      if (!node || node.nodeType != Node.TEXT_NODE)
        return;

      var doc = node.ownerDocument;

      callback(JSON.parse(node.nodeValue), doc, function(response) {
        node.nodeValue = JSON.stringify(response);
        var event = doc.createEvent("HTMLEvents");
        event.initEvent("xul-response", true, false);
        return node.dispatchEvent(event);
      });
    }, false, true);
  },
 
  callback: function(request, sender, callback) {
    if (request.command == "set") {

           for (let k in request.data) {

              if (request.data.hasOwnProperty(k)) {
                 statement = dbConn.createStatement("SELECT * FROM storage WHERE key = :key;");
                 statement.params.key = k;
                 if (statement.executeStep()) { //TODO: chrome should be rewritten to async functions instead
                    //if key exist, update
                    statement.reset();
		    statement = dbConn.createStatement("UPDATE storage SET value=:value WHERE key=:key;");                 
                 } else {
                    //if key not exist - insert
                    statement.reset();
                    statement = dbConn.createStatement("INSERT INTO storage(key,value) VALUES(:key,:value);");
                 }
                 statement.params.key = k;
                 statement.params.value=request.data[k]
		 statement.execute(); //TODO: form a one request instead of chrome shit
              }
           }

      return callback(null);
    }
 
    if (request.command == "get") {
          let statement;
          var result = [];
          if (request.data == null) {
             statement = dbConn.createStatement("SELECT * FROM storage;");
             while (statement.executeStep()) {
  	 	result.push({[statement.row.key]:statement.row.value});
	     }	     
          } else {
            for (let k in request.data) { //TODO: Make a proper implementation to use only one request instead of a bunch
              if (request.data.hasOwnProperty(k)) {
                statement = dbConn.createStatement("SELECT * FROM storage WHERE key = :key;");
                statement.params.key = k;
                while (statement.executeStep()) {
                  result.push({[statement.row.key]:statement.row.value});
	        }
                statement.reset();
              }
            }
          }
      return callback(result);
    }

    if (request.command == "remove") {

           for (let k in request.data) {

              if (request.data.hasOwnProperty(k)) {
                 statement = dbConn.createStatement("DELETE FROM storage WHERE key = :key);"); //TODO: do one request instead of this
                 statement.params.key = k;
                 statement.execute();
              }
           }
      return callback(null);
    }

    if (request.command == "clear") {
           statement = dbConn.createStatement("DELETE FROM storage;);"); //TODO: do one request instead of this
           statement.execute();
      return callback(null);
    }




    if (request.command == "fetch") {
      var xrequest = new XMLHttpRequest();
      xrequest.overrideMimeType("application/json");  //TODO: make async
      xrequest.open('GET', request.data.url, false);  // `false` makes the request synchronous
      xrequest.send(null);
      var responseData = { "url":request.data.url, "status":xrequest.status, "statusText":xrequest.statusText, "ok": true, "body":xrequest.response }; 
      callback(responseData);
    }
    if (request.command == "message") {
      if (chrome.listener!=null){
        chrome.listener(request.data,{"tab":true},callback)
      } else {
        console.warn("listener is not set!");
	callback(null);
      }
      return;

    }      
    if (request.command == "options") {
      gBrowser.selectedTab=gBrowser.addTab("chrome://augmentedsteamlegacy/content/AugmentedSteam/options.html");
      return callback(null);
    }

 
    return callback(null);
  }
  }

  xullisten.listen_request(xullisten.callback);
