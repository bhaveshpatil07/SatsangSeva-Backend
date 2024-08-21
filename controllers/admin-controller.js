import Admin from "../models/Admin.js";
import mongoose from "mongoose";
import Blogs from "../models/Blogs.js";
import upload from "../utils/multer.js";
import cloudinary from "../utils/cloudinary.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import dotenv from 'dotenv';
import User from "../models/User.js";
import nodemailer from 'nodemailer';
dotenv.config();

const emailTemplate = `
<style>
  body {
    font-family: Arial, sans-serif;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    padding: 20px;
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .header {
    background-color: #007bff;
    color: #fff;
    padding: 10px;
    border-bottom: 1px solid #ddd;
  }
  .header h2 {
    margin: 0;
  }
  .body {
    padding: 20px;
  }
  .body p {
    margin-bottom: 20px;
  }
  .footer {
    background-color: #007bff;
    color: #fff;
    padding: 10px;
    border-top: 1px solid #ddd;
  }
</style>

<div class="container">
  <div class="header">
    <h2>Contact Us Form Submission: SatsangSeva</h2>
  </div>
  <div class="body">
    <p><strong>Name:</strong> {{name}}</p>
    <p><strong>Email:</strong> {{email}}</p>
    <p><strong>Phone Number:</strong> +91-{{phoneNumber}}</p>
    <p><strong>Message:</strong></p>
    <p>{{message}}</p>
  </div>
  <div class="footer">
    <p>Best regards,</p>
    <p>Team SatsangSeva</p>
  </div>
</div>
`;

export const sendWhatsAppOtp = async (req, res, next) => {
  const phone = req.params.id;
  if (phone.length !== 10) {
    return res.status(422).json({ message: "Invalid phone number" });
  }
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  const verification = await client.verify.v2
    .services(process.env.TWILIO_AUTH_SERVICES)
    .verifications.create({
      channel: "whatsapp",
      to: "+91" + phone,
      channelConfiguration: {
        whatsapp: {
          enabled: true,
        },
      }
    }).then((resp) => {
      // console.log(resp);
      // console.log(resp.accountSid);
      return res.status(200).json({ message: 'SMS/WhatsApp OTP Send Successfully' });
    }).catch((e) => {
      // console.log(e);
      return res.status(404).json({ message: 'Error in Sending OTP: ' + e });
    });
};

export const verifyWhatsAppOtp = async (req, res, next) => {
  const otp = req.query.otp,
    phone = req.query.contact;
  if (phone.length !== 10 || otp.length !== 6) {
    return res.status(422).json({ message: "Invalid Contact/OTP Length." });
  }
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  const verificationCheck = await client.verify.v2
    .services(process.env.TWILIO_AUTH_SERVICES)
    .verificationChecks.create({
      code: otp,
      to: "+91" + phone,
    }).then((resp) => {
      // console.log(otp + " " + phone);
      // console.log(resp.status);
      if (resp.status === "approved") {
        return res.status(200).json({ message: 'Contact Verified Successfully: ' + resp.status });
      } else {
        return res.status(422).json({ message: 'Verification Failed: ' + resp.status });
      }
    }).catch((e) => {
      // console.log(e);
      return res.status(404).json({ message: 'Error in Verifing OTP: ' + e });
    });
};

export const resetPassword = async (req, res, next) => {
  const email = req.params.id;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(422).json({ message: "Invalid Email" });
  }
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(500).json({ message: "User Not Exists for email: " + email });
  }
  const phone = user.phoneNumber;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  const verification = await client.verify.v2
    .services(process.env.TWILIO_AUTH_SERVICES)
    .verifications.create({
      channel: "whatsapp",
      to: "+91" + phone,
      channelConfiguration: {
        whatsapp: {
          enabled: true,
        },
      }
    }).then((resp) => {
      // console.log(resp);
      // console.log(resp.accountSid);
      return res.status(200).json({ message: 'SMS/WhatsApp OTP Send Successfully', to: phone });
    }).catch((e) => {
      // console.log(e);
      return res.status(404).json({ message: 'Error in Sending OTP: ' + e });
    });
};

export const contactUs = async (req, res, next) => {
  const { name, email, phoneNumber, message } = req.body;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_MAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_MAIL,
    to: email,
    subject: 'Thank You For Contacting Us',
    html: emailTemplate.replace('{{name}}', name)
      .replace('{{email}}', email)
      .replace('{{phoneNumber}}', phoneNumber)
      .replace('{{message}}', message),
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Thank you for contacting us' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error sending email' });
  }
};


export const addBlog = async (req, res, next) => {
  upload(req, res, async (err) => {
    const { title, content } = JSON.parse(req.body.blogData);
    if (!title || title.trim() === "" || !content || content.trim() === "") {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    const filesWithIndex = req.files.map((file, index) => ({ file, index }));
    filesWithIndex.sort((a, b) => a.index - b.index);

    const images = await Promise.all(
      filesWithIndex.slice(0, 4).map(async ({ file }) => {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'SatsangSeva/Blogs',
        });
        return result.secure_url;
      })
    );

    try {
      const blog = new Blogs({ title, content, images });

      const session = await mongoose.startSession();
      session.startTransaction();
      await blog.save({ session });
      await session.commitTransaction();
      res.status(201).json({ message: 'Blog added successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Error adding blog', err });
    }
  });
}

export const getBlogs = async (req, res, next) => {
  let blogs;

  try {
    blogs = await Blogs.find().sort({ _id: -1 });
  } catch (err) {
    return console.log(err);
  }

  if (!blogs) {
    return res.status(500).json({ message: "Request Failed" });
  }
  if (blogs.length === 0) {
    return res.status(404).json({ message: "No Blogs found" });
  }

  blogs = blogs.map((blog) => {
    const createdAt = blog._id.getTimestamp();
    blog = { ...blog.toObject(), createdAt };
    return blog;
  });

  return res.status(200).json({ blogs: blogs });
};

export const getBlogById = async (req, res, next) => {
  const id = req.params.id;
  let blog;

  try {
    blog = await Blogs.findById(id);
  } catch (err) {
    return console.log(err);
  }

  if (!blog) {
    return res.status(500).json({ message: "Request Failed" });
  }
  if (blog.length === 0) {
    return res.status(404).json({ message: "No Blogs found fo Id: " + id });
  }

  const createdAt = blog._id.getTimestamp();
  blog = { ...blog.toObject(), createdAt };

  return res.status(200).json({ blog: blog });
};

export const deleteBlog = async (req, res, next) => {
  const id = req.params.id;
  let blog;
  try {
    blog = await Blogs.findByIdAndRemove(id);
  } catch (err) {
    return console.log(err);
  }
  if (!blog) {
    return res.status(500).json({ message: "Something went wrong" });
  }

  // Delete all Cloudinary images
  try {
    await Promise.all(
      blog.images.map(async (imageUrl) => {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      })
    );
  } catch (err) {
    console.log(err);
  }

  return res.status(200).json({ message: "Deleted Successfully" });
};

export const addAdmin = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email && email.trim() === "" && !password && password.trim() === "") {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  let existingAdmin;
  try {
    existingAdmin = await Admin.findOne({ email });
  } catch (err) {
    return console.log(err);
  }

  if (existingAdmin) {
    return res.status(400).json({ message: "Admin already exists" });
  }

  let admin;
  const hashedPassword = bcrypt.hashSync(password);
  try {
    admin = new Admin({ email, password: hashedPassword });
    admin = await admin.save();
  } catch (err) {
    return console.log(err);
  }
  if (!admin) {
    return res.status(500).json({ message: "Unable to store admin" });
  }
  return res.status(201).json({ admin });
};

export const adminLogin = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email && email.trim() === "" && !password && password.trim() === "") {
    return res.status(422).json({ message: "Invalid Inputs" });
  }
  let existingAdmin;
  try {
    existingAdmin = await Admin.findOne({ email });
  } catch (err) {
    return console.log(err);
  }
  if (!existingAdmin) {
    return res.status(400).json({ message: "Admin not found" });
  }
  const isPasswordCorrect = bcrypt.compareSync(
    password,
    existingAdmin.password
  );

  if (!isPasswordCorrect) {
    return res.status(400).json({ message: "Incorrect Password" });
  }

  const token = jwt.sign({ id: existingAdmin._id }, process.env.SECRET_KEY, {
    expiresIn: "7d",
  });

  return res
    .status(200)
    .json({ message: "Authentication Complete", token, id: existingAdmin._id });
};

export const getAdmins = async (req, res, next) => {
  let admins;
  try {
    admins = await Admin.find();
  } catch (err) {
    return console.log(err);
  }
  if (!admins) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
  return res.status(200).json({ admins });
};

export const getAdminById = async (req, res, next) => {
  const id = req.params.id;

  let admin;
  try {
    admin = await Admin.findById(id).populate("addedMovies");
  } catch (err) {
    return console.log(err);
  }
  if (!admin) {
    return console.log("Cannot find Admin");
  }
  return res.status(200).json({ admin });
};
