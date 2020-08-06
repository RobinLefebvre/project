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
 * @param request.body.name - the Channel name */
router.post('/create', auth, async (request, response, next) => 
{
  try
  {
    let users = request.body.users;
    let usersExist = await User.verifyExists(users);
    if(usersExist)
    {
      let channel = new Channel({"name" : request.body.name, "users" : users});
      let result = await channel.create();
      if(result)
        response.status(200).send(channel);
    }
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
    Channel.delete(request.body.uuid);
    response.status(200).send(`Channel ${request.body.uuid} was deleted.`);
  }
  catch (error)
  {
    next(error);
  }
})

/** GET - Gets the Channel with uuid 
 * @middleware - auth
 * @param request.query.uuid - the Channel uuid */
router.get('/get', auth, async (request, response, next) => 
{
  try
  {
    let result = await Channel.getByUuid(request.query.uuid);
    response.status(200).send(result);
  }
  catch (error)
  {
    next(error);
  }
})

/** GET - Gets the list of Channels available to logged in User.
 * @middleware - auth */
router.get('/getList', auth, async (request, response, next) => 
{
  try
  {
    let result = await Channel.getList(request.session.user.name);
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
 * @param request.body.content - the Message content */
router.post('/postMessage', auth, async (request, response, next) => 
{
  try
  {
    let channel = await Channel.getByUuid(request.body.channel);
    let result = await channel.postMessage(request.session.user.name, request.body.content);
    if(result) 
      response.status(200).send(result);
  }
  catch (error)
  {
    next(error);
  }
})

/** Export router */
module.exports = router;