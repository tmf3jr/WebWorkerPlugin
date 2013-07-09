/*
 * Definition of message classes to communicate with worker
 */

/**
 * Abstract message class
 * @class Abstract message
 * @param {object}[source] value of message
 * properties are copied from source into this object
 */
function AbstractMessage(source) {
	//extend from source object
	this.extend(source);
};
/** Name of message event */
AbstractMessage.prototype.name = "undefined";
/** Apply source properties to this object */
AbstractMessage.prototype.extend = function(source) {
	if (source) {
		for (var prop in source) {
			this[prop] = source[prop];
		}
	}
};


/**
 * This message indicates task to worker
 * @class Message indicates task for worker
 * @param {object}[source] value of message
 * IndicationMessage is plain object that can be converted to JSON string.<br/>
 * Object notation is below.<br/>
 * <code>
 * IndicationMessage = {
 * 	 {String}name   : message event name,
 * 	 {Object}[data] : event specific data
 * }
 * </code>
 */
function IndicationMessage(source) {
	//extend from source object
	this.extend(source);
};
/** inherits AbstractMessage */
IndicationMessage.prototype = new AbstractMessage({
	data: {}
});

/**
 * This is message class sent by worker.
 * Event listener including main thread can receive the message by using
 * Worker.onmessage event.
 * @class Message send by worker
 * @param {Object}[source] value of message
 * WorkerMessage is plain object that can be converted to JSON string.<br/>
 * Object notation is below.<br/>
 * <code>
 * WorkerMessage = {
 * 	 {String}name     :  message event name,
 * 	 {String}status   : "completed" | "failed" | "info" | "debug",
 *   {Object}[result] :  event specific result
 * }
 * </code>
 */
function WorkerMessage(source) {
	//extend from source object
	this.extend(source);
};
/** worker status enum */
WorkerMessage.STATUS = {
	/** Worker has completed its task */
	COMPLETED : "completed",
	/** Worker stops its task with failed status */
	FAILED: "failed",
	/** Information for message listener */
	INFO : "info",
	/** for debugging */
	DEBUG: "debug",
};
/** inherits AbstractMessage */
WorkerMessage.prototype = new AbstractMessage({
	status: WorkerMessage.STATUS.DEBUG,
	reuslt: {}
});
