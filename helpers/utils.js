import jwt from 'jsonwebtoken';

// Generate the token using the jsonwebtoken.sign which takes a payload fields in it and also a secret key which you have given to the boilerplate code of the passport.jwt.

export const getToken = (user) => {
    const token = jwt.sign({identifier:user._id}, process.env.SECRET_PASSPORT_JWT);
    return token;
};