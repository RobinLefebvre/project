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

/** POST - adds the user into the database
 * @param request.body.name - the username
 * @param request.body.pass - the plain text password 
 * @returns the created document's _id
 * @throws user already exists & other database errors */
router.post('/create', async (request, response, next) => 
{
  let name = request.body.name;
  let pass = request.body.pass;
  if(!name || !pass)
    next({"message" : "Missing request parameters."});
  if(name == "" || pass == "")
    next({"message" : "Empty request parameters."});

  try 
  {
    let result = await Users.create(name, pass);
    response.status(200).send(result.insertedId);
  } 
  catch(error)
  {
    next(error);
  }
}); 

/** POST - gets the user data from the database, based on name
 * @param request.body.name - the user's name
 * @returns the created database user 
 * @throws user already exists & other database errors */
router.post('/get', async (request, response, next) => 
{
  let name = request.body.name;
  if(!name)
    next({"message" : "Missing request parameters."});
  if(name == "")
    next({"message" : "Empty request parameters."});

  try
  {
    let result = await Users.getByName(name)
    if(result)
      response.status(200).send(result)
  }
  catch (error) 
  {
    next(error);
  }
}); 

/** GET - gets the whole list of users from the database
 * @returns {Array} users' _id and name
 * @throws collection is empty & other database errors */
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

/** POST - Add user to the current user's friends
 * @param request.body.name - name of the user to add as friend
 * @returns the created document's _id
 * @throws cannot add yourself as friend, user is already a friend, user doesn't exist & other database errors */
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
    let userFriends = await Users.getByName(request.session.user.name);
    if(userFriends.friends && userFriends.friends.indexOf(friendName) != -1)
    {
      next({"message" : `User ${friendName} is already in your friends list.`});
    }
    else
    {
      let result = await Users.addToFriends(request.session.user.name, friendName);
      response.status(200).send(result);
    }
  }
  catch(error)
  {
    next(error);
  }
}); 

/** POST - checks login for given user input
 * @param request.body.name - the username
 * @param request.body.pass - the plain text password 
 * @returns true | false
 * @throws user doesn't exist, password isn't a match, db errors */
router.post('/login', async (request, response, next) => 
{
  let name = request.body.name;
  let pass = request.body.pass;
  if(!name || !pass)
    next({"message" : "Missing request parameters."});
  if(name == "" || pass == "")
    next({"message" : "Empty request parameters."});

  try
  {
    let result = await Users.login(name, pass);
    if(result)
    {
      request.session.user = result;
      response.status(200).send(result);
    }
    next();
  }
  catch (error)
  {
    next(error);
  }
});

/** POST - logout current session user
 * @returns true | false */
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

/** Export router */
module.exports = router;