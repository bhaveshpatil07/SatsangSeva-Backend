import express from "express";
import { addAdmin, addBlog, adminLogin, contactUs, deleteBlog, getAdminById, getAdmins, getBlogById, getBlogs, resetPassword, sendWhatsAppOtp, verifyWhatsAppOtp, } from "../controllers/admin-controller.js";
import { approveEventById, getPendingEvents, rejectEventById } from "../controllers/event-controller.js";

const adminRouter = express.Router();

// adminRouter.post("/signup", addAdmin);
// adminRouter.post("/login", adminLogin);
// adminRouter.get("/", getAdmins);
// adminRouter.get("/:id", getAdminById);
adminRouter.get("/event/pending", getPendingEvents);
adminRouter.put("/approve/:id", approveEventById);
adminRouter.put("/reject/:id", rejectEventById);

adminRouter.post("/verifysend/:id", sendWhatsAppOtp);
adminRouter.get("/verifycheck", verifyWhatsAppOtp);
adminRouter.post("/forgetpassword/:id", resetPassword);
adminRouter.post("/contactus", contactUs);
adminRouter.post("/blog", addBlog);
adminRouter.get("/blog", getBlogs);
adminRouter.get("/blog/:id", getBlogById);
adminRouter.delete("/blog/:id", deleteBlog);

export default adminRouter;
