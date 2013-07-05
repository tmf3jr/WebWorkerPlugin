/**
 * Definition of OData Worker message classes.
 * 
 * ODataRequestMessage = {
 * 	 {string}name : "OData.setUri" | "OData.setAuthentication" |
 *                  "OData.getCount" | "OData.getList",
 *   {object}data : {
 *   	//setUri
 * 	 	{string}uri: OData service URI
 * 
 * 	    //setAuthentication
 * 	    {string}user: user for BASIC authentication
 *      {string}password: password for BASIC authentication
 *      
 *      //getODataCount, getODataList
 *      {string}query: OData query
 * 	 }
 * }
 * 
 * When ODataRequestMessage is posted with "OData.getCount" or "OData.getList",
 * worker will back the message.
 * WorkerMessage = {
 * 	 {string}name     :  message event name,
 * 	 {string}status   : "completed" | "failed" | "info" | "debug",
 *   {object}[result] :  event specific result,
 *     Number for "OData.getCount", Object for "OData.getList"
 * }
 */


/**
 * Message class from main thread to worker
 * @param {object} [source] value of message
 */
var ODataRequestMessage = function(source) {
	//extend from source object
	this.extend(source);
};
/** OData request message name enum */
ODataRequestMessage.NAMES = {
	SET_URI:            "OData.setUri",
	SET_AUTHENTICATION: "OData.setAuthentication",
	GET_COUNT:          "OData.getCount",
	GET_LIST:           "OData.getList",
};
ODataRequestMessage.prototype = new PostingMessage({
	data: {
		uri: "",
		user: null,
		password: null,
		query: ""
	}
});
