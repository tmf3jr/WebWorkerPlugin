/**
 * This is worker plug-in to add functionality of posting or receiving message.
 * Following methods will be added to worker.
 * self.base = {
 *   function postMessage(receivedMessage, status, result)
 *   function postCompleted(receivedMessage, result)
 *   function postFailed(receivedMessage, result)
 *   function postInfo(receivedMessage, result)
 *   function postDebug(receivedMessage, result)
 *   function addHandler(name, handler)
 *   function addHandlers(handlers)
 *   function on(name, handler)
 *   function removeHandler(name)
 *   function removeHandlers(nameList)
 *   function off(name)
 * }
 */


//plug-in implementation ------------------------------------------------------
(function($) {
	//constant values and configurations ------------------------------------------
	var DEPENCENCIES = ["worker.base.message.js"];
	
	//import dependency
	for (var i = 0; i < DEPENCENCIES.length; i++) {
		importScripts(DEPENCENCIES[i]);		
	}
	//message event handler collection
	var _handlers = {};

	//private methods ---------------------------------------------------------
	/**
	 * dispatch message to appropriate handler with PostingMessage
	 * @param {MessageEvent}event posted message
	 */
	function _dispatchMessage(event) {
		var receivedMessage = event.data; //as PostingMessage
		//invoke corresponding methods
		var handler = _handlers[receivedMessage.name];
		if (handler) {
			handler(receivedMessage);
		}else{
			//post error message if handler is not defined
			$.base.postFailed(receivedMessage, "undefined message event name");
		}
	};

	//message event handler ---------------------------------------------------
	//assign root message handler
	$.onmessage = _dispatchMessage;

	//public methods ----------------------------------------------------------
	$.base = {
		//message posting utility methods -------------------------------------
		/**
		 * Post message to message listener
		 * @param {PostingMessage}receivedMessage
		 * @param {string}status 
		 * @param {object}result
		 */
		postMessage: function(receivedMessage, status, result) {
			var name = "undefined";
			if (receivedMessage) {
				name = receivedMessage.name;
			}
			var message = new WorkerMessage({
				name: name,
				status: status,
				result: result
			});
			$.postMessage(message);
		},
		/**
		 * Post completed message
		 * @param {PostingMessage}receivedMessage
		 * @param {object}result
		 */
		postCompleted: function(receivedMessage, result) {
			$.base.postMessage(receivedMessage, WorkerMessage.STATUS.COMPLETED, result);
		},
		/**
		 * Post failed message
		 * @param {ReceivedMessage}receivedMessage
		 * @param {object}result
		 */
		postFailed: function(receivedMessage, result) {
			$.base.postMessage(receivedMessage, WorkerMessage.STATUS.FAILED, result);
		},
		/**
		 * Post info message
		 * @param {ReceivedMessage}receivedMessage
		 * @param {object}result
		 */
		postInfo: function(receivedMessage, result) {
			$.base.postMessage(receivedMessage, WorkerMessage.STATUS.INFO, result);
		},
		/**
		 * Post debug message
		 * @param {ReceivedMessage}receivedMessage
		 * @param {object}result
		 */
		postDebug: function(receivedMessage, result) {
			$.base.postMessage(receivedMessage, WorkerMessage.STATUS.DEBUG, result);
		},
		
		//message event handler -----------------------------------------------
		/**
		 * Add message event handler
		 * @param {string}name name of message event
		 * @param {Function}handler message handler
		 * handler function should have signature below,
		 * 	function({PostingMessage}receivedMessage) {...}
		 */
		addHandler: function(name, handler) {
			_handlers[name] = handler;
		},
		/**
		 * Add multiple message handlers
		 * @param {object}handlers
		 * handlers should be the object like below
		 * {name1: handler1, name2: handler2, ...}
		 */
		addHandlers: function(handlers) {
			for (var name in handlers) {
				_handlers[name] = handlers[name];
			}
		},
		/**
		 * Add message event handler. 
		 * This is alias of addHandler
		 */		
		on: function(name, handler) {
			$.base.addHandler(name, handler);
		},
		/**
		 * Remove message event handler
		 * @param {string}name
		 */
		removeHandler: function(name) {
			delete _handlers[name];
		},
		/**
		 * Remove specified message event handlers, or remove all if nameList is omitted
		 * @param {Array or Object}[nameList] array of removing handler names
		 * 
		 */
		removeHandlers: function(nameList) {
			if (nameList) {
				//make sure names are array of handler names
				var names = [];
				if (!(nameList instanceof Array)) {
					for (var p in nameList) {
						names.push(p);
					}
				}else{
					names = nameList;
				}
				//remove handlers
				for (var i = 0; i < nameList.length; i++) {
					var name = nameList[i];
					delete _handlers[name];
				}
			}else{
				_handler = {};
			}
		},
		/**
		 * Remove message event handler.
		 * This is alias of removeHandler
		 */
		off: function(name) {
			$.base.removeHandler(name);
		}
	};
	
})(self);

