import express from "express";
import { addAdmin, addBlog, adminLogin, deleteBlog, getAdminById, getAdmins, getBlogById, getBlogs, } from "../controllers/admin-controller.js";
import { approveEventById, getPendingEvents, rejectEventById } from "../controllers/event-controller.js";

const adminRouter = express.Router();

// adminRouter.post("/signup", addAdmin);
// adminRouter.post("/login", adminLogin);
// adminRouter.get("/", getAdmins);
// adminRouter.get("/:id", getAdminById);
adminRouter.get("/event/pending", getPendingEvents);
adminRouter.put("/approve/:id", approveEventById);
adminRouter.put("/reject/:id", rejectEventById);

adminRouter.post("/blog", addBlog);
adminRouter.get("/blog", getBlogs);
adminRouter.get("/blog/:id", getBlogById);
adminRouter.delete("/blog/:id", deleteBlog);

export default adminRouter;
