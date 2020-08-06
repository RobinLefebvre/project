/** Routes config */
exports.routes = [
   { name : "/users", req : require("./controllers/users.js") },
   { name : "/messaging", req : require("./controllers/messaging.js") },
];

/** MongoDB collections config */
exports.dropCollections = [];

exports.initialCollections = ["users", "channels"];
