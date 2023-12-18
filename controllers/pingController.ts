import { RequestHandler } from 'express';

export const pingServer:RequestHandler = async (req,res) => {
    res.status(200).json({ message:'Server Found!' });
};