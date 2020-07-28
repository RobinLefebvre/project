/** models/Users.js
* File used for handling the User model of the API. It will perform DB tasks related to user management.
* @author Robin Lefebvre
* @disclaimer This file is not designed to be reproduced or distributed, nor is it useable for creation of content of any kind. 
* It was made for the personal use of the owner, as it disregards any and all legislation regarding intellectual property. */

/** Dependencies */
const db = require('../db');
const encrypt = require('../utils/encryption');

module.exports = class User
{
  constructor(args)
  {
    this.name = args.name;
    this.pass = args.pass;
  }

  /** @function create - adds a new User into database
  * @returns the database response
  * @throws "User already exists" & other database errors */
  async create()
  {
    try
    {
      console.log(`Creating new User ${this.name}.`);
      let usersCollection = db.get().collection('users');

      let user = await usersCollection.findOne({name : this.name})
      if(user !== null) 
        throw new Error("User already exists.");

      return (await usersCollection.insertOne(this))
    }
    catch(error)
    {
      throw error;
    };
  }

  /** @function remove - remove the User from database
  * @param name - the User's name
  * @returns the database response
  * @throws "Empty request parameters", "User doesn't exist" & other database errors */
  static async remove(name)
  {
    if(!name || name == "")
      throw new Error("Empty request parameters.");
    try
    {
      console.log(`Removing User ${name}.`);
      let usersCollection = db.get().collection('users');

      let user = await usersCollection.findOne({name : name})
      if(user == null) 
        throw new Error("User doesn't exist.");

      return (await usersCollection.removeOne({name: name}))
    }
    catch(error)
    {
      throw error;
    };
  }

  /** @function getByName - gets a user from its name
   * @param {String} name - the username
   * @returns the user record in DB 
   * @throws "Empty request parameters", "User doesn't exist" & other database errors */
  static async getByName(name)
  {
    if(!name || name == "")
      throw new Error("Empty request parameters.");
    try
    {
      console.log(`Getting user ${name} 's data.`);
      let usersCollection = db.get().collection('users');

      let user = await usersCollection.findOne({name : name}); 
      if(!user)
        throw new Error("User doesn't exist.");
      
      return user;
    }
    catch(error)
    {
      throw error;
    }
  }

  /** @function getList - gets the whole list of users
   * @returns {Array} List of user names
   * @throws "Collection is empty" & other database errors */
  static async getList()
  {
    try 
    {
      console.log(`Getting users list.`);
      let usersCollection = db.get().collection('users');

      let users = await usersCollection.find({}).project({name : 1}).toArray();
      if(users.length == 0)
        throw new Error("Collection is empty.");
      
      return users;
    }
    catch(error)
    {
      throw error;
    }
  }

  /** @function login - checks validity of data against user database
   * @param {String} name - the username
   * @param {String} pass - the plain text password 
   * @returns true 
   * @throws "Empty request parameters", "User doesn't exist", "Mismatched password" & other database errors */
  static async login(name, pass)
  {
    if(!name || !pass || name == "" || pass == "")
      throw new Error("Empty request parameters.");
    try
    {
      console.log(`Login for user ${name}.`);
      let usersCollection = db.get().collection('users');

      let user = await usersCollection.findOne({name : name});

      if(!user)
        throw new Error("User not found.");

      if(user.pass && user.pass.salt && user.pass.hash)
      {
        if(!encrypt.validPass(pass, user.pass))
          throw new Error("Mismatched password.");
        else
          return {id : user._id, name : user.name};
      }
    }
    catch(error)
    {
      throw error;
    }  
  }

  /** @function addFriend - adds a new user the friends list
   * @param {String} name - name of current user
   * @param {String} friendName - name of the friend
   * @returns the user
   * @throws user doesn't exist, friend doesn't exist & other database errors */
  static async addFriend(name, friendName)
  {
    try
    {
      console.log(`Adding ${friendName} into ${name}'s friends.`);
      let usersCollection = db.get().collection('users');

      let friend = await usersCollection.findOne({name : friendName});
      if(!friend) throw new Error("User doesn't exist.");

      let user = await usersCollection.findOneAndUpdate({name : name}, {"$push" : { "friends" : friend.name }});
      if(!user) throw new Error("User doesn't exist.");
      
      return user;
    }
    catch(error)
    {
      throw error;
    }
  }

  /** @function removeFriend - adds a new user the friends list
   * @param {String} name - name of current user
   * @param {String} friendName - name of the friend
   * @returns the user
   * @throws user doesn't exist, friend doesn't exist & other database errors */
  static async removeFriend(name, friendName)
  {
    try
    {
      console.log(`Removing ${friendName} from ${name}'s friends.`);
      let usersCollection = db.get().collection('users');

      let friend = await usersCollection.findOne({name : friendName});
      if(!friend) throw new Error("User doesn't exist.");

      let user = await usersCollection.findOneAndUpdate({name : name}, {$pull: { friends: friendName }} );
      if(!user) throw new Error("User doesn't exist.");
      
      return user;
    }
    catch(error)
    {
      throw error;
    }
  }
}