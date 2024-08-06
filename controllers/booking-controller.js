import mongoose from "mongoose";
import Bookings from "../models/Bookings.js";
import Event from "../models/Events.js";
import User from "../models/User.js";

export const newBooking = async (req, res, next) => {
  const { event, attendeeContact, noOfAttendee, amountPaid, paymentId, user } = req.body;

  let existingEvent;
  let existingUser;
  try {
    existingEvent = await Event.findById(event);
    existingUser = await User.findById(user);
  } catch (err) {
    return console.log(err);
  }
  if (!existingEvent) {
    return res.status(404).json({ message: "Event Not Found With Given ID" });
  }
  if (!user) {
    return res.status(404).json({ message: "User not found with given ID" });
  }
  let booking;

  try {
    booking = new Bookings({
      event,
      attendeeContact,
      noOfAttendee,
      amountPaid,
      paymentId,
      user,
    });
    const session = await mongoose.startSession();
    session.startTransaction();
    existingUser.bookings.push(booking);
    existingEvent.bookings.push(booking);
    await existingUser.save({ session });
    await existingEvent.save({ session });
    await booking.save({ session });
    session.commitTransaction();
  } catch (err) {
    return console.log(err);
  }

  if (!booking) {
    return res.status(500).json({ message: "Unable to create a booking" });
  }

  return res.status(201).json({ booking });
};

export const getBookingById = async (req, res, next) => {
  const id = req.params.id;
  let booking;
  try {
    booking = await Bookings.findById(id).populate("event");
  } catch (err) {
    return console.log(err);
  }
  if (!booking) {
    return res.status(500).json({ message: "Unexpected Error" });
  }
  return res.status(200).json({ booking });
};

export const deleteBooking = async (req, res, next) => {
  const id = req.params.id;
  let booking;
  try {
    booking = await Bookings.findByIdAndRemove(id).populate("user event");
    console.log(booking);
    const session = await mongoose.startSession();
    session.startTransaction();
    await booking.user.bookings.pull(booking);
    await booking.event.bookings.pull(booking);
    await booking.event.save({ session });
    await booking.user.save({ session });
    session.commitTransaction();
  } catch (err) {
    return console.log(err);
  }
  if (!booking) {
    return res.status(500).json({ message: "Unable to Delete" });
  }
  return res.status(200).json({ message: "Successfully Deleted" });
};

export const getCount = async (req, res, next) => {
  try {
    const [userCount, totalAttendees, eventCount] = await Promise.all([
      User.countDocuments({}),
      Bookings.aggregate([
        {
          $group: {
            _id: null,
            totalAttendees: { $sum: { $toInt: "$noOfAttendee" } },
          },
        },
      ]).then((result) => result[0].totalAttendees),
      Event.countDocuments({}), 
    ]);

    res.json({
      users: userCount,
      bookings: totalAttendees,
      events: eventCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving counts' });
  }
};

