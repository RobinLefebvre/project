/** controllers/users.js
* File used for handling the requests related to User management.
* @author Robin Lefebvre
* @disclaimer This file is not designed to be reproduced or distributed, nor is it useable for creation of content of any kind. 
* It was made for the personal use of the owner, as it disregards any and all legislation regarding intellectual property. */

/** Dependencies */
const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');

/** Models */
const Users = require('../models/Users');

/** POST - adds the User into the database
 * @param {Object} request.body - {name : String, pass : String} */
router.post('/create', async (request, response, next) => 
{
  try 
  {
    let user = new User(request.body);
    let result = await user.create();
    response.status(200).send(result.insertedId);
  } 
  catch(error)
  {
    next(error);
  }
}); 

/** POST - removes the user into the database
 * @middleware auth
 * @todo - make and use adminAuth middleware
 * @param request.body.name - the username*/
router.post('/delete', auth, async (request, response, next) => 
{
  try 
  {
    let result = await User.remove(request.body.name);
    response.status(200).send(result.ok);
  } 
  catch(error)
  {
    next(error);
  }
}); 

/** POST - gets the user data from the database, based on name
 * @param request.body.name - the user's name */
router.post('/get', async (request, response, next) => 
{
  try
  {
    let result = await Users.getByName(request.body.name)
    if(result)
      response.status(200).send(result)
  }
  catch (error) 
  {
    next(error);
  }
}); 

/** GET - gets the whole list of users from the database */
router.get('/getList', async (request, response, next) => 
{
  try
  {
    let result = await Users.getList();
    response.status(200).send(result);
  }
  catch(error)
  {
    next(error);
  }
}); 

/** POST - checks login for given user input
 * @param request.body.name - the username
 * @param request.body.pass - the plain text password */
router.post('/login', async (request, response, next) => 
{
  if(!request.session.user)
  {
    try
    {
      let result = await User.login(request.body.name, request.body.pass);
      if(result)
      {
        request.session.user = result;
        response.status(200).send(request.session.user);
      }
      next();
    }
    catch (error)
    {
      next(error);
    }
  }
  else
    response.status(200).send(request.session.user);
});

/** POST - logout current session user */
router.post('/logout', (request, response, next) => 
{
  if(request.session && request.session.user)
  {    
    console.log(`Killing session for ${request.session.user.name}.`);
    request.session.destroy((error) => 
    {
      if(error)
        next(error);
      else
        response.status(200).send({"message" : "Logout successful."});
    })
  }
  else
  {
    console.log(`Attempting to logout without session.`);
    response.status(200).send({"message" : "Attempting to logout without session."});
  }
});

/** POST - Add User to the current logged in User's friends
 * @middleware auth
 * @param request.body.name - name of the user to add as friend
 * @throws "Cannot add yourself as friendé, "User is already a friend", "User doesn't exist" & other database errors */
router.post('/addFriend', auth, async (request, response, next) => 
{
  let friendName = request.body.name;
  if(!friendName)
    next({"message" : "Missing request parameters."});
  if(friendName == "")
    next({"message" : "Empty request parameters."});
  if(friendName == request.session.user.name)
    next({"message" : "Cannot add yourself as friend."});
  
  try 
  {
    let userFriends = await User.getByName(request.session.user.name);
    if(userFriends.friends && userFriends.friends.indexOf(friendName) != -1)
    {
      next({"message" : `User ${friendName} is already in your friends list.`});
    }
    else
    {
      let result = await User.addFriend(request.session.user.name, friendName);
      response.status(200).send(result);
    }
  }
  catch(error)
  {
    next(error);
  }
});

/** POST - Remove User from the current User's friends
 * @param request.body.name - name of the User to remove as friend
 * @throws "Missing request parameters.", "Empty request parameters.", "User doesn't exist"," User is not in your friends list" & other database errors */
router.post('/removeFriend', auth, async (request, response, next) => 
{
  let friendName = request.body.name;
  if(!friendName)
    next({"message" : "Missing request parameters."});
  if(friendName == "")
    next({"message" : "Empty request parameters."});
  
  try 
  {
    let userFriends = await User.getByName(request.session.user.name);
    if(userFriends.friends && userFriends.friends.indexOf(friendName) != -1)
    {
      let result = await User.removeFriend(request.session.user.name, friendName);
      response.status(200).send(result);
    }
    else
    {
      next({"message" : `User ${friendName} is not in your friends list.`});
    }
  }
  catch(error)
  {
    next(error);
  }
});

/** Export router */
module.exports = router;