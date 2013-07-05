/**
 * Definition of Worker message classes.
 * 
 * This worker accepts posted message below.
 * PostingMessage = {
 * 	 {string}name   : message event name,
 * 	 {object}[data] : event specific data, this is optional
 * }
 * 
 * When worker posts message, it should be like this.
 * WorkerMessage = {
 * 	 {string}name     :  message event name,
 * 	 {string}status   : "completed" | "failed" | "info" | "debug",
 *   {object}[result] :  event specific result
 * }
 * 
 */


/**
 * Abstract message class
 * @param {object}[source] value of message
 */
var AbstractMessage = function(source) {
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
 * Message class from main thread to worker
 * @param {object}[source] value of message
 */
var PostingMessage = function(source) {
	//extend from source object
	this.extend(source);
};
/** inherits AbstractMessage */
PostingMessage.prototype = new AbstractMessage({
	data: {}
});

/**
 * Message class from worker to message event listener such as main thread
 * @param {object}[source] value of message
 */
var WorkerMessage = function(source) {
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
