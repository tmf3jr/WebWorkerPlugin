/*
 * Definition of IndexedDB Worker message classes to communicate with
 * worker IndexedDB plug-in.
 * This classes are depends on "worker.base.message.js" file.<br/>
 * 
 ****************************************************************************** 
 * database operation
 ****************************************************************************** 
 * Some of indication message may cause WorkerMessage as return of task.<br/>
 * These are content of result for task indication.
 * <ul>
 *   <li>"IDB.read": {Object[]}</li>
 *   <li>"IDB.readKeys": {Object[]} = [{key, count}, ...]</li>
 * </ul>
 * 
 ****************************************************************************** 
 * database schema
 ****************************************************************************** 
 * When indexedDb creates or updates database, database schema is necessary.
 * These are creation schema classes, also plain object can be used with same
 * object notation.
 * <ul>
 *   <li>IndexedDbDatabaseSchema</li>
 *   <li>IndexedDbObjectStoreSchema</li>
 *   <li>IndexedDbObjectStoreIndexSchema</li>
 * </ul>
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
 * Message class for IndexedDB operations
 * @class Message for IndexedDB operations 
 * @param {Object}[source] value of message
 * IndexedDbMessage is plain object inheriting IndicationMessage
 * that can be converted to JSON string.<br/>
 * Object notation is below.<br/>
 * IndexedDbMessage = {
 *   {String}name : "IDB.setSchema" | "IDB.save" |
 *                  "IDB.read" | "IDB.readKeys" | "IDB.remove",
 *   data : {
 *   	{Object}[schema]: IndexedDB schema definition, see IndexedDbDatabaseSchema
 *   	[source]: {
 *  		{String}objectStore : object store name,
 * 	 		{String}[index]     : object store index name
 *   	},
 *   	[query]: {
 *          {IDBKeyRange}[range=null]: query range
 *          {String}[direction="next"]: "next" | "prev"
 *   	}
 *   	{Object|Object[]}[values]: values to be stored
 * 	 }
 * }
 */
function IndexedDbMessage(source) {
	//extend from source object
	this.extend(source);
};
/** IndexedDB request message name enum */
IndexedDbMessage.NAMES = {
	SET_SCHEMA:   "IDB.setSchema",
	SAVE:         "IDB.save",
	READ:         "IDB.read",
	READ_KEYS:    "IDB.readKeys",
	REMOVE:       "IDB.remove",
};
/** inherits IndicationMessage */
IndexedDbMessage.prototype = new IndicationMessage({
	data: {
		schema: null,
		source: {
			objectStore : "undefined",
			index       : null,
		},
		query: {
			range: null,
			direction: IndexedDbEnum.DIRECTION.NEXT,
		},
		values: null
	}
});


//indexedDB schemas -----------------------------------------------------------
/**
 * Abstract IndexedDB schema
 * @class Base of IndexedDB schema
 * @param {Object}[source] value of schema
 */
function AbstractSchema(source) {
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

/**
 * Index schema
 * @class Index schema
 * @param {Object}[source] value of schema
 * Object notation is below.<br/>
 * IndexedDbObjectStoreIndexSchema = {
 *   {String}name: index name,
 *   {String|String[]}[keyPath]: key property, or index name if omitted
 *   [options] : {
 *     {boolean}[unique=false]: indicates key is unique
 *     {boolean}[multiEntry=false]: key is composed by multiple properties
 *   }
 * }

 */
function IndexedDbObjectStoreIndexSchema(source) {
	this.extend(source);
};
IndexedDbObjectStoreIndexSchema.prototype = new AbstractSchema({
	keyPath: null,
	options: {
		unique: false,
		multiEntry: false
	}
});

/**
 * Object store schema
 * @class Object store schema
 * IndexedDbObjectStoreSchema = {
 *   {String}name: object store name,
 *   [options]: {
 *     {String|String[]}keyPath: primary key,
 *     {boolean}autoIncrement: true when generating key automatically
 *   },
 *   {IndexedDbObjectStoreIndexSchema[]}[indices]: array of indices
 * }
 */
var IndexedDbObjectStoreSchema = function(source) {
	this.extend(source);
};
IndexedDbObjectStoreSchema.prototype = new AbstractSchema({
	options: {
		keyPath: null,
		autoIncrement: false
	},
	/** {String|String[]} */
	indices: []
});

/**
 * Database schema
 * @class Database schema
 * Object notation is below.<br/>
 * IndexedDbDatabaseSchema = {
 *   {String}name: database name,
 *   {Number}version: database version,
 *   {IndexedDbObjectStoreSchema[]}objectStores: array of object stores
 * }
 */
var IndexedDbDatabaseSchema = function(source) {
	this.extend(source);	
};
IndexedDbDatabaseSchema.prototype = new AbstractSchema({
	version: 1,
	/** {IndexedDbObjectStoreSchema[]} */
	objectStores: []
});
