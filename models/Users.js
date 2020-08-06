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
    if(!args.name || !args.pass)
      throw new Error("Missing request parameters.");
    if(args.name == "" || args.pass == "")
      throw new Error("Empty request parameters.");

    this._id = args._id;
    this.name = args.name;

    if(!args.pass.salt)
      this.pass = encrypt.encryptPass(args.pass);

    this.friends = args.friends || [];
    this.blocked = args.blocked || [];
  }

  /** @function create - adds a new User into database
  * @returns the database response
  * @throws "User already exists"  */
  async create()
  {
    try
    {
      console.log(`Creating new User ${this.name}.`);
      let usersCollection = db.get().collection('users');

      let userExists = await usersCollection.findOne({name : this.name})
      if(userExists !== null) 
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
  * @throws "Empty request parameters", "User doesn't exist"  */
  static async remove(name)
  {
    try
    {
      if(!name)
        throw new Error("Empty request parameters.")
        
      console.log(`Removing User ${name}.`);
      let usersCollection = db.get().collection('users');

      let user = await usersCollection.findOne({name : name})
      if(user == null) 
        throw new Error("User doesn't exists.");

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
   * @throws "Empty request parameters", "User doesn't exist"  */
  static async getByName(name)
  {
    try
    {
      if(!name)
        throw new Error("Empty request parameters.");

      console.log(`Getting user ${name} 's data.`);
      let usersCollection = db.get().collection('users');

      let user = await usersCollection.findOne({name : name}); 
      if(!user)
        throw new Error("User doesn't exist.");
      
      return (new User(user));
    }
    catch(error)
    {
      throw error;
    }
  }

  /** @function getList - gets the whole list of Users
   * @returns {Array} List of user names
   * @throws "Collection is empty" */
  static async getList()
  {
    try 
    {
      console.log(`Getting users list.`);
      let usersCollection = db.get().collection('users');
      let users = (await usersCollection.find({}).project({_id: 0, name : 1}).toArray()).map(user => user.name);
      if(users.length == 0)
        throw new Error("Collection is empty.");
      
      return users;
    }
    catch(error)
    {
      throw error;
    }
  }

  /** @function verifyExists - checks that the whole list of user exists
   * @param {Array} list - Array of user names
   * @returns {Boolean} true
   * @throws "Users must be provided as an Array.", "User doesn't exist" */
  static async verifyExists(list)
  {
    if(!Array.isArray(list))
      throw new RangeError("Users must be provided as an Array.");

    for(let i = 0; i < list.length; i++)
    {
      let foundUser = await User.getByName(list[i]);
      if(!foundUser)
        throw new Error("User doesn't exist");
    }
    return true;
  }

  /** @function updateRelationship - Manages the addition or removal of users into the current user's Friends and Blocked lists
   * @param {String} action - Action to perform : "friend", "removeFriend", "block", "removeBlock"
   * @param {String} username - name of the user to deal with
   * @returns current user
   * @throws "Missing request parameters", "User doesn't exist", "User is already/not in your friends/blocked list" */
  async updateRelationship(action, username)
  {
    try
    {
      let usersCollection = db.get().collection('users');

      // Validate request - Action
      let isValidAction = (action !== undefined && (action == "friend" || action == "removeFriend" || action == "block" || action == "removeBlock") )
      if(isValidAction === false )
        throw new Error("Action is invalid.");

      // Validate request - User
      let otherUser = await User.getByName(username);
      if(otherUser === undefined)
        throw new Error("User doesn't exist.");

      switch(action)
      {
        case "friend":
          // Add friend if not exist
          if(this.friends.indexOf(username) > -1)
            throw new Error("User is already in your friends list.");

          this.friends.push(username);
          (usersCollection.findOneAndUpdate({"name" : this.name}, {"$push" : { "friends" : username }}));
          break;
          
        case "removeFriend":
          // Remove friend if exists
          let iRf = this.friends.indexOf(username)
          if(iRf == -1)
            throw new Error("User is not in your friends list.");

          this.friends.splice(iRf, 1);
          (usersCollection.findOneAndUpdate({"name" : this.name}, {"$pull": { "friends": username }}) );
          break;

        case "block":
          // Add block if not exists
          if(this.blocked.indexOf(username) > -1)
            throw new Error("User is already in your blocked list.");
            
          this.blocked.push(username);
          (usersCollection.findOneAndUpdate({"name" : this.name}, {"$push" : { "blocked" : username }}));
          break;

        case "removeBlock":          
          // Remove block if exists
          let iRb = this.blocked.indexOf(username) 
          if(iRb == -1)
            throw new Error("User is not in your blocked list.");
            
          this.blocked.splice(iRb, 1);
          (usersCollection.findOneAndUpdate({"name" : this.name}, {"$pull": { "blocked" : username }} ));
          break;
      }
      return this;
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
   * @throws user doesn't exist, password mismatch  */
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