/**
 * This is worker plug-in to add functionality for posting or receiving message.<br/>
 * Following methods are added to worker under "self.base" namespace.<br/>
 * <ul>
 * 	 <li>postMessage({String}status, {Object}result, {MessageEvent}[receivedMessage])</li>
 *   <li>postCompleted({Object}result, {MessageEvent}[receivedMessag])</li>
 *   <li>postFailed({Object}result, {MessageEvent}[receivedMessag])</li>
 *   <li>postSuccess({Object}result, {MessageEvent}[receivedMessag])</li>
 *   <li>postInfo({Object}result, {MessageEvent}[receivedMessag])</li>
 *   <li>postDebug({Object}result, {MessageEvent}[receivedMessag])</li>
 *   <li>addHandler({String}name, {Function}handler)</li>
 *   <li>addHandlers({Object}handlers)</li>
 *   <li>on({String}name, {Function}handler)</li>
 *   <li>removeHandler({String}name)</li>
 *   <li>removeHandlers({String[]}nameList)</li>
 *   <li>off({String}name)</li>
 * </ul>
 * Message event handler should have function signature below
 * function handler({IndicationMessage}receivedMessage)
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
	 * Dispatch message to appropriate handler with IndicationMessage.
	 * This method assumes to be assigned as "onmessage" event handler
	 * @private
	 * @param {MessageEvent} event posted message
	 */
	function _dispatchMessage(event) {
		var receivedMessage = event.data; //as IndicationMessage
		$.base.postDebug("received message: " + JSON.stringify(receivedMessage));
		//invoke corresponding methods
		var handler = _handlers[receivedMessage.name];
		if (handler) {
			handler(receivedMessage);
		}else{
			//post error message if handler is not defined
			$.base.postFailed("undefined message event", receivedMessage);
		}
	};

	//message event handler ---------------------------------------------------
	//assign root message handler
	$.onmessage = _dispatchMessage;

	//public methods ----------------------------------------------------------
	/**
	 * "base" namespace
	 * @public
	 */
	$.base = {
		//utility methods for posting messages --------------------------------
		/**
		 * Post WorkerMessage to listener
		 * @param {String}status
		 * @param {Object}result
		 * @param {IndicationMessage}[receivedMessage]
		 */
		postMessage: function(status, result, receivedMessage) {
			var name = (receivedMessage) ? receivedMessage.name : "undefined";
			var message = new WorkerMessage({
				name: name,
				status: status,
				result: result
			});
			$.postMessage(message);
		},
		/**
		 * Post WorkerMessage as completed
		 * @param {Object}result
		 * @param {IndicationMessage}[receivedMessage]
		 */
		postCompleted: function(result, receivedMessage) {
			$.base.postMessage(WorkerMessage.STATUS.COMPLETED, result, receivedMessage);
		},
		/**
		 * Post WorkerMessage as failed
		 * @param {Object}result
		 * @param {IndicationMessage}[receivedMessage]
		 */
		postFailed: function(result, receivedMessage) {
			$.base.postMessage(WorkerMessage.STATUS.FAILED, result, receivedMessage);
		},
		/**
		 * Post WorkerMessage as success
		 * @param {Object}result
		 * @param {IndicationMessage}[receivedMessage]
		 */
		postSuccess: function(result, receivedMessage) {
			$.base.postMessage(WorkerMessage.STATUS.SUCCESS, result, receivedMessage);
		},
		/**
		 * Post WorkerMessage for information
		 * @param {Object}result
		 * @param {IndicationMessage}[receivedMessage]
		 */
		postInfo: function(result, receivedMessage) {
			$.base.postMessage(WorkerMessage.STATUS.INFO, result, receivedMessage);
		},
		/**
		 * Post WorkerMessage for debug
		 * @param {Object}result
		 * @param {IndicationMessage}[receivedMessage]
		 */
		postDebug: function(result, receivedMessage) {
			$.base.postMessage(WorkerMessage.STATUS.DEBUG, result, receivedMessage);
		},
		
		//message event handler -----------------------------------------------
		/**
		 * Add message event handler
		 * @param {String}name name of message event
		 * @param {Function}handler message handler
		 * handler function should have signature below,
		 * function handler({IndicationMessage}receivedMessage)
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
		 * @see addHandler
		 */		
		on: function(name, handler) {
			$.base.addHandler(name, handler);
		},
		/**
		 * Remove message event handler
		 * @param {String}name
		 */
		removeHandler: function(name) {
			delete _handlers[name];
		},
		/**
		 * Remove specified message event handlers, or remove all if nameList is omitted
		 * @param {String[]|Object}[nameList] array of removing handler names
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
		 * @see removeHandler
		 */
		off: function(name) {
			$.base.removeHandler(name);
		}
	};
	
})(self);

