import Admin from "../models/Admin.js";
import mongoose from "mongoose";
import Blogs from "../models/Blogs.js";
import upload from "../utils/multer.js";
import cloudinary from "../utils/cloudinary.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


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
