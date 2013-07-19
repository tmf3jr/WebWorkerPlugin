/*
 * Definition of message classes to communicate with worker
 */

function deepCopy(dest, src) {
	for (var prop in src) {
		if (src[prop] && (typeof src[prop] === "object")) {
			switch (src[prop].constructor) {
			case Array:
				dest[prop] = (dest.hasOwnProperty(prop)) ? dest[prop] : [];
			case Object:
				dest[prop] = (dest.hasOwnProperty(prop)) ? dest[prop] : {};
				deepCopy(dest[prop], src[prop]);
				break;
			default:
				dest[prop] = src[prop];
			}
		}else{
			if (src[prop]) {
				dest[prop] = src[prop];
			}
		}
	}
	return dest;
};

function flatten(obj) {
    for(var prop in obj) {
    	if (typeof obj[prop] !== "function") {
            obj[prop] = obj[prop];    		
    	}
    }
    return obj;
}
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
	deepCopy(this, source);
	flatten(this);
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
 * 	 {String}status   : "completed" | "failed" | "success" | "info" | "debug",
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
	/** Worker succeeded and continues its task */
	SUCCESS: "success",
	/** Information for message listener */
	INFO : "info",
	/** for debugging */
	DEBUG: "debug",
};
/** inherits AbstractMessage */
WorkerMessage.prototype = new AbstractMessage({
	status: WorkerMessage.STATUS.DEBUG,
	result: {}
});
