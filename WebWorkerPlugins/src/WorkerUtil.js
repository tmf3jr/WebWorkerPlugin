(function() {
	/**
	 * Dispatch message from worker
	 * @private
	 */
	function _dispatchMessage(event) {
		var message = event.data; //as WorkerMessage
		if (message.status === WorkerMessage.STATUS.DEBUG) {
			console.debug(message);
		}else if (message.status === WorkerMessage.STATUS.INFO) {
				console.info(message);
		}else{
			//invoke corresponding methods
			var handler = this.handlers[message.name];
			if (handler) {
				handler(message);
			}else{
				//error when handler is not defined
				console.error("undefined message event " + message.name);
			}
		}
	}
	
	/**
	 * Default error handler
	 * @private
	 */
	function _printError(error) {
		console.error(error);
	}

	/**
	 * Add message event handler
	 * @param {String}name
	 * @param {Function}handler function handler({WorkerMessage}message)
	 */
	function _addMessageHandler(name, handler) {
		this.handlers = this.handlers || {};
		this.handlers[name] = handler;
	}

	/**
	 * Remove message event handler
	 * @param {String}name
	 */
	function _removeMessageHandler(name) {
		this.handlers = this.handlers || {};
		delete this.handlers[name];
	}

	Worker.prototype.onmessage = _dispatchMessage;
	Worker.prototype.on = _addMessageHandler;
	Worker.prototype.off = _removeMessageHandler;
	Worker.prototype.handlers = {};
	
	/**
	 * Creates a new worker with default event handlers
	 * @param {String}url worker script URL
	 * @returns {Worker}
	 */
	Worker.create = function(url) {
		var worker = new Worker(url);
		worker.onmessage = _dispatchMessage;
		worker.onerror = _printError;
		return worker;
	};
})();
