/** models/Channels.js
* File used for handling the Channels model of the API. It will perform DB tasks related to Channels and Messages management.
* @author Robin Lefebvre
* @disclaimer This file is not designed to be reproduced or distributed, nor is it useable for creation of content of any kind. 
* It was made for the personal use of the owner, as it disregards any and all legislation regarding intellectual property. */

/** Dependencies */
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

module.exports = class Channel
{
  /** @function create - creates a new Channel
   * @param user - the array of users
   * @param name - the name of the channel
   * @returns {Array} List of user names
   * @throws "Users must be an array", "Name must be provided" */
  static async create(users, name)
  {
    try
    {
      if(!users instanceof Array)
        throw new RangeError("Users must be an array.");
      if(!name || name == "")
        throw new RangeError("Name must be provided.");

      let channelsCollection = db.get().collection('channels');
      let data = { uuid : uuidv4(), name : name, users : users, messages : [], createdOn : new Date().getTime() };

      return (await channelsCollection.insertOne(data))
    }
    catch(error)
    {
      throw error;
    };
  }

  /** @function getList - get the list of Channels available to user with given name
   * @param name - Current logged in user name
   * @returns {Array} List of Channels*/
  static async getList(name)
  {
    try
    {
      console.log(`Getting list of Channels.`);
      let channels = (await db.get().collection('channels').find({users : name}).project({_id : 0, name : 1, uuid: 1, users : 1}).toArray())
      if(channels.length == 0)
        throw new Error("Collection is empty.");
      return channels;
    }
    catch(error)
    {
      throw error;
    };
  }

  /** @function getByName - get a Channel by name
   * @param user - the current logged in user name
   * @param name - the Channel's name */
  static async getByName(user, name)
  {
    try
    {
      console.log(`Getting Channel ${name}`);
      let result = (await db.get().collection('channels').findOne({users : user, name : name}, { projection: {_id : 0, uuid : 0, users : 0, createdOn : 0}}))
      return result;
    }
    catch(error)
    {
      throw error;
    };
  }

  /** @function getByUuid - get a Channel by uuid
   * @param user - the current logged in user name
   * @param uuid - the Channel's uuid identifier */
  static async getByUuid(user, uuid)
  {
    try
    {
      console.log(`Getting Channel ${uuid}`);
      let result = ( await db.get().collection('channels').findOne({users: user, uuid : uuid},{ projection: {uuid : 1, users : 1, messages : 1, name : 1}}) )
      return result;
    }
    catch(error)
    {
      throw error;
    };
  }

  /** @function addUser - Adds User to Channel
   * @param {String} channelName - the Channel's name
   * @param {String} username - the username
   * @returns the user record in DB 
   * @throws database errors */
  static async addUser(channelName, username)
  {
    try
    {
      console.log(`Getting user ${username} into Channel ${channelName}.`);
      let channelsCollection = db.get().collection('channels')
      return (await channelsCollection.findOneAndUpdate({name : channelName}, {$push : {users : username}})); 
    }
    catch(error)
    {
      throw error;
    }
  }

  /** @function removeUser - Removes User from Channel
   * @param {String} channelID - the Channel's id
   * @param {String} username - the username
   * @returns the user record in DB 
   * @throws database errors */
  static async removeUser(channelID, username)
  {
    try
    {
      console.log(`Removing user ${username} from Channel ${channelID}.`);
      let channelsCollection = db.get().collection('channels')
      return (await channelsCollection.findOneAndUpdate({uuid : channelID}, {$pull : {users : username}})); 
    }
    catch(error)
    {
      throw error;
    }
  }
  
  /** @function postMessage - Add user to channel
   * @param {String} channelID - the Channel's uuid
   * @param {String} username - the message author's name
   * @param {String} content - the message's content
   * @returns the database response */
  static async postMessage(channelID, username, content)
  {
    try
    {
      console.log(`${username} is posting \n ${content} into Channel ${channelID}.`);
      let channelsCollection = db.get().collection('channels')
      return (await channelsCollection.findOneAndUpdate({uuid : channelID}, {$push : {messages : {author : username, content : content, createdOn : new Date().getTime()}}})); 
    }
    catch(error)
    {
      throw error;
    }
  }
}