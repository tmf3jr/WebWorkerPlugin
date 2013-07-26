/**
 * OData worker plug-in implementation.<br/>
 * Currently, $count and GET operations are implemented.
 * Following methods will be added to worker under "self.odata" namespace.<br/>
 * <ul>
 *   <li>setUri({String}uri)</li>
 * 	 <li>setAuthentication({String}user, {String}password)</li>
 *   <li>getCount({String}query, {Function}callback)</li>
 *   <li>function getList({String}query, {Function}callback)</li>
 * </ul>
 * Corresponding message event handlers will also assigned for events below.<br/>
 * <code>
 * ODataRequestMessage.NAMES = {
 * 	 SET_URI:            "OData.setUri",
 *   SET_AUTHENTICATION: "OData.setAuthentication",
 *   GET_COUNT:          "OData.getCount",
 *   GET_LIST:           "OData.getList",
 * };
 * </code>
 */


//plug-in implementation ------------------------------------------------------
(function($) {
	//constant values and configurations ------------------------------------------
	var DEPENDENCIES = ['datajs-1.1.1beta2.min.js',
	                    'worker.base.js', 'worker.odata.message.js'];
	var FETCH_PER_REQUEST = 50;

	//import dependency
	for (var i = 0; i < DEPENDENCIES.length; i++) {
		importScripts(DEPENDENCIES[i]);		
	}
	
	
	//private variables and methods -------------------------------------------
	var _uri = "";
	var _user = "";
	var _password = "";

	/**
	 * Recursive read data, then finally invoke callback
	 * @private
	 * @param {String}query OData query, can be null
	 * @param {Function}success invoked when completed successfully
	 * @param {Function}error invoked when error occurred, can be null
	 * @param {Number}skip $skip parameter of OData query
	 * @param {Number}max maximum number of OData entities to be read
	 * @param {Object[]}result stores OData entities
	 * callback function should have signature below.<br/>
	 * <ul>
	 *   <li>function success({Object[]}result)</li>
	 *   <li>function error({Error}error)</li>
	 * </ul>
	 */
	function _readData(query, success, error, skip, max, result) {
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
					_readData(query, success, error, skip, max, result);
				}, error);
		}else{
			//reached to last page, hence invoke callback and returns result
			success(result);
		}
	}

	//message event handlers
	function _handleSetUri(message) {
		$.odata.setUri(message.data.uri);
	}
	function _handleSetAuthentication(message) {
		$.odata.setAuthentication(message.data.user, message.data.password);
	}
	function _handleGetCount(message) {
		//get query if exists
		var query = null;
		if (message.data && message.data.query) {
			query = message.data.query;
		}
		//call OData service
		$.odata.getCount(query,
			function(count) { $.base.postSuccess(count, message);	},
			function(error) { $.base.postFailed(error, message); });
	}
	function _handleGetList(message) {
		//get query if exists
		var query = null;
		if (message.data && message.data.query) {
			query = message.data.query;
		}
		//call OData service
		$.odata.getList(query,
			function(result) { $.base.postSuccess(result, message); },
			function(error) { $.base.postFailed(error, message); });
	}	
	
	//public methods ----------------------------------------------------------
	/**
	 * "odata" namespace
	 * @public
	 */
	$.odata = {
		/**
		 * Set OData service URI
		 * @param {String}uri
		 */
		setUri: function(uri) {
			_uri = uri;
		},
		/**
		 * Set BASIC authentication user and password
		 * @param {String}user
		 * @param {String}password
		 */
		setAuthentication: function(user, password) {
			_user = user;
			_password = password;
		},
		
		/**
		 * Returns number of OData entities
		 * @param {String}query OData query string, can be null
		 * @param {Function}success invoked when OData service has completed
		 * @param {Function}[error] error handler
		 * callback function should have signature below,
		 * <ul>
		 *   <li>function success({Number}count)</li>
		 *   <li>function error({Error}error)</li>
		 * </ul>
		 */
		getCount: function(query, success, error) {
			//make sure OData service URI is already specified
			if (!_uri) {
				$.base.postFailed("Implementation Error: OData URI must be set first");
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
				success(count);
			}, error);
		},
		
		/**
		 * Returns array of OData entities
		 * @param {String}query OData query string, can be null
		 * @param {Function}success invoked when completed successfully
		 * @param {Function}[error] error handler
 		 * callback function should have signature below,
		 * <ul>
		 *   <li>function complete({Object[]}result)</li>
		 *   <li>function error({Error}error)</li>
		 * </ul>
		 */
		getList: function(query, success, error) {
			$.odata.getCount(query, function(count) {
				_readData(query, success, error, 0, count, []);
			}, error);
		},
		
	};

	//message event handler ---------------------------------------------------
	$.base.on(ODataRequestMessage.NAMES.SET_URI, _handleSetUri);
	$.base.on(ODataRequestMessage.NAMES.SET_AUTHENTICATION, _handleSetAuthentication);
	$.base.on(ODataRequestMessage.NAMES.GET_COUNT, _handleGetCount);
	$.base.on(ODataRequestMessage.NAMES.GET_LIST, _handleGetList);
})(self);
