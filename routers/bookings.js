const express = require('express');
const router = express.Router();
const Booking = require('../models/booking'); // Assuming you have a Booking model
const { isLogginedIN } = require('../middleware');
const wrapAsync = require('../utils/wrapAsync');

// Route to show user's bookings
router.get("/bookings", isLogginedIN, wrapAsync(async (req, res) => {
    // Find bookings where the `user` matches the logged-in user's ID
    const bookings = await Booking.find({ user: req.user._id }).populate('listing');  // Populate listing details
    
    // Render the bookings page, passing the user's bookings
    res.render("bookings/index", { bookings });
}));



module.exports = router;
