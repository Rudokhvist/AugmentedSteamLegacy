var xulconnect = {
        send_request: function(data, callback) { // analogue of chrome.extension.sendRequest
          var request = document.createTextNode(JSON.stringify(data));
          request.addEventListener("xul-response", function resp(event) {
            request.removeEventListener("xul-response", resp, false); //remove listener, no longer needed
            request.parentNode.removeChild(request);
            if (callback) {
               var response = JSON.parse(request.nodeValue);
              callback(response);
            }
          }, false);

          document.head.appendChild(request);

          var event = document.createEvent("HTMLEvents");
          event.initEvent("xul-query", true, false);
          request.dispatchEvent(event);
        },

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
      xulconnect.send_request({"command":"message","data":message},callback);
      return;
    },

    getURL: function (url){
      var result=url.startsWith("/")?"resource://augmentedsteamlegacy/AugmentedSteam"+url : "resource://augmentedsteamlegacy/AugmentedSteam/"+url; 
      return result;
    }

  }

};

if (!oldfetch) {
  var oldfetch = fetch;
  fetch = function (url) {
    var domain = url.replace('http://','').replace('https://','').split(/[/?#]/)[0];
    var curdomain = window.location.toString().replace('http://','').replace('https://','').split(/[/?#]/)[0];
    var allowedurls = domain.endsWith("steampowered.com") || domain.endsWith("steamcommunity.com") || domain.endsWith("isthereanydeal.com");
    if (url.startsWith("resource:")||((domain!=curdomain)&&allowerdurls)) {
       return new Promise (function(resolve, reject) {         
         xulconnect.send_request({"command":"fetch","data":{"url":url}},function(response) {
           if (response.status == 200) {
             response.json = function(){
                return JSON.parse(this.body);
		};
             response.text = function(){
                return this.body;
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
     return oldfetch(url);
    }
  };
};

function ShowOptions() {
         xulconnect.send_request({"command":"options"},null);
}

var menuUpdater = function (){
  var menuitem = document.querySelector("#es_popup > div:nth-child(1) > a:nth-child(1)");
  if (menuitem && !menuitem.onclick) {
    menuitem.onclick=ShowOptions;
    window.removeEventListener("load",menuUpdater,false);
  }
}
window.addEventListener("load", menuUpdater,false);