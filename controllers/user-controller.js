import User from "../models/User.js";
import bcrypt from "bcryptjs";
import Bookings from "../models/Bookings.js";
import jwt from "jsonwebtoken";
import Events from "../models/Events.js";

export const getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find();
  } catch (err) {
    return console.log(err);
  }
  if (!users) {
    return res.status(500).json({ message: "Unexpected Error Occured" });
  }
  return res.status(200).json({ users });
};

export const singup = async (req, res, next) => {
  const { name, email, phoneNumber, password } = req.body;
  if (
    !name &&
    name.trim() === "" &&
    !email &&
    email.trim() === "" &&
    !password &&
    password.trim() === "" &&
    !phoneNumber &&
    phoneNumber.trim() === ""
  ) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(req.body.email)) {
    return res.status(422).json({ message: 'Invalid email: ' + email });
  }

  const hashedPassword = bcrypt.hashSync(password);
  let user;
  try {
    user = new User({ name, email, phoneNumber, password: hashedPassword });
    user = await user.save();
  } catch (err) {
    return console.log(err);
  }
  if (!user) {
    return res.status(500).json({ message: "Unexpected Error Occured" });
  }
  return res.status(201).json({ id: user._id });
};

export const updateUser = async (req, res, next) => {
  const id = req.params.id;
  const { name, email, phoneNumber, password } = req.body;
  // Check if any of the fields are provided
  if (
    (!name || name.trim() === "") &&
    (!email || email.trim() === "") &&
    (!phoneNumber || phoneNumber.trim() === "") &&
    (!password || password.trim() === "")
  ) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }
  const hashedPassword = bcrypt.hashSync(password);

  // Check if id is an email using regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  let user;
  try {
    if (emailRegex.test(id)) {
      // Find user by email and update
      const update = {};
      if (name) update.name = name;
      if (email) update.email = email;
      if (phoneNumber) update.phoneNumber = phoneNumber;
      if (password) update.password = bcrypt.hashSync(password);
      user = await User.findOneAndUpdate({ email: id }, update);
    } else {
      // Find user by id and update
      const update = {};
      if (name) update.name = name;
      if (email) update.email = email;
      if (phoneNumber) update.phoneNumber = phoneNumber;
      if (password) update.password = bcrypt.hashSync(password);
      user = await User.findByIdAndUpdate(id, update);
    }
  } catch (errr) {
    console.log(errr);
    return res.status(500).json({ message: errr });
  }
  if (!user) {
    return res.status(500).json({ message: "Something went wrong" });
  }
  res.status(200).json({ message: "Updated Sucessfully" });
};

export const deleteUser = async (req, res, next) => {
  const id = req.params.id;
  let user;
  try {
    user = await User.findByIdAndRemove(id);
  } catch (err) {
    return console.log(err);
  }
  if (!user) {
    return res.status(500).json({ message: "Something went wrong" });
  }
  return res.status(200).json({ message: "Deleted Successfully" });
};

export const login = async (req, res, next) => {
  const { email, password, gAuth } = req.body;
  if (!email && email.trim() === "" && !password && password.trim() === "") {
    return res.status(422).json({ message: "Invalid Inputs" });
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(req.body.email)) {
    return res.status(422).json({ message: 'Invalid email: ' + email });
  }
  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return console.log(err);
  }

  if (!existingUser) {
    return res
      .status(404)
      .json({ message: "Unable to find user from this ID" });
  }

  if (!gAuth || gAuth === false) {
    const isPasswordCorrect = bcrypt.compareSync(password, existingUser.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Incorrect Password" });
    }
  }

  const token = jwt.sign({ id: existingUser._id }, process.env.SECRET_KEY, {
    expiresIn: "5h",
  });

  return res
    .status(200)
    .json({ message: "Login Successfull", token, id: existingUser._id });
};

export const getBookingsOfUser = async (req, res, next) => {
  const id = req.params.id;
  let bookings;
  try {
    bookings = await Bookings.find({ user: id })
      .populate("event")
      .populate("user")
      .sort({ _id: -1 });
  } catch (err) {
    return console.log(err);
  }
  if (!bookings) {
    return res.status(500).json({ message: "Unable to get Your Bookings" });
  }
  return res.status(200).json({ bookings });
};

export const getEventsOfUser = async (req, res, next) => {
  const id = req.params.id;
  let events;
  try {
    events = await Events.find({ user: id }).sort({ _id: -1 });
  } catch (err) {
    return console.log(err);
  }
  if (!events) {
    return res.status(500).json({ message: "Unable to get Your Events" });
  }
  return res.status(200).json({ events: events });
};

export const getUserById = async (req, res, next) => {
  const id = req.params.id;
  let user;
  try {
    user = await User.findById(id);
  } catch (err) {
    return console.log(err);
  }
  if (!user) {
    return res.status(500).json({ message: "Unexpected Error Occured" });
  }
  return res.status(200).json({ user });
};
