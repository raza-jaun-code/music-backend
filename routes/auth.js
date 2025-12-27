import express from 'express';
import User from '../models/user.model.js';
import {getToken} from '../helpers/utils.js';
import bcrypt from 'bcrypt';

// Destructuring all the routes related method into a variable.
const router = express.Router();

// First Route for registeration of the user

router.post('/register',async(req,res)=>{
    
    // First get all the details of the user
    const {username,password,email,firstName,lastName} = req.body;

    // Does a user with the same email already exists? If yes, then throw an error.
    const userExists = await User.findOne({email});
    const usernameExists = await User.findOne({username});

    if(userExists || usernameExists){
        return res.status(500).json({error:'User with the same email or username already exists'});
    }

    // Valid Request
    // We have to first hash the password
    const hashedPassword = await bcrypt.hash(password,10);
    const userData = {username,password:hashedPassword,email,firstName,lastName};
    const user = await User.create(userData);

    // generate a token for the user

    const token = await getToken(user);
    const userToReturn = {...user.toJSON(),token};

    // check if the user has been created

    if(userToReturn){
        delete userToReturn.password;
        return res.status(200).json(userToReturn);     
    }
    
    // If it's not created , throw an server error

    return res.status(404).json({error:'User not created. Server Error. '});
});

router.post('/login',async(req,res)=>{

    // Get the email and password from the user

    const {email,password} = req.body;

    // Check if the user with the email exists

    const userExists = await User.findOne({email: email});

    // If the user does not exists , throw an error.
    if(!userExists){
        return res.status(300).json({error:"Invalid email or password entered."});
    }

    // Valid Request 
    // Check if the user has entered the correct password.

    const checkPassword = await bcrypt.compare(password,userExists.password);

    // If not a correct password, throw an error.
    if(!checkPassword){
        return res.status(500).json({error:"Invalid username or password entered."});
    }
    
    //Generate a token and send it to the response.

    const token = await getToken(userExists);
    const userToReturn = {...userExists.toJSON(),token};
    delete userToReturn.password;

    // User has entered the correct password and is logged in successfully.
    return res.status(200).json(userToReturn);

});

export default router;