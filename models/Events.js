import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    text: true,
    required: true,
  },
  eventCategory: {
    type: String,
    required: true,
  },
  eventPosters: {
    type: [{ type: String }],
    required: true,
  },
  eventDesc: {
    type: String,
    required: true,
  },
  eventPrice: {
    type: String,
    required: true,
  },
  eventLang: {
    type: String,
    required: true,
  },
  noOfAttendees: {
    type: String,
    required: true,
  },
  performerName: {
    type: String,
    required: true,
  },
  hostName: {
    type: String,
    required: true,
  },
  hostWhatsapp: {
    type: String,
    required: true,
  },
  sponserName: {
    type: String,
    required: true,
  },
  eventLink: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  eventAddress: {
    type: String,
    required: true,
  },
  geoCoordinates: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  approved: {
    type: Boolean,
    index: true,
    default: false,
  },
  bookings: [{ type: mongoose.Types.ObjectId, ref: "Booking" }],
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
});
eventSchema.index({ geoCoordinates: '2dsphere' });

export default mongoose.model("Events", eventSchema);
