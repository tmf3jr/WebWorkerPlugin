/**
 * Definition of IndexedDB Worker message classes.
 * 
 ****************************************************************************** 
 * Post or receive message 
 ****************************************************************************** 
 * IndexedDbRequestMessage = {
 *   {string}name : "IDB.setSchema" | "IDB.save" |
 *                  "IDB.read" | "IDB.readKeys" | "IDB.remove",
 *   data : {
 *   	schema: {
 *  		{string}objectStore : object store name,
 * 	 		{string}[index]     : object store index name
 *   	},
 *   	[query]: {
 *          {IDBKeyRange}range: query range             = null
 *          {string}direction: "next" | "prev"          = "next" 
 *   	}
 *   	{object or Array}[values]: values to be stored
 * 	 }
 * }
 * 
 * When IndexedDbRequestMessage is posted, worker will back the message.
 * WorkerMessage = {
 * 	 {string}name     :  message event name,
 * 	 {string}status   : "completed" | "failed" | "info" | "debug",
 *   {object}[result] :  event specific result,
 * }
 * 
 * 
 ****************************************************************************** 
 * database schema
 ****************************************************************************** 
 * When indexedDb creates or updates database, database schema is necessary.
 * This is the indexedDb creation schema.
 * 
 * IndexedDbObjectStoreIndexSchema = {
 *   {string}name: index name,
 *   {string or Array<string>}[keyPath]: key property, or index name if omitted
 *   [options] : {
 *     {boolean}unique: indicates key is unique                    = false
 *     {boolean}multiEntry: key is composed by multiple properties = false
 *   }
 * }
 * IndexedDbObjectStoreSchema = {
 *   {string}name: object store name,
 *   [options]: {
 *     {string or Array<string>}keyPath: primary key,
 *     {boolean}autoIncrement: true when generating key automatically
 *   },
 *   {Array<IndexedDbObjectStoreIndexSchema>}[indices]: array of indices
 * }
 * IndexedDbDatabaseSchema = {
 *   {string}name: database name,
 *   {number}version: database version,
 *   {Array<IndexedDbObjectStoreSchema>}objectStores: array of object stores
 * }
 * 
 ****************************************************************************** 
 * Requests and receives database operation
 ****************************************************************************** 
 * When resultType of "keys" are specified, worker will return following
 * object as result
 * {Array}result = [
 * 	 {
 *      {object}key : key of the index,
 *      {Number}count : number of the key appeared
 *   },
 *   ...
 * ]
 */


//indexedDb message types -----------------------------------------------------
var IndexedDbEnum = {
	/** cursor direction (see IDBCursorDirection) */
	DIRECTION: {
		NEXT: "next",
		NEXT_UNIQUE: "nextunique",
		PREV: "prev",
		PREV_UNIQUE: "prevunique"
	},
	/** transaction mode (see IDBTransactionMode) */
	MODE: {
	    RO: "readonly",
	    RW: "readwrite",
	    UPGRADE: "versionchange"
	},
};

/**
 * Message class from main thread to worker
 * @param {object} [source] value of message
 */
var IndexedDbRequestMessage = function(source) {
	//extend from source object
	this.extend(source);
};
/** IndexedDB request message name enum */
IndexedDbRequestMessage.NAMES = {
	SET_SCHEMA:   "IDB.setSchema",
	SAVE:         "IDB.save",
	READ:         "IDB.read",
	READ_KEYS:    "IDB.readKeys",
	REMOVE:       "IDB.remove",
};
/** inherits PostingMessage */
IndexedDbRequestMessage.prototype = new PostingMessage({
	data: {
		schema: {
			objectStore : "undefined",
			index       : null,
		},
		query: {
			range: null,
			direction: IndexedDbEnum.DIRECTION.NEXT,
			resultType : IndexedDbEnum.RESULT_TYPE.VALUES,
		},
		values: null
	}
});


//indexedDb schemas -----------------------------------------------------------
var AbstractSchema = function(source) {
	//extend from source object
	this.extend(source);
};
AbstractSchema.prototype.name = "undefined";
AbstractSchema.prototype.extend = function(source) {
	if (source) {
		for (var prop in source) {
			this[prop] = source[prop];
		}
	}
};

/** Index schema */
var IndexedDbObjectStoreIndexSchema = function(source) {
	this.extend(source);
};
IndexedDbObjectStoreIndexSchema.prototype = new AbstractSchema({
	keyPath: null,
	options: {
		unique: false,
		multiEntry: false
	}
});

/** Object store schema */
var IndexedDbObjectStoreSchema = function(source) {
	this.extend(source);
};
IndexedDbObjectStoreSchema.prototype = new AbstractSchema({
	options: {
		keyPath: null,
		autoIncrement: false
	},
	indices: []
});

/** Database schema */
var IndexedDbDatabaseSchema = function(source) {
	this.extend(source);	
};
IndexedDbDatabaseSchema.prototype = new AbstractSchema({
	version: 1,
	objectStores: []
});
