/** Routes config */
const routes = 
[
   { name : "/users", req : require("./controllers/users.js") },
   { name : "/messaging", req : require("./controllers/messaging.js") },
]
exports.routes = routes;
/** MongoDB collections config */

const collections = ["users"];
exports.collections = collections;
