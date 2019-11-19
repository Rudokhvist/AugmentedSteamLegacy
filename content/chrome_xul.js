var chrome = {
  listener: null,

  storage : { 

    sync: false,

    local: {
        set : function (data,callback){
           //console.log("set xul");
           //console.log(data);

           
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
//           xulconnect({"command":"set","data":data},callback);
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
          //console.log("get xul");
          //console.log(result);

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
          //console.log("addlistener");
          //console.log(chrome.listener);
          //console.log(this.listener);
          //console.log(onChange);
	  chrome.listener = onChange;
          //console.log(chrome.listener);
          //console.log(this.listener);
          return;
        }
    },

    getURL: function (url){
      return url.startsWith("/")?"resource://augmentedsteamlegacy/AugmentedSteam"+url : "resource://augmentedsteamlegacy/AugmentedSteam/"+url;
    }

  }

};

