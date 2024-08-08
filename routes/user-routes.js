import express from "express";
import { deleteUser, getAllUsers, getBookingsOfUser, getEventsOfUser, getUserById, login, modifyUser, singup, submitDoc, updateUser,
} from "../controllers/user-controller.js";

const userRouter = express.Router();

userRouter.get("/", getAllUsers);
userRouter.get("/:id", getUserById);
userRouter.post("/signup", singup);
userRouter.put("/:id", updateUser);
userRouter.put("/update/:id", modifyUser);
userRouter.post("/verify", submitDoc);
userRouter.delete("/:id", deleteUser);
userRouter.post("/login", login);
userRouter.get("/bookings/:id", getBookingsOfUser);
userRouter.get("/events/:id", getEventsOfUser);

export default userRouter;
