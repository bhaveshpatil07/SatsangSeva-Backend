import User from "../models/User.js";
import bcrypt from "bcryptjs";
import Bookings from "../models/Bookings.js";
import jwt from "jsonwebtoken";
import Events from "../models/Events.js";
import upload from "../utils/multer.js";
import cloudinary from "../utils/cloudinary.js";

export const getAllUsers = async (req, res) => {
  let users;
  try {
    users = await User.find().sort({ _id: -1 });
  } catch (err) {
    return console.log(err);
  }
  if (!users) {
    return res.status(500).json({ message: "Unexpected Error Occured" });
  }
  return res.status(200).json({ users });
};

export const singup = async (req, res) => {
  const { name, email, phoneNumber, password, userType } = req.body;
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
    user = new User({ name, email, phoneNumber, password: hashedPassword, userType });
    user = await user.save();
  } catch (err) {
    return console.log(err);
  }
  if (!user) {
    return res.status(500).json({ message: "Unexpected Error Occured" });
  }
  return res.status(201).json({ id: user._id });
};

export const updateUser = async (req, res) => {
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

export const modifyUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: `User doesn't exist for id: ${id}` });
    }

    upload(req, res, async () => {
      const update = {};
      const { name, phoneNumber, password, desc, location, social } = JSON.parse(req.body.updateUser);

      if (name) update.name = name;
      // if (email) update.email = email;
      if (phoneNumber) update.phoneNumber = phoneNumber;
      if (password) update.password = bcrypt.hashSync(password);
      if (desc) update.desc = desc;
      if (location) update.location = location;

      // Handle profile image upload
      if (req.files && req.files.length > 0) {
        try {
          const file = req.files[0];
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'SatsangSeva/Users',
          });
          update.profile = result.secure_url;
        } catch (err) {
          console.log(err);
          return res.status(500).json({ message: err });
        }
      }

      if (social) {
        update.social = Object.keys(social).map((key) => {
          return { type: key, link: social[key] };
        });
      }

      try {
        await User.findByIdAndUpdate(id, update, { new: true });
        return res.status(200).json({ message: "Updated Successfully" });
      } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err });
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err });
  }
};

export const submitDoc = async (req, res) => {
  const extractedToken = req.headers.authorization.split(" ")[1];
  if (!extractedToken && extractedToken.trim() === "") {
    return res.status(404).json({ message: "Token Not Found" });
  }

  let userId;

  // verify token
  jwt.verify(extractedToken, process.env.SECRET_KEY, (err, decrypted) => {
    if (err) {
      return res.status(400).json({ message: `${err.message}` });
    } else {
      userId = decrypted.id;
      return;
    }
  });

  upload(req, res, async () => {
    const update = {};
    // Handle doc upload
    if (req.files) {
      try {
        const file = req.files[0];
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'SatsangSeva/Users/docs',
          resource_type: "auto",
        });
        update.document = result.secure_url;
      } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err });
      }
    }

    try {
      return res.status(200).json({ message: "Document Updated Successfully!" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: err });
    }
  });
};

export const deleteUser = async (req, res) => {
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

export const login = async (req, res) => {
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

export const getBookingsOfUser = async (req, res) => {
  const id = req.params.id;
  let bookings;
  try {
    bookings = await Bookings.find({ user: id })
      .populate("event")
      // .populate("user")
      .sort({ _id: -1 });
  } catch (err) {
    return console.log(err);
  }
  if (!bookings) {
    return res.status(500).json({ message: "Unable to get Your Bookings" });
  }
  return res.status(200).json({ bookings });
};

export const getEventsOfUser = async (req, res) => {
  const id = req.params.id;
  let events;
  try {
    events = await Events.find({ user: id, approved: true }).sort({ _id: -1 });
  } catch (err) {
    return console.log(err);
  }
  if (!events) {
    return res.status(500).json({ message: "Unable to get Your Events" });
  }
  return res.status(200).json({ events: events });
};

export const getUserById = async (req, res) => {
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
  const createdAt = user._id.getTimestamp();
  user = { ...user.toObject(), createdAt };
  return res.status(200).json({ user });
};
