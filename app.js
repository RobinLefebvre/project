/** app.js 
 * File used for handling the incoming requests dedicated to the API and passing them through routing
 * @author Robin Lefebvre
 * @disclaimer This file is not designed to be reproduced or distributed, nor is it useable in content of any kind. It should be for the personal use of the owner, as it disregards any and all legislation regarding copyrighted code. */

/** Dependencies */
const express = require('express'); // - Express (server & routing)
const session = require('express-session'); // - Express Session (cookies & sessions)
const db = require('./db'); // - Custom MongoDB connector (database)
const responseHandler = require('./middleware/responseHandler'); // - Response Handler (custom middleware for routing logic)

/** Server start */
const app = express();
db.connect(`mongodb://localhost:27017`, {useUnifiedTopology : true}, (error) => 
{
   if(error) throw new Error(error);
   console.log("Server is connected to MongoDB.");
   app.listen(6060, () => { console.log("Server is listening for requests.") });
});

/** Middleware routing start */
/** Body Parser */
app.use(express.json());
/** Set CORS headers for response */
app.use(responseHandler.handleCors);
/** Login - Morgan */
app.use(require('morgan')(`\n[-- :date --]\n  :remote-addr\n - :method \t\t- :url \n - Response Status \t- :status \n - Response Size \t- :res[content-length] bytes \n - Response Time \t- :response-time ms\n`)); 
/** Session management */
app.use(session( { secret : 'projectSecret', saveUninitialized: true, resave: true } )); 

/** Controllers routing */
const routes = 
[
   { name : "/users", req : require("./controllers/users.js") },
]
routes.forEach((route) => { app.use(route.name, route.req) });

/** Error log and response */
app.use(responseHandler.respondError);
/** Respond 404 on final case */
app.use(responseHandler.respond404);