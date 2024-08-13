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
      const { eventName, eventCategory, eventDesc, eventPrice, eventLang, noOfAttendees, performerName, hostName, hostWhatsapp, sponserName, eventLink, location, eventAddress, geoCoordinates, startDate, endDate } = JSON.parse(req.body.eventData);

      const errors = validateEventInputs(JSON.parse(req.body.eventData));
      if (errors) {
        return res.status(422).json({ message: 'Invalid inputs', errors });
      }

      const filesWithIndex = req.files.map((file, index) => ({ file, index }));
      filesWithIndex.sort((a, b) => a.index - b.index);

      const eventPosters = await Promise.all(
        filesWithIndex.slice(0, 4).map(async ({ file }) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'SatsangSeva',
          });
          return result.secure_url;
        })
      );

      let event;
      try {
        event = new Events({
          eventName, eventCategory, eventDesc, eventPrice, eventLang, noOfAttendees, performerName, hostName, hostWhatsapp, sponserName, eventLink, location, eventAddress,
          geoCoordinates: {
            type: 'Point',
            coordinates: geoCoordinates,
          },
          startDate: new Date(`${startDate}Z`),
          endDate: new Date(`${endDate}Z`),
          eventPosters: eventPosters,
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

export const updateEvent = async (req, res, next) => {
  const extractedToken = req.headers.authorization.split(" ")[1];
  if (!extractedToken && extractedToken.trim() === "") {
    return res.status(404).json({ message: "Token Not Found" });
  }

  // verify token
  if (extractedToken !== process.env.SECRET_KEY) {
    return res.status(400).json({ message: "Invalid Token" });
  }

  const eventId = req.params.id;

  const event = await Events.findById(eventId);
  if (!event) {
    return res.status(404).json({ message: "Event Not Found" });
  }

  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error in uploading Poster: ', err });
    } else {
      // update event
      const { eventName, eventCategory, eventDesc, eventPrice, eventLang, noOfAttendees, performerName, hostName, hostWhatsapp, sponserName, eventLink, location, eventAddress, geoCoordinates, startDate, endDate } = JSON.parse(req.body.eventData);

      const errors = validateEventInputs(JSON.parse(req.body.eventData));
      if (errors) {
        return res.status(422).json({ message: 'Invalid inputs', errors });
      }

      if (req.files && req.files.length > 0) {
        const filesWithIndex = req.files.map((file, index) => ({ file, index }));
        filesWithIndex.sort((a, b) => a.index - b.index);

        const eventPosters = await Promise.all(
          filesWithIndex.slice(0, 4).map(async ({ file }) => {
            const result = await cloudinary.uploader.upload(file.path, {
              folder: 'SatsangSeva',
            });
            return result.secure_url;
          })
        );

        event.eventPosters = eventPosters;
      }

      event.eventName = eventName;
      event.eventCategory = eventCategory;
      event.eventDesc = eventDesc;
      event.eventPrice = eventPrice;
      event.eventLang = eventLang;
      event.noOfAttendees = noOfAttendees;
      event.performerName = performerName;
      event.hostName = hostName;
      event.hostWhatsapp = hostWhatsapp;
      event.sponserName = sponserName;
      event.eventLink = eventLink;
      event.location = location;
      event.eventAddress = eventAddress;
      event.geoCoordinates = {
        type: 'Point',
        coordinates: geoCoordinates,
      };
      event.startDate = new Date(`${startDate}`);
      event.endDate = new Date(`${endDate}`);

      try {
        await event.save();
      } catch (err) {
        return console.log(err);
      }

      return res.status(201).json({ eventData: event });
    }
  });
};

export const getNearByEvents = async (req, res, next) => {
  const range = req.query.range;
  const location = [req.query.long, req.query.lat];

  let events;

  try {
    // get Upcoming events SortedByStartDate
    const currentDate = new Date();
    events = await Events.find({
      startDate: { $gte: currentDate },
      approved: true,
      geoCoordinates: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: location
          },
          $maxDistance: range * 1000 // convert km to meters
        }
      }
    }).sort({ distance: 1 }).populate('bookings', 'noOfAttendee');

  } catch (err) {
    return console.log(err);
  }

  if (!events) {
    return res.status(500).json({ message: "Request Failed" });
  }
  if (events.length === 0) {
    return res.status(404).json({ message: "No events found" });
  }
  return res.status(200).json({ events: events });
};

export const getUpComingEvents = async (req, res, next) => {
  let events;

  try {
    // get Upcoming events SortedByStartDate
    const currentDate = new Date();
    events = await Events.find({ startDate: { $gte: currentDate }, approved: true }).sort({ startDate: 1 }).populate('bookings', 'noOfAttendee');
    // // get all events
    // events = await Events.find();
  } catch (err) {
    return console.log(err);
  }

  if (!events) {
    return res.status(500).json({ message: "Request Failed" });
  }
  if (events.length === 0) {
    return res.status(404).json({ message: "No events found" });
  }
  return res.status(200).json({ events: events });
};

export const getPastEvents = async (req, res, next) => {
  let events;

  try {
    // get Upcoming events SortedByStartDate
    const currentDate = new Date();
    events = await Events.find({ endDate: { $lt: currentDate } }).sort({ endDate: -1 });
    // // get all events
    // events = await Events.find();
  } catch (err) {
    return console.log(err);
  }

  if (!events) {
    return res.status(500).json({ message: "Request Failed" });
  }
  if (events.length === 0) {
    return res.status(404).json({ message: "No Past events found" });
  }
  return res.status(200).json({ events: events });
};

export const getEventById = async (req, res, next) => {
  const id = req.params.id;
  let event;
  try {
    event = await Events.findById(id).populate('bookings', 'noOfAttendee');
  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: "Invalid Event ID: " + err });
  }

  if (!event) {
    return res.status(404).json({ message: "Invalid Event ID" });
  }

  return res.status(200).json({ event: event });
};

export const approveEventById = async (req, res, next) => {
  const id = req.params.id;
  let event;
  try {
    event = await Events.findById(id);
  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: "Invalid Event ID: " + err });
  }

  if (!event) {
    return res.status(404).json({ message: "Invalid Event ID" });
  }

  event.approved = true; // Approve the event

  try {
    await event.save(); // Save the updated event
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error approving event: " + err });
  }

  return res.status(200).json({ message: "Event: '" + event.eventName + "' is Approved." });
};

export const rejectEventById = async (req, res, next) => {
  const id = req.params.id;
  let event;
  try {
    event = await Events.findById(id);
  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: "Invalid Event ID: " + err });
  }

  if (!event) {
    return res.status(404).json({ message: "Invalid Event ID" });
  }

  event.approved = false; // Reject the event

  try {
    await event.save(); // Save the updated event
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error rejecting event: " + err });
  }

  return res.status(200).json({ message: "Event: '" + event.eventName + "' is Rejected." });
};

export const getPendingEvents = async (req, res, next) => {
  let event;
  try {
    event = await Events.find({ approved: false });
  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: "Error In Finding Pending Approvals: " + err });
  }

  if (!event) {
    return res.status(404).json({ message: "No Event's Approval Pending." });
  }

  return res.status(200).json({ pending: event });
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

  // Delete all Cloudinary images
  try {
    await Promise.all(
      event.eventPosters.map(async (posterUrl) => {
        const publicId = posterUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      })
    );
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
  const hostName = req.query.host;
  const eventAddress = req.query.add;
  const startDate = req.query.date;

  let query = {};

  if (eventName) query.eventName = { $regex: eventName, $options: 'i' };
  if (hostName) query.hostName = { $regex: hostName, $options: 'i' };
  if (eventAddress) query.eventAddress = { $regex: eventAddress, $options: 'i' };
  if (startDate) {
    // const startDateParts = startDate.split('-'); // split the date string into year, month, and day
    const startOfDay = new Date(`${startDate} 0:0:0Z`); // specific date at 00:00:00
    const endOfDay = new Date(`${startDate} 23:59:59Z`); // specific date at 23:59:59

    query.startDate = {
      $gte: startOfDay,
      $lte: endOfDay
    };
  }
  query.approved = true;

  let events;
  try {
    events = await Events.find(query).populate('bookings', 'noOfAttendee');
  } catch (err) {
    return console.log(err);
  }

  if (!events || events.length === 0) {
    return res.status(404).json({ message: "No events found" });
  }

  return res.status(200).json({ events: events });
};

export const suggestEventNames = async (req, res, next) => {
  const eventName = req.query.name;

  if (!eventName) {
    return res.status(200).json({ suggestions: [] });
  }

  const query = {
    eventName: { $regex: eventName, $options: 'i' },
    approved: true
  };

  let suggestions;
  try {
    suggestions = await Events.find(query, { eventName: 1 }).limit(10);
  } catch (err) {
    return console.log(err);
  }

  if (!suggestions || suggestions.length === 0) {
    return res.status(200).json({ suggestions: [] });
  }

  const suggestedEventNames = [...new Set(suggestions.map(suggestion => suggestion.eventName))];

  return res.status(200).json({ suggestions: suggestedEventNames });
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

  if (!inputs.eventDesc || typeof inputs.eventDesc !== 'string' || inputs.eventDesc.trim() === '') {
    errors.eventDesc = 'Event Description is required and must be a non-empty string';
  }

  if (!inputs.eventPrice || typeof inputs.eventPrice !== 'string' || inputs.eventPrice.trim() === '' || parseInt(inputs.eventPrice, 10) < 0) {
    errors.eventPrice = 'Event Price is required and must be >=0';
  }

  if (!inputs.eventLang || typeof inputs.eventLang !== 'string' || inputs.eventLang.trim() === '') {
    errors.eventLang = 'Event language is required and must be a non-empty string';
  }

  if (!inputs.noOfAttendees || typeof inputs.noOfAttendees !== 'string') {
    errors.noOfAttendees = 'Number of attendees is required and must be a positive integer';
  }

  if (!inputs.performerName || typeof inputs.performerName !== 'string' || inputs.performerName.trim() === '') {
    errors.performerName = 'Performer name is required and must be a non-empty string';
  }

  if (!inputs.hostName || typeof inputs.hostName !== 'string' || inputs.hostName.trim() === '') {
    errors.hostName = 'Host name is required and must be a non-empty string';
  }

  if (!inputs.hostWhatsapp || typeof inputs.hostWhatsapp !== 'string' || inputs.hostWhatsapp.length !== 10) {
    errors.hostWhatsapp = 'Host WhatsApp number must be of 10 Digits';
  }

  if (!inputs.sponserName || typeof inputs.sponserName !== 'string' || inputs.sponserName.trim() === "") {
    errors.sponserName = 'Sponsor name must be a non-empty string';
  }

  if (!inputs.eventLink || typeof inputs.eventLink !== 'string' || !/^(https?:\/\/[^\s]+|na)$/i.test(inputs.eventLink.trim())) {
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