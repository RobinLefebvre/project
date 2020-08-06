/** app.js 
 * File used for handling the incoming requests dedicated to the API and passing them through routing
 * @author Robin Lefebvre
 * @disclaimer This file is not designed to be reproduced or distributed, nor is it useable in content of any kind. It should be for the personal use of the owner, as it disregards any and all legislation regarding copyrighted code. */

/** Dependencies */
const express = require('express'); // - Express (server & routing)
const session = require('express-session'); // - Express Session (cookies & sessions)
const db = require('./db'); // - Custom MongoDB connector (database)
const responseHandler = require('./middleware/responseHandler'); // - Response Handler (custom middleware for routing logic)
const config = require('./config'); // - Config file for the server startup
const morgan = require('morgan'); // - Morgan for loggin API requests

/** Server start */
const app = express();
serverStart();

/** @function serverStart  - Starts the server process, initialize DB and upsert default data. */
async function serverStart ()
{
  console.log("Starting Server.");
  await db.connect("mongodb://localhost:27017", {useUnifiedTopology: true}, async () => 
  {
    try
    {
      await db.dropCollections(config.dropCollections);
      await db.initializeCollections(config.initialCollections);
      await db.createGlobalChannel(["Global"]);
      app.listen(6060, () => 
      {
        console.log('Listening to routes on localhost:6060.\n');
      });
    }
    catch(error)
    {
      throw error;
    }
  });
};

/** Middleware routing - All requests go through the following sequence of routes : */
/** Body Parser */
app.use(express.json());
/** Set CORS headers for response */
app.use(responseHandler.handleCors);
/** Console Logs - Morgan */
morgan.token('sessionid', function(req, res, param) {return req.sessionID;});
morgan.token('user', function(req, res, param) {if(req.session && req.session.user && req.session.user.name){ return req.session.user.name} return "Anonymous User";});
app.use(morgan(`\n[-- :date --]\n :user - :sessionid @ :remote-addr \n - :method \t\t- :url \n - Response Status \t- :status \n - Response Size \t- :res[content-length] bytes \n - Response Time \t- :response-time ms\n`)); 
/** Sessions management */
app.use(session( { secret : 'projectSecret', saveUninitialized: true, resave: true, cookie: { httpOnly: false, sameSite: false, maxAge: 60000000 } } )); 
/** Controllers routing - c.f. config.js for configuring the routes and controllers */
config.routes.forEach((route) => { app.use(route.name, route.req) });
/** Error log and response */
app.use(responseHandler.respondError);
/** Respond 404 on the rest of the server */
app.use(responseHandler.respond404);