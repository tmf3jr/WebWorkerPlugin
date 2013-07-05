/**
 * OData worker plug-in.
 * Currently, $count and GET operations are implemented.
 * Following methods will be added to worker.
 * self.odata = {
 *   function setUri(uri)
 *   function setAuthentication(user, password)
 *   function getCount(query, callback)
 *   function getList(query, callback)
 * }
 * Corresponding message event handlers will also assigned
 */

//constant values and configurations ------------------------------------------
var DATA_JS = 'datajs-1.1.1beta2.min.js';
var WORKER_JS = "worker.base.js";
var ODATA_MESSAGE_JS = "worker.odata.message.js";
var FETCH_PER_REQUEST = 50;

//plug-in implementation ------------------------------------------------------
(function($) {
	//import dependency
	importScripts(WORKER_JS);
	importScripts(ODATA_MESSAGE_JS);
	importScripts(DATA_JS);
	
	//private variables and methods -------------------------------------------
	var _uri = "";
	var _user = "";
	var _password = "";
	
	/**
	 * Recursive read data, then finally invoke callback
	 */
	function _readData(query, callback, skip, max, result) {
		if (skip < max) {
			//create query
			var url = _uri + "?$skip=" + skip + "&$top=" + FETCH_PER_REQUEST;
			if (query) {
				url += '&' + query;
			}
			var request = {
				//headers: object,
				requestUri: url, 
				method: "GET", 
				//data: object,
				user: _user,
				password: _password
			};			
			//get OData entities
			OData.read(request,
				function (data) {
					//concatenate result and read next page
					result = result.concat(data.results);
					skip = skip + FETCH_PER_REQUEST;
					_readData(query, callback, skip, max, result);
				});
		}else{
			//reached to last page, hence invoke callback and returns result
			callback(result);
		}
	}

	//message event handlers
	function _handleSetUri(message) {
		$.odata.setUri(message.data.uri);
	};
	function _handleSetAuthentication(message) {
		$.odata.setAuthentication(message.data.user, message.data.password);
	};
	function _handleGetCount(message) {
		//get query if exists
		var query = null;
		if (message.data && message.data.query) {
			query = message.data.query;
		}
		//call OData service
		$.odata.getCount(query, function(count) {
			$.base.postCompleted(message, count);
		});
	};
	function _handleGetList(message) {
		//get query if exists
		var query = null;
		if (message.data && message.data.query) {
			query = message.data.query;
		}
		//call OData service
		$.odata.getList(query, function(result) {
			$.base.postCompleted(message, result);
		});
	};	
	
	//public methods ----------------------------------------------------------
	$.odata = {
		/**
		 * Set OData service URI
		 * @param {string}uri
		 */
		setUri: function(uri) {
			_uri = uri;
		},
		/**
		 * Set BASIC authentication user and password
		 * @param {string}user
		 * @param {string}password
		 */
		setAuthentication: function(user, password) {
			_user = user;
			_password = password;
		},
		
		/**
		 * Returns number of OData entities
		 * @param {string}query OData query string, can be null
		 * @param {Function}callback invoked when OData service has completed
		 * callback function should have signature below,
		 * function({Number}count) {...}
		 */
		getCount: function(query, callback) {
			//make sure OData service URI is already specified
			if (!_uri) {
				$.base.postFailed("Implementation Error", "OData URI must be set first");
				return;
			}
			//build OData request
			var url = _uri + "/$count";
			if (query) {
				url += '?' + query;
			}
			var request = {
				headers: { Accept: "text/plain" },
				requestUri: url, 
				method: "GET", 
				//data: object,
				user: _user,
				password: _password
			};
			//read $count
			OData.read(request, function(data, response) {
				var count = new Number(data);
				callback(count);
			});
		},
		
		/**
		 * Returns array of OData entities
		 * @param {string}query
		 * @param {Function}callback
 		 * callback function should have signature below,
		 * function({Array}entities) {...}
		 */
		getList: function(query, callback) {
			$.odata.getCount(query, function(count) {
				_readData(query, callback, 0, count, []);
			});
		},
		
	};

	//message event handler ---------------------------------------------------
	$.base.on(ODataRequestMessage.NAMES.SET_URI, _handleSetUri);
	$.base.on(ODataRequestMessage.NAMES.SET_AUTHENTICATION, _handleSetAuthentication);
	$.base.on(ODataRequestMessage.NAMES.GET_COUNT, _handleGetCount);
	$.base.on(ODataRequestMessage.NAMES.GET_LIST, _handleGetList);
})(self);
