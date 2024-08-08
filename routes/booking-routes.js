import express from "express";
import {
  deleteBooking,
  getBookingById,
  getBookingsOfEvent,
  newBooking,
} from "../controllers/booking-controller.js";

const bookingsRouter = express.Router();

bookingsRouter.get("/:id", getBookingById);
bookingsRouter.post("/", newBooking);
bookingsRouter.get("/event/:id", getBookingsOfEvent); //Bookings For Event ID.
bookingsRouter.delete("/:id", deleteBooking);
export default bookingsRouter;
