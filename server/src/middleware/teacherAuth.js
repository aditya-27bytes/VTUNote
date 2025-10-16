import jwt from 'jsonwebtoken';
import Teacher from '../models/Teacher.js';

export const protectTeacher = async (req, res, next) => {
  let token;

  console.log('protectTeacher middleware called');
  console.log('Authorization header:', req.headers.authorization);

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extracted:', token ? `${token.substring(0, 20)}...` : 'null');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully, teacher ID:', decoded.id);

      // Get teacher from the token
      req.teacher = await Teacher.findById(decoded.id).select('-password');
      
      if (!req.teacher) {
        console.log('Teacher not found in database');
        return res.status(401).json({ message: 'Not authorized, teacher not found' });
      }

      console.log('Teacher found:', req.teacher.name, req.teacher.email);
      console.log('Teacher isActive:', req.teacher.isActive);
      console.log('Teacher isVerified:', req.teacher.isVerified);

      next();
    } catch (error) {
      console.error('Teacher auth error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    console.log('No authorization header found');
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const isVerifiedTeacher = async (req, res, next) => {
  if (req.teacher && req.teacher.isVerified) {
    next();
  } else {
    res.status(403).json({ message: 'Teacher account not verified. Please contact admin.' });
  }
};

export const isActiveTeacher = async (req, res, next) => {
  console.log('isActiveTeacher middleware called');
  console.log('Teacher exists:', !!req.teacher);
  console.log('Teacher isActive:', req.teacher?.isActive);
  
  if (req.teacher && req.teacher.isActive) {
    console.log('Teacher is active, proceeding');
    next();
  } else {
    console.log('Teacher is not active, blocking request');
    res.status(403).json({ message: 'Teacher account is deactivated. Please contact admin.' });
  }
};
