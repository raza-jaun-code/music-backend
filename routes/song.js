import express from 'express';
import Song from '../models/song.model.js';
import User from '../models/user.model.js';
import passport from 'passport';

const router = express.Router();

router.post('/create', passport.authenticate("jwt",{session:false}) ,async (req, res) => {

    // Get the name , thumbnail , track from the body of the request.
    const {name,thumbnail,track} = req.body;

    // If the name thumbnail or track is missing return an error response.
    if(!name || !thumbnail || !track){
        return res.status(500).json({error:"Insufficient details provided."});
    }

    // get the artist reference id from the current user id stored in req.user . 
    const artist = req.user._id;

    // compile all the data for the song.
    const songData = {name,thumbnail,track,artist};

    // Create the song and return a success response.
    const song = await Song.create(songData);
    return res.status(200).json(song);
});

router.get('/get/mysongs', passport.authenticate("jwt",{session:false}) ,async (req,res) =>{

    // Get the current user from the request argument.
    const currentUser = req.user;

    // Get all the songs by that current user.
    const songs = await Song.find({artist: currentUser._id}).populate({ path: 'artist', select: 'firstName lastName username' });

    // Return a response to the request about the current user's published songs.
    return res.status(200).json({songs});

});


// Get song by the artistID
router.get('/get/artist/:artistId', passport.authenticate("jwt",{session:false}) ,async (req,res)=>{

    // 1. Get the artist ID from the params.
    const artistId = req.params.artistId;

    //2. Check if the artist ID exists as a user in the DB.
    const userExists = await User.findOne({_id: artistId});

    //3. If it doesn't exist, return an error response.
    if(!userExists) return res.status(500).json({message:"User does not exist."})

    // 4. Check for the songs by the artist.
    const songs = await Song.find({artist: artistId});

    // 5. If songs by the artist does not exists, return an error response.
    if(!songs || songs.length === 0) return res.status(500).json({message:"No songs found for this artist."})

    //6. Finally, return the songs fetched from the DB.
    return res.status(200).json({songs});
})

// Get song by the songName

router.get('/get/song/:songName', async (req, res) => {

    //1. Get the songName from the params.
    const songName = req.params.songName;

    // 2. Get the song from the database using the songName parameter.
    const song = await Song.find({name: songName}).populate({ path: 'artist', select: 'firstName lastName username' });

    // 3. If the song name does not exists, return an error response.
    if(!song || song.length ===0) return res.status(500).json({error:"Song not found on the given songName"});

    // 4. Return a successsful response from the server.
    return res.status(200).json({song});

});

router.post('/add/likedsongs', passport.authenticate('jwt',{session:false}), async (req,res)=>{

    const {songID} = req.body;

    const userExists = await User.findOne({_id: req.user._id});
    if(!userExists) return res.status(500).json({error:"User does not exist"});

    userExists.lovedSongs.push(songID);
    
    await userExists.save();
    const queryToReturn = userExists;
    delete queryToReturn.password;
    return res.status(200).json(queryToReturn);
})

router.get('/get/lovedsongs',passport.authenticate("jwt",{session:false}), async (req, res) => {

    const userID = req.user._id;

    const userExists = await User.findOne({_id: userID}).populate([ 
        { path: 'lovedSongs', populate: [ { path: 'artist', select: 'firstName lastName' }]}])

    if(!userExists){
        return res.status(500).json({error: 'User not found'});
    }
    
    const lovedSongs = userExists.lovedSongs;

    return res.status(200).json(lovedSongs);
})

export default router;