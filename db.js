/** db.js
* File used for exposing connection to database - sorta Singleton
* @author Robin Lefebvre
* @disclaimer This file is not designed to be reproduced or distributed, nor is it useable for creation of content of any kind. 
* It was made for the personal use of the owner, as it disregards any and all legislation regarding intellectual property. */

/** Dependencies */
const MongoClient = require('mongodb').MongoClient;

/** Models - used for specific functionalities  */
const Channel = require('./models/Channels.js');

/** DB holder */
var state = { db : null };

/** @function connect - Creates MongoDB connection and stores it
 * @param {String} url - Connection path
 * @param {Object} options - Connection options (useUnifiedTypology, ...)
 * @param {Function} callback - Callback defined to redirect errors and results */
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

/** @function get - Exposes the database. */
exports.get = () => 
{
  return state.db;
}

/** @function close - Closes the MongoDB connection
 * @param {Function} callback - Callback defined to redirect errors and results*/
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

/** @function dropCollections - Drops the collections existing in DB which fit the list of names passed
 * @param {Array} list - String names of the collection names to drop*/
exports.dropCollections = async (list) =>
{
  const collections = (await state.db.listCollections().toArray()).map(collection => collection.name);
  for (let i = 0; i < list.length; i++) 
  {
    console.log(`Dropping ${list[i]} Collection.`);
    if (collections.indexOf(list[i]) !== -1) 
      await state.db.dropCollection(list[i]);
  }
}

/** @function initializeCollections - Checks that the given Collection names exist, creates them if not
 * @param {Array} collections - List of collections */
exports.initializeCollections = async (collections) => 
{
  collections.forEach(async (collectionName) => 
  {
    console.log(`Initializing ${collectionName} Collection.`);
    await state.db.listCollections({name: collectionName}).toArray( async (error, result) => 
    { 
      if(error)
        throw error;
      if(result.length == 0)
        await state.db.createCollection(collectionName)
    });
  })
}

/** @function createInitialChannels - Creates messaging Channels based on the given list
 * @param {Array} collections - List of collections */
exports.createInitialChannels = async (list) =>
{
  for (let i = 0; i < list.length; i++) 
  {
    let ch = await Channel.getByName(list[i])
    if(!ch)
    {
      console.log(`Creating ${list[i]} Channel.`);
      await Channel.create([], list[i]);
    }
  }
}