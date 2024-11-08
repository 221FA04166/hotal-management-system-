const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate= require("ejs-Mate");
const ExpressError = require('./utils/ExpressError.js');
const session = require("express-session");
const flash= require("connect-flash");
const passport= require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listings=require("./routers/listing.js");
const review= require("./routers/review.js");
const user= require("./routers/user.js");
const bookingsRoutes = require('./routers/bookings.js');  // Add your booking route file

app.use('/bookings', bookingsRoutes);  // Mount the bookings route

main()
  .then(() => {
    console.log("connection successful");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wonderland");
}


app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));


const sessionOptions={
  secret: "mysupersecretecode",
  resave: false,
  saveUninitialized:true,
  cookie:{
    expires: Date.now()+7*24*60*60*1000,
    maxAge: 7*24*60*60*1000,
    httpOnly: true,
  },
};

app.get("/", (req, res) => {
  res.send("hi, I am root");
});

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
})




app.use("/listings",listings);
app.use("/listings/:id/reviews",review)
app.use("/",user);



app.all("*",(req,res,next)=>{
  next(new ExpressError(404,"Page Not found!!"));
});




app.use((err,req,res,next)=>{
  let {statusCode=500,message="somthing went wrong"}=err;
  res.render("error.ejs", {err});
  // res.status(statusCode).send(message);
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
