importScripts("worker.odata.js");

//echo
self.base.on("echo", function(message) {
	self.base.postCompleted(message.data, message);
});

//query OData
//In this example, server has OData service on URL below
//"http://host:port/logReader/odata/Sample"
self.base.on("odata", function(message) {
	var query = null;
	self.odata.setUri('/logReader/odata/Sample');
	self.odata.getCount(query, function(count) {
		self.base.postCompleted(message, count);
	});
	self.odata.getList(query, function(entities) {
		self.base.postCompleted(message, entities);
	});

});
