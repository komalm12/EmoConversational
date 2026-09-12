import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';
import { config } from '../config';

const router = Router();

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, config.jwtSecret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

// Register
router.post('/register', async (req: any, res: any) => {
  try {
    const { name, email, password, preferredPersona } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await UserModel.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      name,
      email: normalizedEmail,
      passwordHash,
      preferredPersona: preferredPersona || 'mom',
      friends: [],
      knowledgeBase: [],
      contact: '',
      shareContact: false,
    });

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        preferredPersona: newUser.preferredPersona,
        friends: newUser.friends,
        knowledgeBase: newUser.knowledgeBase,
        contact: newUser.contact,
        shareContact: newUser.shareContact,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    res.status(500).json({ success: false, message: 'Failed to register user' });
  }
});

// Login
router.post('/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferredPersona: user.preferredPersona,
        friends: user.friends,
        knowledgeBase: user.knowledgeBase,
        contact: user.contact,
        shareContact: user.shareContact,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ success: false, message: 'Failed to login' });
  }
});

// Get Current User (Me)
router.get('/me', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await UserModel.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferredPersona: user.preferredPersona,
        friends: user.friends,
        knowledgeBase: user.knowledgeBase,
        contact: user.contact,
        shareContact: user.shareContact,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth] Fetch user error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user data' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, async (req: any, res: any) => {
  try {
    const { name, preferredPersona, friends, knowledgeBase, contact, shareContact } = req.body;
    
    const user = await UserModel.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (preferredPersona) user.preferredPersona = preferredPersona;
    if (friends !== undefined) user.friends = friends;
    if (knowledgeBase !== undefined) user.knowledgeBase = knowledgeBase;
    if (contact !== undefined) user.contact = contact;
    if (shareContact !== undefined) user.shareContact = shareContact;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferredPersona: user.preferredPersona,
        friends: user.friends,
        knowledgeBase: user.knowledgeBase,
        contact: user.contact,
        shareContact: user.shareContact,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth] Profile update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

export default router;
