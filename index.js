// All the imports.
import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import  {Strategy as JwtStrategy , ExtractJwt}  from 'passport-jwt';
import passport from 'passport';
import cors from 'cors';
import User from "./models/user.model.js";
import authRoutes from "./routes/auth.js";
import songRoutes from "./routes/song.js";
import playlistRoutes from './routes/playlist.js';

// All the routes are below.
const app = express();
app.use(express.json());
app.use(cors());
app.use('/auth', authRoutes);
app.use('/song',songRoutes);
app.use('/playlist',playlistRoutes)

// below code is for the jwtstrategy and is generated using passport.js. Callback is no longer supported in the findOne method of the mongoose and hence the older promise (then,catch) or async await can be used.
let opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET_PASSPORT_JWT;
passport.use(new JwtStrategy(opts, async function(jwt_payload, done) {
    try{
        const user= await User.findOne({_id: jwt_payload.identifier})
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    }
    catch(err){
        return done(err, false);
    }
}));

// App Listens to the port.
app.listen(process.env.PORT || 3000, ()=>{
    console.log("Listening On Port " + process.env.PORT);
});

// Connection of the database.
mongoose.connect(process.env.MONGO_DB_URL,{
    useUnifiedTopology: true,
    useNewURLParser: true,
}).then((success)=>{
    console.log("Connected to the Database Successfully");
}).catch((error)=>{
    console.log("Error Connecting to the Database");
});
