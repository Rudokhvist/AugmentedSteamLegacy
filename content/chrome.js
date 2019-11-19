var xulconnect = {
        send_request: function(data, callback) { // analogue of chrome.extension.sendRequest
          var request = document.createTextNode(JSON.stringify(data));
          console.log("request in chrome");
          console.log(data);
          //console.log(JSON.stringify(data));
          request.addEventListener("xul-response", function resp(event) {
            request.removeEventListener("xul-response", resp, false); //remove listener, no longer needed
            request.parentNode.removeChild(request);
            console.log("response in chrome");
            console.log(request.nodeValue);
            if (callback) {
              console.log(request);
              try {
               var response = JSON.parse(request.nodeValue);
              } catch(err){
		console.log(err);
              }
              callback(response);
            }
          }, false);

          document.head.appendChild(request);

          var event = document.createEvent("HTMLEvents");
          event.initEvent("xul-query", true, false);
          request.dispatchEvent(event);
        },

//        callback: function(response) {
//          return alert("response: " + (response ? response.toSource() : response));
//        }
      };

var chrome = {

  dbConn : null,
  storage : { 

    sync: false,

    local: {
        set : function (data,callback){
           xulconnect.send_request({"command":"set","data":data},callback);
        },
        get : function (data,callback) {
           xulconnect.send_request({"command":"get","data":data},callback);
        },

        remove : function (data,callback) {
           xulconnect.send_request({"command":"remove","data":data},callback);
        },

        clear : function (callback) {
           xulconnect.send_request({"command":"clear"},callback);
        },


        QUOTA_BYTES: 102400,

	getBytesInUse : function (callback){
		callback(10);	//nobody uses it anyway.	
	}

    },

    onChanged: {
        addListener: function (onChange){
          return null;
        },
    },

  },
  runtime : {

    lastError: false, //TODO: add proper error handling maybe?


    sendMessage: function (message, callback){
      //console.log("sendmessage");
      xulconnect.send_request({"command":"message","data":message},callback);
      return;
    },

    getURL: function (url){
      //console.log(url);
      //console.log(url.startsWith("/")?"resource://augmentedsteamlegacy"+url : "resource://augmentedsteamlegacy/"+url);
      return url.startsWith("/")?"resource://augmentedsteamlegacy/AugmentedSteam"+url : "resource://augmentedsteamlegacy/AugmentedSteam/"+url;
    }

  }

};

if (!oldfetch) {
  var oldfetch = fetch;
  fetch = function (url) {
    console.log("fetch is happening");
    console.log(window.location);
    var domain = url.replace('http://','').replace('https://','').split(/[/?#]/)[0];
    console.log("url:",url," domain:",domain," curdomain:",curdomain," allowedurls:",allowedurls);
    var curdomain = window.location.toString().replace('http://','').replace('https://','').split(/[/?#]/)[0];
    console.log("url:",url," domain:",domain," curdomain:",curdomain," allowedurls:",allowedurls);
    var allowedurls = domain.endsWith("steampowered.com") || domain.endsWith("steamcommunity.com") || domain.endsWith("isthereanydeal.com");
    console.log("url:",url," domain:",domain," curdomain:",curdomain," allowedurls:",allowedurls);
    if (url.startsWith("resource:")||((domain!=curdomain)&&allowerdurls)) {
     console.log("jurassic fetch");
       return new Promise (function(resolve, reject) {         
         xulconnect.send_request({"command":"fetch","data":{"url":url}},function(response) {
           //console.log(response);
           // This is called even on 404 etc
           // so check the status
           if (response.status == 200) {
             // Resolve the promise with the response text
             response.json = function(){
                return JSON.parse(this.body);
//                   return new Promise (function(resolve, reject) {
//                      resolve(this.body)
//                   });
		};
             response.text = function(){
                return JSON.stringify(this.body);
//                   return new Promise (function(resolve, reject) {
//                      resolve(JSON.stringify(this.body))
//                   });
		};

             resolve(response);
           }
           else {
             // Otherwise reject with the status text
             // which will hopefully be a meaningful error
             reject(Error(response.statusText));
           }
         });
       });
    } else {
     console.log("classic fetch");
     return oldfetch(url);
    }
  };
};