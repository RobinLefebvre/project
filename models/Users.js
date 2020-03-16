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

  /** @function add - adds a new user into database
   * @param {String} name - the username
   * @param {String} pass - the plain text password 
   * @returns the created database user 
   * @throws user already exists & other database errors */
  static async add(name, pass)
  {
    try
    {
      console.log(`Add new user ${name}.`);

      let usersCollection = db.get().collection('users');
      let user = await usersCollection.findOne({name : name})
      if(user !== null) 
        throw new Error("User already exists.");

      let data = { name : name, pass : encrypt.encryptPass(pass) };
      return (await usersCollection.insertOne(data))
    }
    catch(error)
    {
      throw error;
    };
  }

  /** @function getByName - gets a user from its name
   * @param {String} name - the username
   * @returns the user record in DB 
   * @throws user doesn't exists & other database errors */
  static async getByName(name)
  {
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
   * @throws collection is empty & other database errors */
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

  /** @function addToFriends - adds a new user the friends list
   * @param {String} name - name of current user
   * @param {String} friendName - name of the friend
   * @returns 
   * @throws user doesn't exist, friend doesn't exist & other database errors */
  static async addToFriends(name, friendName)
  {
    try
    {
      console.log(`Add ${friendName} into ${name}'s friends.`);

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

  /** @function login - checks validity of data against user database
   * @param {String} name - the username
   * @param {String} pass - the plain text password 
   * @returns true 
   * @throws user doesn't exist, password mismatch & other database errors */
  static async login(name, pass)
  {
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
}