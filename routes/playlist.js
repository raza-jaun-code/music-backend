import express from 'express';
import passport from 'passport';
import Playlist from '../models/playlist.model.js';
import Song from '../models/song.model.js';

const router = express.Router();

router.post('/create', passport.authenticate("jwt",{session:false}),async (req,res)=>{
    // we get the user id from the req.user._id to fill in the artist key.
    const user = req.user._id;

    // get all the details from the body.
    const {name,thumbnail,songs}= req.body;

    // if the body does not contain the things needed , throw an error.
    if(!name || !thumbnail ) return res.status(500).json({error:"Insufficient Details Provided For Playlist Creation."});

    // compile the playlist Data.
    const playlistData = {name,thumbnail,songs,owner:user,collaborators:[]};

    // create the playlist.
    const playlist = await Playlist.create(playlistData);

    // return a successful response on creation of the playlist.
    return res.status(200).json(playlist);
})

router.get('/get/:playlist', passport.authenticate("jwt",{session:false}) ,async (req,res)=>{
    
    // get the playlist Id from the params.
    const playlistId = req.params.playlist;

    // check if the playlist exists or not.
    const playlistExists = await Playlist.findOne({_id:playlistId});

    // if the playlist does not exists, throw an error.
    if(!playlistExists) return res.status(500).json({message:"Playlist Not Found."});

    // return a successful response , on the retrieval of the playlist.
    return res.status(200).json(playlistExists);
})

router.get('/getmyplaylists', passport.authenticate("jwt",{session:false}) ,async (req,res)=>{

    // 1. Get the User ID from the req.user.
    const userID = req.user._id;

    // 2. Check for the playlist by the owner.
    const playlists = await Playlist.find({owner: userID}).populate([ 
        { path: 'songs', populate: [ { path: 'artist', select: 'firstName lastName' } ] }
      ]);

    //3. Finally, return the playlists fetched from the DB.
    return res.status(200).json({playlists});
})

router.post('/add/song',passport.authenticate("jwt",{session:false}), async (req,res)=>{

    // 1 . Get the user and the required parameters from the request body.
    const user = req.user;
    const {playlistId, songId} = req.body;

    // 2. Check if the playlist exists in the DB , if not , throw an error.
    const playlistExists = await Playlist.findOne({_id:playlistId});
    if(!playlistExists) return res.status(500).json({error:"Playlist Not Found."});

    // 3. Check if the song exists in the DB, if not, throw an error.
    const songExists = await Song.findOne({_id:songId});
    if(!songExists) return res.status(500).json({error:"Song Not Found."});

    // 4. Check if the user id we have after the authentication in the req.user._id is actually the owner or a collaborator of the playlist.
    // If not, throw an error.
    if(!playlistExists.owner.equals(user._id) && !playlistExists.collaborators.includes(user._id)) return res.status(500).json({error:"The user is not allowed to add a song to this playlist."});

    // 5. All validations have been made and now we can go ahead and save the song to the playlist.

    playlistExists.songs.push(songId);
    await playlistExists.save();
    return res.status(200).json({playlistExists});
});

router.get('/myplaylists', passport.authenticate("jwt",{session:false}), async (req,res)=>{

    // get the user from the req.user
    const user = req.user;

    // get the playlist by matching the owner as the req.user._id.
    const playlists = await Playlist.find({owner: user._id});

    // If playlist does not exist, throw an error
    if(!playlists) return res.status(500).json({message: "No Playlists found."});

    // Playlist is returned as it exists, successful response.
    return res.status(200).json({playlists});
});


export default router;