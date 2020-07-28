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
const User = require('../models/Users');
const Channel = require('../models/Channels');

/** POST - adds the User into the database
 * @param {Object} request.body - {name : String, pass : String} */
router.post('/create', async (request, response, next) => 
{
  try 
  {
    let b = request.body;
    let user = new User(b);
    let result = await user.create();
    await Channel.addUser('Global', result.ops[0].name)
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
router.post('/delete', async (request, response, next) => 
{
  try 
  {
    let b = request.body;
    let u = await User.getByName(b.name);
    if(u)
    {
      await User.remove(b.name);
      let channels = await Channel.getList(b.name);
      if(channels)
      {
        channels.forEach(async (ch) => 
        {
          let r = await Channel.removeUser(ch.uuid, b.name);
        })
      }
    }

    response.status(200).send({"message" : `User ${b.name} was deleted.`});
  } 
  catch(error)
  {
    next(error);
  }
}); 

/** GET - gets the user data from the database, based on name
 * @param request.body.name - the user's name */
router.get('/get', async (request, response, next) => 
{
  let name = request.query.name;
  if(!name)
    next({"message" : "Missing request parameters."});
  if(name == "")
    next({"message" : "Empty request parameters."});

  try
  {
    let result = await User.getByName(name)
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
    let result = await User.getList();
    response.status(200).send(result);
  }
  catch(error)
  {
    next(error);
  }
}); 

/** POST - Adds user from the current user's friends
 * @middleware auth
 * @param request.body.name - name of the user to add as friend
 * @param request.body.pass - the plain text password */
router.post('/addFriend', auth, async (request, response, next) => 
{
  try 
  {
    let result = await User.addFriend(request.session.user.name, request.body.name);
    response.status(200).send(result);
  }
  catch(error)
  {
    next(error);
  }
}); 

/** POST - Removes user from the current user's friends
 * @middleware auth
 * @param request.body.name - name of the user to remove from friends */
router.post('/removeFriend', auth, async (request, response, next) => 
{
  try 
  {
    let result = await User.removeFriend(request.session.user.name, request.body.name);
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
    let name = request.body.name;
    let pass = request.body.pass;
    if(!name || !pass)
      next({"message" : "Missing request parameters."});
    if(name == "" || pass == "")
      next({"message" : "Empty request parameters."});
  
    try
    {
      let result = await User.login(name, pass);
      if(result)
      {
        request.session.user = result;
        response.status(200).send(request.session.cookie);
      }
      next();
    }
    catch (error)
    {
      next(error);
    }
  }
  else
  {
    response.status(200).send(request.session.cookie);
  }
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

/** Export router */
module.exports = router;