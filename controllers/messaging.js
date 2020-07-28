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
 * @throws "Missing request parameters.", "Must provide users as an array."
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

    // Create the channel
    let result = await Channel.create(users, name);
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
    let name = request.query.uuid;
    let user = request.session.user.name;

    let result = await Channel.getByUuid(user, name);
    response.status(200).send(result);
  }
  catch (error)
  {
    next(error);
  }
})

/** GET - Gets the list of Channels available to logged in User.
 * @middleware - auth
 * @returns {Array} the channels list */
router.get('/getList', auth, async (request, response, next) => 
{
  try
  {
    let user = request.session.user.name;
    let result = await Channel.getList(user);
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
    let content = request.body.content;
    let channel = request.body.channel;
    let user = request.session.user.name;

    if(!content || !channel)
      throw new Error("Missing request parameters");

    let result = await Channel.postMessage(channel, user, content);
    response.status(200).send(result);
  }
  catch (error)
  {
    next(error);
  }
})

/** Export router */
module.exports = router;