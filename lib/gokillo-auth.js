/*#
 * @file gokillo-auth.js
 * @begin 16-Nov-2014
 * @author <a href="mailto:giuseppe.greco@gokillo.com">Giuseppe Greco</a>
 * @copyright 2014 <a href="http://gokillo.com">Gokillo</a>
 */

var authType = "Gok!llo";
var apiKey = null;

var GokilloAuthorization = function(appId, type, token) {
  this.appId = appId;
  this.type = type;
  this.token = token && token.trim() != "" ? token : null;
  this.tokenType = null;
  this.expirationTime = null;
};

GokilloAuthorization.prototype.apply = function(obj, authorizations) {
  var baseUrl = $('#input_baseUrl').val(); baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf('/'));
  var signature = null;

  var appId = this.appId;
  var type = this.type;
  var token = this.token;
  var tokenType = this.tokenType;
  var expirationTime = this.expirationTime;

  /*
  log("url = " + obj.url);
  log("method = " + obj.method);
  log("body = " + obj.body);
  */

  if (token == null || (tokenType == "BROWSE" && expirationTime <= Math.round(new Date().getTime() / 1000) + 120)) {
    $.ajax({
      type: "GET",
      url: baseUrl + "/auth/apps/native/" + appId + "/apikey",
      async: false,
      success: function(result) {
        apiKey = result.apiKey

      $.ajax({
        type: "POST",
        data: JSON.stringify({ principal: appId, secret: apiKey }),
        url: baseUrl + "/auth/apps/credentials",
        contentType: "application/json",
        async: false,
        success: function(result) {
          token = result.token;
          signature = CryptoJS.HmacSHA1(token + "GET " + baseUrl + "/auth/users/credentials", apiKey).toString(CryptoJS.enc.Base64);

        $.ajax({
          type: "GET",
          headers: { "Authorization": authType + " " + token + ":" + signature },
          url: baseUrl + "/auth/users/credentials",
          async: false,
          success: function(result) {
            tokentype = result.token.header.typ.split('/')[1];
            expirationTime = result.token.claims.exp;
        }})
      }})
    }});

    this.token = token;
    this.tokenType = tokenType;
    this.expirationTime = expirationTime;
  } else if (type == null) {
    signature = CryptoJS.HmacSHA1(token + "GET " + baseUrl + "/auth/users/credentials", apiKey).toString(CryptoJS.enc.Base64);

    $.ajax({
      type: "GET",
      headers: { "Authorization": authType + " " + token + ":" + signature },
      url: baseUrl + "/auth/users/credentials",
      async: false,
      success: function(result) { 
        tokenType = result.token.header.typ.split('/')[1];
        expirationTime = result.token.claims.exp;
    }});

    this.tokenType = tokenType;
    this.expirationTime = expirationTime;
  }

  if (!obj.body && obj.method != "GET") obj.body = "{}";
  var method = obj.method ? obj.method : "POST";
  signature = CryptoJS.HmacSHA1(token + method + " " + obj.url, apiKey).toString(CryptoJS.enc.Base64);

  if (type === "header") {
    obj.headers["Authorization"] = authType + " " + token + ":" + signature;
    return true;
  } else if (type === "query") {
    obj.url = obj.url + (obj.url.indexOf("?") > 0 ? "&" : "?") + "auth=" + encodeURIComponent(token + ":" + signature);
    return true;
  }
};
