(function(){
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

  var request = new XMLHttpRequest();
  request.overrideMimeType("application/json");  //TODO: make async
  request.open('GET', 'chrome://AugmentedSteamLegacy/content/AugmentedSteam/manifest.json', false);  // `false` makes the request synchronous
  request.send(null);
  var json = JSON.parse(request.responseText);

var baseDocument = document;

var environment = {
  "document": baseDocument.implementation.createHTMLDocument(),
  "xulDocument": baseDocument,
  "dbConn": dbConn
};
Services.scriptloader.loadSubScript("chrome://AugmentedSteamLegacy/content/chrome_xul.js",environment);
Services.scriptloader.loadSubScript("chrome://AugmentedSteamLegacy/content/storage.js",environment);
for(var i = 0; i<json.background.scripts.length; i++) {
  let bgscript = json.background.scripts[i];
  Services.scriptloader.loadSubScript("chrome://AugmentedSteamLegacy/content/AugmentedSteam/"+bgscript,environment);
}

window.addEventListener("load", function load(event){
  window.removeEventListener("load", load, false); //remove listener, no longer needed
  myExtension.init();  
},false);

var myExtension = {
  init: function() {
    var appcontent = document.getElementById("appcontent");   // browser
    if(appcontent){
      appcontent.addEventListener("DOMContentLoaded", myExtension.onPageLoad, true);
    }
  },

  onPageLoad: function(aEvent){
    var doc = aEvent.originalTarget; // doc is document that triggered "onload" event
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
            let sandbox = Components.utils.Sandbox(doc.defaultView.wrappedJSObject, {
              "sandboxPrototype": doc.defaultView.wrappedJSObject,
              "wantGlobalProperties":["fetch"],
              "wantXrays": false
            });
            Services.scriptloader.loadSubScript("chrome://AugmentedSteamLegacy/content/chrome.js",sandbox);//doc.defaultView.wrappedJSObject);
            if (content_script.js) {
              for(let i = 0; i<content_script.js.length; i++) {          
                let script = content_script.js[i];
                let xmlhttp = new XMLHttpRequest();    //TODO: make async
                xmlhttp.overrideMimeType("text/plain");
                xmlhttp.open("GET", "chrome://AugmentedSteamLegacy/content/AugmentedSteam/"+script, false);
                xmlhttp.send();
                let scriptContent = xmlhttp.responseText;
                Components.utils.evalInSandbox(scriptContent,sandbox,"latest","chrome://AugmentedSteamLegacy/content/AugmentedSteam/"+script,1);
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

    
    // add event listener for page unload 
    //aEvent.originalTarget.defaultView.addEventListener("unload", function(event){ myExtension.onPageUnload(event); }, true);
  },

  //onPageUnload: function(aEvent) {
  // do something
  //}
};
})();