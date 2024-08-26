import mongoose from "mongoose";
import Bookings from "../models/Bookings.js";
import Event from "../models/Events.js";
import User from "../models/User.js";
import twilio from "twilio";
import translate from "translate";
import dotenv from 'dotenv';
dotenv.config();

function formatDate(date) {
  // Convert the ISO date string to a Date object
  const dt = new Date(date);

  // Helper function to pad single digits with a leading zero
  const pad = (num) => num.toString().padStart(2, '0');

  // Extract year, month, day, hours, minutes, and seconds in UTC
  const year = dt.getUTCFullYear();
  const month = pad(dt.getUTCMonth() + 1); // Months are zero-indexed
  const day = pad(dt.getUTCDate());
  const hours = pad(dt.getUTCHours());
  const minutes = pad(dt.getUTCMinutes());
  const seconds = pad(dt.getUTCSeconds());

  // Return the formatted date string in the required format
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}


const filterJPG = (posters) => {
  // Filter out only .jpg files
  const jpgFiles = posters.filter((poster) => poster.endsWith('.jpg') || poster.endsWith('.jpeg') || poster.endsWith('.png'));

  // If there are .jpg files, send the first one
  if (jpgFiles.length > 0) {
    const firstJpgFile = jpgFiles[0];
    // Send the first .jpg file
    return firstJpgFile;
  } else {
    // If no .jpg files, send the default image URL
    const defaultImageUrl = 'https://play-lh.googleusercontent.com/LnB6MRHv1N4Q2zpJ7vNEeN4EbWRB12BT-Q4dHUbE1WysK_18vJGbxlhXlw8SjECp_zwk';
    return defaultImageUrl;
  }
};

const sendMessage = async (msg, media, userContact) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  const client = twilio(accountSid, authToken);
  try {
    client.messages.create({
      body: msg,
      mediaUrl: [
        media,
      ],
      from: `whatsapp:` + whatsappNumber,
      to: 'whatsapp:+91' + userContact
    })
      .then(message => console.log("Message sent successfully"))
      .catch((e) => {
        console.log("Error sending Message: " + e.message);
      });

    // return res.status(200).json({ success: true, msg:'Message sent successfully' });
  } catch (error) {
    console.log(error.message);
    // return res.status(400).json({ success: false,msg:error.message });
  }

}

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
  if (!existingEvent.approved) {
    return res.status(404).json({ message: "This Event is not approved by Admin." });
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

    //Send WhatsappMsg using Twilio
    const date = new Date(existingEvent.startDate);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1; // +1 because getMonth() returns 0-11
    const day = date.getUTCDate();

    await sendMessage(
      `Dear *${existingUser.name}*,
माननीय *${await translate(existingUser.name, "hi")}*

Thank you for booking with SatsangSeva.com. We are happy to inform you that your event booking with booking ID *${booking._id}* is confirmed.
SatsangSeva.com के साथ बुकिंग करने के लिए आपका धन्यवाद। हमें यह बताते हुए खुशी हो रही है कि बुकिंग आईडी *${booking._id}* के साथ आपका कार्यक्रम बुकिंग कन्फर्म हो गया है।

Booked Event Details:

Event: *${existingEvent.eventName}*
Sponsor: ${existingEvent.sponserName}
Host: ${existingEvent.hostName}
Venue: ${existingEvent.eventAddress}
Time: *${date.getUTCHours()}:${date.getUTCMinutes()}* | Date: *${day}/${month}/${year}* | Tickets: *${noOfAttendee}*
Total amount paid: *FREE*

बुक कार्यक्रम की जानकारी:

कार्यक्रम: *${await translate(existingEvent.eventName, "hi")}*
आयोजक: *${await translate(existingEvent.sponserName, "hi")}*
व्यवस्थापक: *${await translate(existingEvent.hostName, "hi")}*
स्थान: *${await translate(existingEvent.eventAddress, "hi")}*
समय: *${date.getUTCHours()}:${date.getUTCMinutes()}* | दिनांक: *${day}/${month}/${year}* | टिकट: *${noOfAttendee}*
कुल राशि भुगतान: *निःशुल्क*

*Add to GoogleCalendar कैलेंडर में जोड़ें:* https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(existingEvent.eventName)}&details=${encodeURIComponent("SatsangSeva Event Reminder")}&dates=${formatDate(existingEvent.startDate)}/${formatDate(existingEvent.endDate)}&ctz=${encodeURIComponent("Asia/Kolkata")}&location=${encodeURIComponent(existingEvent.location)}
*GPS Location जीपीएस लोकेशन:* ${existingEvent.location}

Booked events can be seen in your profile.
बुक किए गए इवेंट आपकी प्रोफ़ाइल में देखे जा सकते हैं।

*Team SatsangSeva*
*जहां भक्ति, वहां हम*`
      , filterJPG(existingEvent.eventPosters), attendeeContact);

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

export const getBookingsOfEvent = async (req, res, next) => {
  const eventId = req.params.id;
  let booking;
  try {
    booking = await Bookings.find({ event: eventId }).populate('user', 'name');
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

