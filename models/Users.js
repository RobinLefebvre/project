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

    this.name = args.name;
    this.pass = encrypt.encryptPass(args.pass);
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
        throw new Error("Empty request parameters.")

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

  /** @function getList - gets the whole list of Users
   * @returns {Array} List of user names
   * @throws "Collection is empty" */
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

  /** @function addFriend - adds a new User to the friends list
   * @param {String} name - name of current user
   * @param {String} friendName - name of the friend
   * @returns current user
   * @throws "Missing request parameters", "Cannot add yourself as friend", "User is already in your friends list" "User doesn't exist"  */
  static async addFriend(name, friendName)
  {
    try
    {
      if(!friendName || friendName == "")
        throw new Error("Missing request parameters.");
      if(friendName == name)
        throw new Error("Cannot add yourself as friend.");
      
      let userFriends = await User.getByName(request.session.user.name);
      if(userFriends.friends && userFriends.friends.indexOf(friendName) != -1)
        throw new Error(`User ${friendName} is already in your friends list.`);
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

  /** @function removeFriend - removes a User from the friends list
   * @param {String} name - name of current user
   * @param {String} friendName - name of the friend
   * @returns current user
   * @throws "Missing request parameters", "`User is not in your friends list", "User doesn't exist"  */
  static async removeFriend(name, friendName)
  {
    try
    {
      if(!friendName || friendName == "")
        throw new Error("Missing request parameters.");
      
      let userFriends = await User.getByName(request.session.user.name);
      if(userFriends.friends && userFriends.friends.indexOf(friendName) == -1)
        throw new Error(`User ${friendName} is not in your friends list.`);
    
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