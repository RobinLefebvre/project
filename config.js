/** Routes config 
 * Defines an array of main routes open for requests, with the reference and path to the file defining the routes themselves.*/
const routes = 
[
   { name : "/users", req : require("./controllers/users.js") },
   { name : "/messaging", req : require("./controllers/messaging.js") },
]
exports.routes = routes;

/** MongoDB collections config - defines the Array of collections to initialize upon Start-Up if not existant.
 * Note : Collection "channels" will be created at a later stage in initialization. */
const collections = ["users"];
exports.collections = collections;
