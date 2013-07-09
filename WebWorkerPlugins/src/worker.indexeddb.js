/**
 * IndexedDB worker
 * self.idb = {
 *   //These functions are available through worker message
 *   function setSchema(schema[, success][, error])
 *   function save(name, objects, [callback]), callback = function(event){...}
 *   function read(name, indexName, range, direction, callback), callback = function(event, result){...}
 *   function readKeys(name, indexName, range, direction, callback), callback = function(event, result){...}
 *   function delete(name, indexName, range, [callback]), callback = function(event){...}
 *   
 *   //These functions are not accessible through worker message
 *   function setDatabaseUpgradeHandler(handler)
 * }
 */



//plug-in implementation ------------------------------------------------------
(function($) {
	//constant values and configurations --------------------------------------
	var DEPENDENCIES = ['worker.base.js', 'worker.indexeddb.message.js'];
	
	//import dependency
	for (var i = 0; i < DEPENDENCIES.length; i++) {
		importScripts(DEPENDENCIES[i]);		
	}

	
	//private variables and methods -------------------------------------------
	var _schema = null;
	var _upgradeHandler = _createDatabase;
	/**
	 * Default database creation handler
	 * @param {IDBDatabase}db
	 */
	function _createDatabase(db) {
		for (var i = 0; i < _schema.objectStores.length; i++) {
			var storeSchema = _schema.objectStores[i];
			var store = db.createObjectStore(storeSchema.name, storeSchema.options);
			for (var j = 0; j < storeSchema.indices.length; j++) {
				var indexSchema = storeSchema.indices[j];
				var keyPath = (indexSchema.keyPath) ?
						indexSchema.keyPath : indexSchema.name;
				store.createIndex(indexSchema.name, keyPath, indexSchema.options);
			}
		}
	}
	
	/**
	 * 
	 * @param [success] invoked when completed successfully
	 * @param [error] invoked when error occurred
	 * each callback functions should have signatures below
	 * function success({IDBDatabase}db) {...}
	 * function error(even) {...}
	 */
	function _openDatabase(success, error) {
		//make sure schema is already set
		if (!_schema) {
			$.base.postFailed("Unable to open database: schema is required");
			return;
		}
		//open database
		var dbFactory = $.indexedDB;
		var dbOpenReq = dbFactory.open(_schema.name, _schema.version);
		//create database if necessary
		dbOpenReq.onupgradeneeded = function(event) {
			$.base.postDebug("Creating database");
			var db = event.target.result;
			_upgradeHandler(db);
		};
		dbOpenReq.onerror = function(event) {
			$.base.postFailed("Unable to open database: " + event);
			if (error) {
				error(event);
			}
		};
		dbOpenReq.onsuccess = function(event) {
			$.base.postDebug("IndexedDB opened successfully");
			var db = event.target.result;
			if (success) {
				success(db);
			}
		};
	}


	/**
	 * 
	 * @param {string}name
	 * @param {string}indexName index name can be null
	 * @param {IDBTransactionMode}mode
	 * @param result
	 * @param complete
	 * @param callback
	 */
	function _beginTransaction(name, indexName, mode, result, complete, callback) {
		_openDatabase(function(db) {
			//begin transaction
			var transaction = db.transaction([name], mode);
			transaction.oncomplete = function(event) {
				if (complete) {
					complete(event, result);
				}
			};
			//open object store
			var objectStore = transaction.objectStore(name);
			var iterator = objectStore;
			if (indexName) {
				iterator = objectStore.index(indexName);
			}
			callback(iterator, result);
		});
	}
	
	
	/**
	 * @param {IDBObjectStore or IDBIndex}iterator
	 * @param {IDBKeyRange}range
	 * @param {string}direction
	 * @param {Array}result
	 */
	function _aggregateKeys(iterator, range, direction, result) {
		//sanitize arguments
		if (!direction || direction === IndexedDbEnum.DIRECTION.NEXT) {
			direction = IndexedDbEnum.DIRECTION.NEXT_UNIQUE;			
		}else if (direction === IndexedDbEnum.DIRECTION.PREV) {
			direction = IndexedDbEnum.DIRECTION.PREV_UNIQUE;
		}
		//open cursor
		var cursorReq;
		if (iterator instanceof IDBObjectStore) {
			cursorReq = iterator.openCursor(range, direction);
		}else{
			cursorReq = iterator.openKeyCursor(range, direction);
		}
		cursorReq.onsuccess = function(event) {
			//iterate keys
			var cursor = event.target.result;
			if (cursor) {
				var key = cursor.key;
				//get number of the same key in the database
				var keyCountReq = iterator.count(key);
				keyCountReq.onsuccess = function(event) {
					var count = event.target.result;
					var entity = {
						key: key,
						count: count
					};
					result.push(entity);
				};
			    cursor.advance(1);				
			}
		};
	}

	/**
	 * @param {IDBObjectStore or IDBIndex}iterator
	 * @param {IDBKeyRange}range
	 * @param {string}direction
	 * @param {Array}result
	 */
	function _aggregateValues(iterator, range, direction, result) {
		//sanitize arguments
		if (!direction) {
			direction = IndexedDbEnum.DIRECTION.NEXT;
		}
		//open cursor
		var cursorReq = iterator.openCursor(range, direction);
		cursorReq.onsuccess = function(event) {
			//iterate keys
			var cursor = event.target.result;
			if (cursor) {
				result.push(cursor.value);
			    cursor.advance(1);				
			}
		};
	}
	
	
	//message event handlers
	function _handleSetSchema(message) {
		$.idb.setSchema(message.data);
	}
	function _handleSave(message) {
		var req = message.data;
		$.idb.save(req.source.objectStore, req.values, 
			function(event) {
				$.base.postCompleted(null, message);
		});
	}
	function _handleRead(message) {
		var req = message.data;
		var range = null;
		var direction = IndexedDbEnum.DIRECTION.NEXT;
		if (req.query) {
			range = req.query.range;
			direction = req.query.direction;
		}
		$.idb.read(req.source.objectStore, req.source.index, range, direction,
			function(event, result) {
				$.base.postCompleted(result, message);
		});
	}
	function _handleReadKeys(message) {
		var req = message.data;
		var range = null;
		var direction = IndexedDbEnum.DIRECTION.NEXT_UNIQUE;
		if (req.query) {
			range = req.query.range;
			direction = (req.query.direction) ?
				req.query.direction : IndexedDbEnum.DIRECTION.NEXT_UNIQUE;
		}
		$.idb.readKeys(req.source.objectStore, req.source.index, range, direction,
			function(event, result) {
				$.base.postCompleted(result, message);
		});
	}
	function _handleRemove(message) {
		var req = message.data;
		$.idb.remove(req.source.objectStore, req.source.index, req.query.range,
			function(event) {
				$.base.postCompleted(null, message);
		});
	}


	//public methods ----------------------------------------------------------
	$.idb = {
		/**
		 * Set indexedDB schema.
		 * @param {IndexedDbDatabaseSchema}schema
		 * @param {Function}[callback]
		 * @param {Function}[error]
		 * callback should have signature below
		 * function callback({IDBDatabase}db) {...}
		 * function error(event) {...}
		 */
		setSchema: function(schema, success, error) {
			_schema = schema;
			_openDatabase(success, error);
		},
		/**
		 * Assign custom database creation method
		 * @param {Function}handler
		 * handler should have signature below
		 * function handler({IDBDatabase}db)
		 */
		setDatabaseUpgradeHandler: function(handler) {
			if (handler) {
				_upgradeHandler = handler;
			}else{
				_upgradeHandler = _createDatabase;
			}
		},

		/**
		 * Store data into local database
		 * @param {string}name object store name
		 * @param {Array or object} objects to be stored
		 * @param {Function}[callback] invoked when completed
		 */
		save: function(name, objects, callback) {
			_beginTransaction(name, null, IndexedDbEnum.MODE.RW, null, callback,
				function(store) {
					if (objects instanceof Array) {
						for (var i = 0; i < objects.length; i++) {
							var obj = objects[i];
							store.put(obj);
						};
					}else{
						store.put(objects);
					};
				});
		},
		/**
		 * Read data from local database
		 * @param {string}name object store name
		 * @param {string}index index name, can be null
		 * @param {IDBKeyRange}range search range, can be null
		 * @param {string}direction cursor direction affects sort order
		 * @param {Function}callback invoked when completed
		 */
		read: function(name, indexName, range, direction, callback) {
			var result = [];
			_beginTransaction(name, indexName, IndexedDbEnum.MODE.RO, result, callback,
				function(iterator) {
					_aggregateValues(iterator, range, direction, result);
				});
		},
		
		readKeys: function(name, indexName, range, direction, callback) {
			var result = [];
			_beginTransaction(name, indexName, IndexedDbEnum.MODE.RO, result, callback,
				function(iterator) {
					_aggregateKeys(iterator, range, direction, result);
				});
		},
		
		remove: function(name, indexName, range, callback) {
			var result = [];
			_beginTransaction(name, indexName, IndexedDbEnum.MODE.RW, result, callback,
				function(iterator) {
					var cursorReq = iterator.openCursor(range);
					cursorReq.onsuccess = function(event) {
						var cursor = event.target.result;
						cursor.delete();
						cursor.advance(1);
					};
			});
		}
	};

	//message event handler ---------------------------------------------------
	$.base.on(IndexedDbMessage.NAMES.SET_SCHEMA, _handleSetSchema);
	$.base.on(IndexedDbMessage.NAMES.SAVE, _handleSave);
	$.base.on(IndexedDbMessage.NAMES.READ, _handleRead);
	$.base.on(IndexedDbMessage.NAMES.READ_KEYS, _handleReadKeys);
	$.base.on(IndexedDbMessage.NAMES.REMOVE, _handleRemove);

})(self);
