import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Events from "../models/Events.js";
import User from "../models/User.js";
import upload from "../utils/multer.js";
import cloudinary from "../utils/cloudinary.js";
import Bookings from "../models/Bookings.js";

export const addEvent = async (req, res, next) => {
  const extractedToken = req.headers.authorization.split(" ")[1];
  if (!extractedToken && extractedToken.trim() === "") {
    return res.status(404).json({ message: "Token Not Found" });
  }

  let adminId;

  // verify token
  jwt.verify(extractedToken, process.env.SECRET_KEY, (err, decrypted) => {
    if (err) {
      return res.status(400).json({ message: `${err.message}` });
    } else {
      adminId = decrypted.id;
      return;
    }
  });

  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error in uploading Poster: ', err });
    } else {
      // create new event
      const { eventName, eventCategory, eventLang, noOfAttendees, performerName, hostName, hostWhatsapp, sponserName, eventLink, location, eventAddress, startDate, endDate } = JSON.parse(req.body.eventData);

      const errors = validateEventInputs(JSON.parse(req.body.eventData));
      if (errors) {
        return res.status(422).json({ message: 'Invalid inputs', errors });
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'SatsangSeva',
      });

      let event;
      try {
        event = new Events({
          eventName, eventCategory, eventLang, noOfAttendees, performerName, hostName, hostWhatsapp, sponserName, eventLink, location, eventAddress,
          startDate: new Date(`${startDate}Z`),
          endDate: new Date(`${endDate}Z`),
          eventPoster: result.secure_url,
          user: adminId,
        });

        const session = await mongoose.startSession();
        const adminUser = await User.findById(adminId);
        session.startTransaction();
        await event.save({ session });
        adminUser.events.push(event);
        await adminUser.save({ session });
        await session.commitTransaction();
      } catch (err) {
        return console.log(err);
      }

      if (!event) {
        return res.status(500).json({ message: "Request Failed" });
      }

      return res.status(201).json({ eventData: event });
    }
  });
};

export const getAllEvents = async (req, res, next) => {
  let events;

  try {
    // get Upcoming events
    const currentDate = new Date();
    events = await Events.find({ startDate: { $gte: currentDate } });
    // // get all events
    // events = await Events.find();
  } catch (err) {
    return console.log(err);
  }

  if (!events) {
    return res.status(500).json({ message: "Request Failed" });
  }
  return res.status(200).json({ events: events });
};

export const getEventById = async (req, res, next) => {
  const id = req.params.id;
  let event;
  try {
    event = await Events.findById(id);
  } catch (err) {
    return console.log(err);
  }

  if (!event) {
    return res.status(404).json({ message: "Invalid Event ID" });
  }

  return res.status(200).json({ event: event });
};

export const deleteEvent = async (req, res, next) => {
  const id = req.params.id;
  let event;
  try {
    event = await User.findByIdAndRemove(id);
  } catch (err) {
    return console.log(err);
  }
  if (!event) {
    return res.status(500).json({ message: "Something went wrong" });
  }

  // Extract the public_id from the secure_url
  const publicId = event.eventPoster.split('/').pop().split('.')[0];

  // Delete Cloudinary image
  try {
    await cloudinary.v2.uploader.destroy(publicId);
  } catch (err) {
    console.log(err);
  }

  // Delete all bookings related to the event
  try {
    await Bookings.deleteMany({ event: id });
  } catch (err) {
    console.log(err);
  }

  return res.status(200).json({ message: "Deleted Successfully" });
};

export const searchEvents = async (req, res, next) => {
  const eventName = req.query.name;
  const eventAddress = req.query.add;
  const startDate = req.query.date;

  let query = {};

  if (eventName) query.eventName = { $regex: eventName, $options: 'i' };
  if (eventAddress) query.eventAddress = { $regex: eventAddress, $options: 'i' };
  if (startDate) query.startDate = { $gte: new Date(`${startDate}Z`) };

  let events;
  try {
    events = await Events.find(query);
  } catch (err) {
    return console.log(err);
  }

  if (!events || events.length === 0) {
    return res.status(404).json({ message: "No events found" });
  }

  return res.status(200).json({ events: events });
};

// eventValidation.js
function validateEventInputs(inputs) {
  const errors = {};

  if (!inputs.eventName || typeof inputs.eventName !== 'string' || inputs.eventName.trim() === '') {
    errors.eventName = 'Event name is required and must be a non-empty string';
  }

  if (!inputs.eventCategory || typeof inputs.eventCategory !== 'string' || inputs.eventCategory.trim() === '') {
    errors.eventCategory = 'Event category is required and must be a non-empty string';
  }

  if (!inputs.eventLang || typeof inputs.eventLang !== 'string' || inputs.eventLang.trim() === '') {
    errors.eventLang = 'Event language is required and must be a non-empty string';
  }

  if (!inputs.noOfAttendees || typeof inputs.noOfAttendees !== 'string' || parseInt(inputs.noOfAttendees, 10) <= 0) {
    errors.noOfAttendees = 'Number of attendees is required and must be a positive integer';
  }

  if (!inputs.performerName || typeof inputs.performerName !== 'string' || inputs.performerName.trim() === '') {
    errors.performerName = 'Performer name is required and must be a non-empty string';
  }

  if (!inputs.hostName || typeof inputs.hostName !== 'string' || inputs.hostName.trim() === '') {
    errors.hostName = 'Host name is required and must be a non-empty string';
  }

  if (inputs.hostWhatsapp && typeof inputs.hostWhatsapp !== 'string' && inputs.hostWhatsapp.length !== 10) {
    errors.hostWhatsapp = 'Host WhatsApp number must be of 10 Digits';
  }

  if (inputs.sponserName && typeof inputs.sponserName !== 'string' && inputs.sponserName.trim() !== "") {
    errors.sponserName = 'Sponsor name must be a non-empty string';
  }

  if (inputs.eventLink && typeof inputs.eventLink !== 'string' && inputs.eventLink.trim() !== "") {
    errors.eventLink = 'Event link must be a valid URL';
  }

  if (!inputs.location || typeof inputs.location !== 'string' || inputs.location.trim() === '') {
    errors.location = 'Location is required and must be a non-empty string';
  }

  if (!inputs.eventAddress || typeof inputs.eventAddress !== 'string' || inputs.eventAddress.trim() === '') {
    errors.eventAddress = 'Event address is required and must be a non-empty string';
  }

  if (!inputs.startDate || typeof inputs.startDate !== 'string' || isNaN(Date.parse(inputs.startDate))) {
    errors.startDate = 'Start date is required and must be a valid date';
  }

  if (!inputs.endDate || typeof inputs.endDate !== 'string' || isNaN(Date.parse(inputs.endDate))) {
    errors.endDate = 'End date is required and must be a valid date';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}