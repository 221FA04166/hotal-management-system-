const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require('../utils/ExpressError.js');
const { listingSchema } = require("../schema.js");
const Listing = require("../models/listing"); // Make sure the path is correct
const { isLogginedIN } = require("../middleware.js");
const Booking = require('../models/booking'); 

// Validation Middleware
const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    console.error('Validation error details:', error.details); // Log the detailed validation error
    throw new ExpressError(400, error.details.map(detail => detail.message).join(', ') || 'Validation error occurred');
  } else {
    next();
  }
};

// Index Route
router.get("/",
  wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  })
);

// New Route
router.get("/new", isLogginedIN, (req, res) => {
  res.render("listings/new.ejs");
});

// Show Route
router.get("/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
      .populate("reviews")
      .populate("owner");
    if (!listing) {
      req.flash("error", "Listing you requested does not exist!");
      return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
  })
);

// Create Route
router.post("/", isLogginedIN,
  validateListing,
  wrapAsync(async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  })
);

// Edit Route
router.get("/:id/edit", isLogginedIN,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing you requested does not exist!");
      return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
  })
);

// Update Route
router.put("/:id", isLogginedIN,
  validateListing,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    req.flash("success", "Listing Updated");
    res.redirect(`/listings/${id}`);
  })
);

// Delete Route
router.delete("/:id", isLogginedIN,
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    let deleteListing = await Listing.findByIdAndDelete(id);
    if (deleteListing) {
      req.flash("success", "Listing Deleted");
    } else {
      req.flash("error", "Listing not found");
    }
    res.redirect("/listings");
  })
);



// Book Route: Show the booking page
router.get("/:id/book", isLogginedIN,  // Make sure the user is logged in before booking
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing you requested does not exist!");
      return res.redirect("/listings");
    }
    res.render("listings/book", { listing });
  })
);

// Book Route: Handle the booking submission
router.post("/:id/book", isLogginedIN, 
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing you requested does not exist!");
      return res.redirect("/listings");
    }

    // Create a new booking
    const newBooking = new Booking({
      listing: listing._id,
      user: req.user._id,  // Assuming the logged-in user's ID is stored in req.user
      status: 'confirmed'  // Set status to confirmed or pending based on your logic
    });

    await newBooking.save();
    req.flash("success", "Booking Confirmed!");
    res.redirect(`/listings/${id}`);
  })
);

// User's Bookings Route
router.get("/my-bookings", isLogginedIN,
  wrapAsync(async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("listing") // Populate listing details if needed
      .exec();
    res.render("bookings/myBookings", { bookings });
  })
);

module.exports = router;
