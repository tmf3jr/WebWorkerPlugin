/*
 * Definition of message classes to communicate with worker OData plug-in.
 * This classes are depends on "worker.base.message.js" file.<br/>
 * <br/>
 * 
 ******************************************************************************
 * OData methods
 ****************************************************************************** 
 * Some of indication message may cause WorkerMessage as return of task.<br/>
 * These are content of result for task indication.
 * <ul>
 *   <li>"OData.getCount": {Number}</li>
 *   <li>"OData.getList": {Object[]}</li>
 * </ul>
 * 
 ******************************************************************************
 * dependency
 ****************************************************************************** 
 * <ul>
 *   <li>worker.base.message.js</li>
 * </ul>
 */

/**
 * This message requests to call OData service
 * @class This message requests to call OData service
 * @param {Object}[source] value of message
 * ODataRequestMessage is plain object inheriting IndicationMessage
 * that can be converted to JSON string.<br/>
 * Object notation is below.<br/>
 * <code>
 * ODataRequestMessage = {
 * 	 {String}name : "OData.setUri" | "OData.setAuthentication" |
 *                  "OData.getCount" | "OData.getList",
 *   {Object}data : {
 *   	//for setUri
 * 	 	{String}uri: OData service URI
 * 
 * 	    //for setAuthentication
 * 	    {String}user: user for BASIC authentication
 *      {String}password: password for BASIC authentication
 *      
 *      //for getODataCount, getODataList
 *      {String}query: OData query
 * 	 }
 * }
 * </code>
 */
function ODataRequestMessage(source) {
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
ODataRequestMessage.prototype = new IndicationMessage({
	data: {
		uri: "",
		user: null,
		password: null,
		query: ""
	}
});
