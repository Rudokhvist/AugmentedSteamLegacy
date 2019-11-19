Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");

  String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
  };


let file = FileUtils.getFile("ProfD", ["augmentedsteamlegacydb.sqlite"]);
var dbConn = Services.storage.openDatabase(file); // Will also create the file if it does not exist

if (!dbConn.tableExists("storage")) {
 dbConn.createTable("storage","key STRING UNIQUE, value STRING");
}

//  var k = document.implementation.createHTMLDocument();
//  Services.scriptloader.loadSubScript("chrome://AugmentedSteamLegacy/content/test2.js");
//  var jopa = {document:k};
//  Services.scriptloader.loadSubScript("chrome://AugmentedSteamLegacy/content/test2.js",jopa);
  var fakeDocument = document.implementation.createHTMLDocument();
  var environment = {"document":fakeDocument};
  var request = new XMLHttpRequest();
  request.overrideMimeType("application/json");  
  request.open('GET', 'chrome://AugmentedSteamLegacy/content/AugmentedSteam/manifest.json', false);  // `false` makes the request synchronous
  request.send(null);
  var json = JSON.parse(request.responseText);
  Services.scriptloader.loadSubScript("chrome://AugmentedSteamLegacy/content/chrome_xul.js",environment);
  Services.scriptloader.loadSubScript("chrome://AugmentedSteamLegacy/content/storage.js",environment);
  for(var i = 0; i<json.background.scripts.length; i++) {
        let bgscript = json.background.scripts[i];
//        console.log("loading bg script:","chrome://AugmentedSteamLegacy/content/AugmentedSteam/"+bgscript);
        Services.scriptloader.loadSubScript("chrome://AugmentedSteamLegacy/content/AugmentedSteam/"+bgscript,environment);
  }
//  console.log(Steam);
//  console.log("das ist test");
//  Services.scriptloader.loadSubScript("chrome://AugmentedSteamLegacy/content/test.js");

var xullisten = {
  listen_request: function(callback) { // analogue of chrome.extension.onRequest.addListener
    document.addEventListener("xul-query", function(event) {
      var node = event.target;
      if (!node || node.nodeType != Node.TEXT_NODE)
        return;

      var doc = node.ownerDocument;
      callback(JSON.parse(node.nodeValue), doc, function(response) {
        console.log("response in xul");
        console.log(response);
        node.nodeValue = JSON.stringify(response);

        var event = doc.createEvent("HTMLEvents");
        event.initEvent("xul-response", true, false);
        return node.dispatchEvent(event);
      });
    }, false, true);
  },
 
  callback: function(request, sender, callback) {
    if (request.command == "set") {
           //console.log("set");
           //console.log(request.data);

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
      //console.log("get");
      //console.log(result);
      return callback(result);
    }

    if (request.command == "remove") {
           //console.log("remove");
           //console.log(request.data);

           for (let k in request.data) {

              if (request.data.hasOwnProperty(k)) {
                 statement = dbConn.createStatement("DELETE FROM storage WHERE key = :key);"); //TODO: do one request instead of this shit
                 statement.params.key = k;
                 statement.execute();
              }
           }
      return callback(null);
    }

    if (request.command == "clear") {
           //console.log("clear");
           statement = dbConn.createStatement("DELETE FROM storage;);"); //TODO: do one request instead of this shit
           statement.execute();
      return callback(null);
    }




    if (request.command == "fetch") {
      //console.log("xul");
      //console.log(request);
      var xrequest = new XMLHttpRequest();
      xrequest.overrideMimeType("application/json");  
      xrequest.open('GET', request.data.url, false);  // `false` makes the request synchronous
      xrequest.send(null);
      //console.log("inner fetch");
      //console.log(xrequest);
      var responseData = { "url":request.data.url, "status":xrequest.status, "statusText":xrequest.statusText, "ok": true, "body":xrequest.response }; 
      callback(responseData);
//      var result = fetch(request.data);
//      return function(){
//      result.done(callback(response));
//      };
    }
    if (request.command == "message") {
      console.log("xul message");
      console.log(request);
      if (chrome.listener!=null){
        chrome.listener(request.data,{"tab":true},callback)
      } else {
	callback(null);
      }
      return;

    }      

 
    return callback(null);
  }
  }

  xullisten.listen_request(xullisten.callback);

  window.addEventListener("load", function load(event){
    window.removeEventListener("load", load, false); //remove listener, no longer needed
    myExtension.init();  
  },false);

  var callback = function(chrome) {
  };

  var myExtension = {
    init: function() {
      var appcontent = document.getElementById("appcontent");   // browser
      if(appcontent){
        appcontent.addEventListener("DOMContentLoaded", myExtension.onPageLoad, true);
      }
    },

  onPageLoad: function(aEvent){
    var doc = aEvent.originalTarget; // doc is document that triggered "onload" event
//    doc.defaultView.wrappedJSObject["chrome"] = chrome;
    
    // do something with the loaded page.
    // doc.location is a Location object (see below for a link).
    // You can use it to make your code executed on certain pages only.
    for(let i = 0; i<json.content_scripts.length; i++) {
      let content_script = json.content_scripts[i];
      for(let i = 0; i<content_script.matches.length; i++) {
        let match = content_script.matches[i];
        var regmatch = match.replaceAll("\\.","\\.").replaceAll("\\/","\\/").replaceAll("\\*",".*");
        var regexMatch = new RegExp(regmatch);
        if (doc.location.href.match(regexMatch)!=null) {
          var exec = true;
          if (content_script.exclude_matches) {
            for(let i = 0; i<content_script.exclude_matches.length; i++) {          
              let exclude = content_script.exclude_matches[i];
              var regExclude = exclude.replaceAll("\\.","\\.").replaceAll("\\/","\\/").replaceAll("\\*",".*");
              var regexExclude = new RegExp(regExclude);	
              if (doc.location.href.match(regexExclude)!=null) {
                exec = false;
                break;
              }
            }
          }
          if (exec) {
            //console.log("owo wat is dat?");
            //console.log(doc);
            //console.log(doc.defaultView);
            //console.log(doc.defaultView.wrappedJSObject);
            let sandbox = Components.utils.Sandbox(doc.defaultView.wrappedJSObject, {
              "sandboxPrototype": doc.defaultView.wrappedJSObject,
              "wantGlobalProperties":["fetch"],
              "wantXrays": false
            });
            Services.scriptloader.loadSubScript("chrome://AugmentedSteamLegacy/content/chrome.js",sandbox);//doc.defaultView.wrappedJSObject);
            if (content_script.js) {
              for(let i = 0; i<content_script.js.length; i++) {          
                let script = content_script.js[i];
                let xmlhttp = new XMLHttpRequest();
                xmlhttp.overrideMimeType("text/plain");
                xmlhttp.open("GET", "chrome://AugmentedSteamLegacy/content/AugmentedSteam/"+script, false);
                xmlhttp.send();
                console.log(xmlhttp);
                let scriptContent = xmlhttp.responseText;
		//console.log(scriptContent);
//                console.log("loading content script:","chrome://AugmentedSteamLegacy/content/AugmentedSteam/"+script);
                Components.utils.evalInSandbox(scriptContent,sandbox,"latest","chrome://AugmentedSteamLegacy/content/AugmentedSteam/"+script,1);
                //Services.scriptloader.loadSubScript("chrome://AugmentedSteamLegacy/content/"+script,sandbox);//doc.defaultView.wrappedJSObject);
              }
            }
            if (content_script.css) {
              for(let i = 0; i<content_script.css.length; i++) {
                let css = content_script.css[i];
                if (css=="css/enhancedsteam-chrome.css") {
			css="enhancedsteam-legacy.css";
		} else {
                   css = "AugmentedSteam/"+css;
                }
                var fileref = doc.createElement("link");
                fileref.rel = "stylesheet";
                fileref.type = "text/css";
                fileref.href = "resource://augmentedsteamlegacy/"+css;
                doc.getElementsByTagName("head")[0].appendChild(fileref);
              }
            }
          }
        }	
      }
    }
   
    //if(doc.location.href.search("forum") > -1)
      //console.log(doc.location.href);
    
    // add event listener for page unload 
    aEvent.originalTarget.defaultView.addEventListener("unload", function(event){ myExtension.onPageUnload(event); }, true);
  },

  onPageUnload: function(aEvent) {
    // do something
  }
  };
