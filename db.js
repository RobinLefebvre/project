/** db.js
* File used for exposing connection to database. 
* Also contains initialization and utility functionality on the MongoDB.
* @author Robin Lefebvre
* @disclaimer This file is not designed to be reproduced or distributed, nor is it useable for creation of content of any kind. 
* It was made for the personal use of the owner, as it disregards any and all legislation regarding intellectual property. */

/** Dependencies */
const MongoClient = require('mongodb').MongoClient;

/** Models - used for specific functionalities  */
const Channel = require('./models/Channels.js')

/** DB holder */
var state = { db : null, globalChannel : null };

/** @function get - Exposes the database
 * @returns The content of the Singleton-like db state */
exports.get = () => 
{
  return state.db;
}

/** @function getGlobalChannel - Exposes the Global channel for messaging to everyone
 * @returns The content of the Singleton-like db state */
exports.getGlobalChannel = () => 
{
  return state.globalChannel;
}

/** @function connect - Creates MongoDB connection and stores it
 * @param {String} url - Connection path
 * @param {Object} options - Connection options (useUnifiedTypology, ...)
 * @param {Function} callback - Callback defined to redirect errors and results 
 * @returns The DB connection */
exports.connect = async (url, options, callback) =>
{
  if(state.db)
  {
    return callback();
  }
  console.log("Connecting server to MongoDB.");
  MongoClient.connect(url, options, (error, result) => 
  {
    if(error) throw new Error(error);
    state.db = result.db('project');
    callback()
  });
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
      callback(error, result);
    })
  }
}

/** @function dropCollections - Drops the collections existing in DB which fit the list of names passed
 * @param {Array} list - String names of the collection names to drop
 * @returns undefined */
exports.dropCollections = async (list) =>
{
  const collections = (await state.db.listCollections().toArray()).map(collection => collection.name); // Get the list of Collections from Mongo
  for (let i = 0; i < list.length; i++) 
  {
    if (collections.indexOf(list[i]) !== -1) 
    {
      console.log(`Dropping ${list[i]} Collection.`);
      await state.db.dropCollection(list[i]);
    }
  }
}

/** @function initializeCollections - Checks that the given Collection names exist, creates them if not
 * @param {Array} collections - List of collections
 * @returns undefined */
exports.initializeCollections = async (list) => 
{
  let dbCollections = (await state.db.listCollections().toArray()).map(collection => collection.name);
  for(let i = 0; i < list.length; i++)
  {
    if(dbCollections.indexOf(list[i]) == -1)
    {
      console.log(`Creating ${list[i]} Collection.`);
      await state.db.createCollection(list[i])
    }
  }
}

/** @function createGlobalChannel - Creates a Global messaging Channel
 * @returns undefined */
exports.createGlobalChannel = async () =>
{
  try
  {
    let ch = await Channel.getByName('Global');
    if(ch)
      state.globalChannel = ch;
  }
  catch(error)
  {
    ch = new Channel({"name" : 'Global', "users" : []});
    await ch.create()
    state.globalChannel = ch;
  }
}