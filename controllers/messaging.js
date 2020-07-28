/** controllers/messaging.js
* File used for handling the requests related to Messaging to channels.
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

/** POST - Create a new Channel with given Users
 * @middleware - auth
 * @param request.body.users - the Channel users
 * @param request.body.name - the Channel name
 * @throws "Missing request parameters", "Must provide users as an array."
 * @returns {Channel} */
router.post('/create', auth, async (request, response, next) => 
{
  try
  {
    let users = request.body.users;
    let name = request.body.name;
    if(!users || !name)
      throw new Error("Missing request parameters."); 
    if(!Array.isArray(users) || users.length == 0 || name == "")
      throw new Error("Invalid request parameters.");

    // Check users are valid
    for(let i = 0; i < users.length; i++)
    {
      let foundUser = await User.getByName(users[i]);
      if(!foundUser)
        throw new Error("User doesn't exist");
    }

    let result = await Channel.create(users, name);
    response.status(200).send(result.insertedId);
  }
  catch (error)
  {
    next(error);
  }
})

/** POST - Deletes a Channel from database
 * @middleware - auth
 * @todo - make and use adminAuth middleware
 * @param request.body.uuid - the Channel's uuid */
router.post('/delete', auth, async (request, response, next) => 
{
  try
  {
    let result = await Channel.delete(request.body.uuid);
    response.status(200).send(result.insertedId);
  }
  catch (error)
  {
    next(error);
  }
})

/** GET - Gets the Channel with name 
 * @middleware - auth
 * @param request.query.uuid - the Channel uuid
 * @throws "Missing request parameters.", "Must provide users as an array."
 * @returns {Channel} */
router.get('/get', auth, async (request, response, next) => 
{
  try
  {
    let result = await Channel.getByUuid(request.query.uuid, request.session.user.name);
    response.status(200).send(result);
  }
  catch (error)
  {
    next(error);
  }
})

/** GET - Gets the list of Channels available to logged in User.
 * @middleware - auth
 * @returns {Array} the channels list
 * @throws "Collection is empty" & other database errors */
router.get('/getList', auth, async (request, response, next) => 
{
  try
  {
    let user = request.session.user.name;
    let result = await Channel.getList(user);
    if(result.length == 0)
      throw new Error("Collection is empty.")
    response.status(200).send(result);
  }
  catch (error)
  {
    next(error);
  }
})

/** POST - Adds a given message to the given channel 
 * @middleware - auth
 * @param request.body.channel - the Channel ID
 * @param request.body.content - the Message content
 * @throws "Missing request parameters."
 * @returns {Array} the channels list */
router.post('/postMessage', auth, async (request, response, next) => 
{
  try
  {
    let result = await Channel.postMessage( request.body.channel, request.session.user.name, request.body.content);
    response.status(200).send(result);
  }
  catch (error)
  {
    next(error);
  }
})

/** Export router */
module.exports = router;