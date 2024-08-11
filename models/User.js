import mongoose from "mongoose";
const Schema = mongoose.Schema;
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    maxLength: 10,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  userType: {
    type: String,
    enum: ['Host&Participant', 'Host'],
    default: 'Host&Participant'
  },
  desc: {
    type: String,
    default: null
  },
  location: {
    type: String,
    default: null
  },
  profile: {
    type: String,
    default: null
  },
  document: {
    type: String,
    default: null
  },
  social: [{
    type: {
      type: String,
      enum: ['facebook', 'twitter', 'instagram']
    },
    link: String
  }],
  bookings: [{ type: mongoose.Types.ObjectId, ref: "Booking" }],
  events: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Events",
    },
  ],
});

export default mongoose.model("User", userSchema);
