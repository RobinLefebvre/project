/** db.js
* File used for exposing connection to database - sorta Singleton
* @author Robin Lefebvre
* @disclaimer This file is not designed to be reproduced or distributed, nor is it useable for creation of content of any kind. 
* It was made for the personal use of the owner, as it disregards any and all legislation regarding intellectual property. */

/** Dependencies */
const MongoClient = require('mongodb').MongoClient;

/** DB holder */
var state = { db : null };

/** @function connect - Creates MongoDB connection and stores it
 * @param {String} url - Connection path
 * @param {Object} options - Connection options (useUnifiedTypology, ...)
 * @param {Function} callback - Callback defined to redirect errors and results 
 * @returns The DB connection */
exports.connect = (url, options, callback) =>
{
  if(state.db) return callback();

  MongoClient.connect(url, options, (error, result) => 
  {
    if(error) throw new Error(error);
    state.db = result.db('project');
    callback(error, result);
  });
}

/** @function get - Exposes the database
 * @returns The content of the Singleton-like db state */
exports.get = () => 
{
  return state.db;
}

/** @function close - Closes the MongoDB connection
 * @param {Function} callback - Callback defined to redirect errors and results 
 * @returns undefined */
exports.close = (callback) => 
{
  if(state.db)
  {
    state.db.close((error, result) => 
    {
      state.db = null;
      state.mode = null;
      callback(error);
    })
  }
}