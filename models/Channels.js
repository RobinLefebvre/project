/** models/Channels.js
* File used for handling the Channels model of the API. It will perform DB tasks related to channel and channel users management.
* @author Robin Lefebvre
* @disclaimer This file is not designed to be reproduced or distributed, nor is it useable for creation of content of any kind. 
* It was made for the personal use of the owner, as it disregards any and all legislation regarding intellectual property. */

/** Dependencies */
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

module.exports = class Channel
{
  constructor(args)
  {
    if(args.users === undefined || !Array.isArray(args.users) )
      throw new RangeError("Users must be provided as an array.");
    if(args.name === undefined || args.name === "")
      throw new RangeError("Name must be provided.");

    this.name = args.name;
    this.uuid = args.uuid || uuidv4();
    this.users = args.users;
    this.messages = args.messages || [];
    this.createdOn = args.createdOn || new Date().getTime();
  }

  /** @function create - creates the current Channel into database
   * @returns the DB response
   * @throws "Users must be an array", "Name must be provided" */
  async create()
  {
    try
    {
      console.log(`Creating Channel ${this.uuid} under name ${this.name}.`);
      let coll = db.get().collection('channels');
      let channelExists = await coll.findOne({"uuid" : this.uuid})
      if(channelExists === null)
        return (await coll.insertOne(this))
    }
    catch(error)
    {
      throw error;
    };
  }

  /** @function delete - deletes a new Channel from database
   * @param uuid - the Channel's uuid
   * @return the database response
   * @throws "Missing request parameters" */
  static async delete(uuid)
  {
    try
    {
      console.log(`Deleting Channel ${uuid}.`);
      let coll = db.get().collection('channels');

      if(!uuid)
        throw new Error("Missing request parameters");

      return (await coll.removeOne({"uuid": uuid}))
    }
    catch(error)
    {
      throw error;
    };
  }

  /** @function getList - get the list of Channels available to user with given name
   * @param name - Current logged in user name
   * @returns {Array} List of Channels */
  static async getList(name)
  {
    try
    {
      console.log(`Getting list of Channels.`);
      let result = (await db.get().collection('channels').find({"users" : name}).project({_id : 0, name : 1, uuid: 1, users : 1}).toArray());
      if(result.length == 0)
        throw new Error("Empty collection.");

      return result;
    }
    catch(error)
    {
      throw error;
    };
  }

  /** @function getByName - get a Channel by name
   * @deprecated - Only used at init server stage
   * @param name - the Channel's name 
   * @throws "Channel doesn't exist", "Empty request parameters" */
  static async getByName(name)
  {
    try
    {
      if(!name || name == "")
        throw new Error("Channel name must be provided.");
        
      console.log(`Getting ${name} Channel.`);
      let result = (await db.get().collection('channels').findOne({"name" : name}))
      if(!result)
        throw new Error("Channel doesn't exist.");

      return result;
    }
    catch(error)
    {
      throw error;
    };
  }

  /** @function getByUuid - get a Channel by uuid
   * @param uuid - the Channel's uuid identifier
   * @throws "Channel uuid must be provided", "Channel doesn't exist, or you are not a part of it" */
  static async getByUuid(uuid)
  {
    try
    {
      if(!uuid || uuid == "")
        throw new Error("Channel uuid must be provided.");

      console.log(`Getting Channel ${uuid}.`);
      let result = ( await db.get().collection('channels').findOne({"uuid" : uuid},{ "projection": {"uuid" : 1, "users" : 1, "messages" : 1, "name" : 1}}) )
      if(!result)
        throw new Error("Channel doesn't exist, or you are not a part of it.");

      return new Channel(result);
    }
    catch(error)
    {
      throw error;
    };
  }

  /** @function postMessage - Add user to channel
   * @param {String} content - the message's content
   * @returns the database response
   * @throws user doesn't exists & other database errors */
  async postMessage(username, content)
  {
    try
    {
      if(content === undefined || content == "")
        throw new Error("Content must be provided.");

      console.log(`${username} is posting \n ${content} into Channel ${this.uuid}.`);
      let coll = db.get().collection('channels')
      let message =  {author : username, content : content, sentOn : (new Date().getTime()) };

      this.messages.push(message);
      coll.findOneAndUpdate( {"uuid" : this.uuid}, {$push : {"messages" : message}});
      return this;
    }
    catch(error)
    {
      throw error;
    }
  }

  /** @function postSystemMessage - Post a System Message to a Channel
   * @param {String} channelID - the Channel's uuid
   * @param {String} message - the message
   * @returns the user record in DB 
   * @throws user doesn't exists & other database errors */
  async postSystemMessage(content)
  {
    try
    {
      let coll = db.get().collection('channels');
      let message = {author : "System", content : content, sentOn : new Date().getTime()}
      this.messages.push(message);
      return (await coll.findOneAndUpdate({"uuid" : this.uuid}, {$push : {"messages" : message}})); 
    }
    catch(error)
    {
      throw error;
    }
  }

  /** @function addUser - Adds User to Channel
   * @param {String} username - the username
   * @returns the user record in DB 
   * @throws "User is already part of Channel" & other database errors */
  async addUser(username)
  {
    try
    {
      console.log(`Getting user ${username} into Channel ${this.uuid}.`);
      if(this.users.indexOf(username) > -1)
        throw new Error("User is already part of Channel.");

      let coll = db.get().collection('channels');
      this.postSystemMessage(`${username} has joined.`);
      this.users.push(username);
      return (await coll.findOneAndUpdate({"uuid" : this.uuid}, {$push: {"users" : username}})); 
    }
    catch(error)
    {
      throw error;
    }
  }

  /** @function addUserToGlobal - Adds User to the Global Channel - should only be used by the User Creation process
   * @param {String} username - the username
   * @returns undefined */
  static async addUserToGlobal(username)
  {
    try
    {
      console.log(`Getting user ${username} into the Global Channel.`);
      let c = db.getGlobalChannel();
      let global = new Channel(c);
      global.addUser(username); 
      return;
    }
    catch(error)
    {
      throw error;
    }
  }

  /** @function removeUser - Removes User from Channel - deletes Channel 
   * @param {String} username - the username
   * @returns the user record in DB 
   * @throws user doesn't exists & other database errors */
  async removeUser(username)
  {
    try
    {
      let index = this.users.indexOf(username);
      if(index == -1)
        throw new Error("User is not part of Channel.");

      console.log(`Removing user ${username} from Channel ${this.uuid}.`);
      this.users.splice(index, 1);
      if(this.users.length <= 1 && this.name !== "Global")
      {
        return (await Channel.delete(this.uuid));
      }
      else
      {
        let coll = db.get().collection('channels');
        await this.postSystemMessage(`${username} has left.`);
        return (await coll.findOneAndUpdate({"uuid" : this.uuid}, {$pull : {"users" : username}})); 
      }
    }
    catch(error)
    {
      throw error;
    }
  }

  /** @function removeUserFromChannels - Removes User from all Channels they're a part of 
   * @param {String} username - the username */
  static async removeUserFromChannels(username)
  {
    try
    {
      let list = await Channel.getList(username);
      for(let i = 0; i < list.length; i++)
      {
        let channel = new Channel(list[i]);
        await channel.removeUser(username);
      }
      return true;
    }
    catch(error)
    {
      throw error;
    }
  }
}