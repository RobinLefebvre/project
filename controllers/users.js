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

/** GET - gets the whole list of users from the database 
 * @middleware auth */
router.get('/isAuth', auth, async (request, response, next) => 
{
  console.log(`Checking auth on user ${request.session.user.name}`)
  if(request.session && request.session.user)
    response.status(200).send({"ok" : true});
  else
    next();
}); 

/** POST - adds the User into the database
 * @param {Object} request.body - {name : String, pass : String} */
router.post('/create', async (request, response, next) => 
{
  try 
  {
    let b = request.body;
    let user = new User(b);
    await user.create();
    await Channel.addUserToGlobal(user.name)
    response.status(200).send(user);
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
    let u = await User.getByName(request.body.name);
    if(u)
    {
      await User.remove(request.body.name);
      await Channel.removeUserFromChannels(request.body.name);
      response.status(200).send({"message" : `User ${request.body.name} was deleted.`});
    }
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
  try
  {
    let name = request.query.name;
    let result = await User.getByName(name)
    if(result)
      response.status(200).send(result)
  }
  catch (error) 
  {
    next(error);
  }
}); 

/** GET - gets the logged in user's data
 * @middleware auth
 * @param request.body.name - the user's name */
router.get('/getSelf', auth, async (request, response, next) => 
{
  try
  {
    let result = await User.getByName(request.session.user.name)
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

/** POST - Manages the addition or removal of users into the current user's Friends and Blocked lists
 * @middleware auth 
 * @param request.body.action - Action to perform : "friend", "removeFriend", "block", "removeBlock"
 * @param request.body.name - name of the user to deal with */
router.post('/updateRelationship', auth, async (request, response, next) => 
{
  try 
  {    
    let currentUser = await User.getByName(request.session.user.name);
    if(currentUser)
    {
      let result = await currentUser.updateRelationship(request.body.action, request.body.name);
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
        response.status(200).send(request.session);
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
    response.status(200).send(request.session);
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