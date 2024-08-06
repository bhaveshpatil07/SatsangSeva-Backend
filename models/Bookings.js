import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  event: {
    type: mongoose.Types.ObjectId,
    ref: "Events",
    required: true,
  },
  attendeeContact: {
    type: String,
    required: true,
  },
  noOfAttendee: {
    type: String,
    required: true
  },
  amountPaid: {
    type: String,
    required: true
  },
  paymentId: {
    type: String,
    default: null
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

export default mongoose.model("Booking", bookingSchema);
