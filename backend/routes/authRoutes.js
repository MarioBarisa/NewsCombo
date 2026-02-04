import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default function createAuthRoutes(db) {
  const router = express.Router();
  const users = db.collection('users');

  // Register
  router.post('/auth/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      const existing = await users.findOne({ email });
      if (existing) return res.status(400).json({ error: 'Email već postoji' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = { email, password: hashedPassword, name, createdAt: new Date() };
      await users.insertOne(user);

      const token = jwt.sign({ userId: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { email, name } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Login
  router.post('/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await users.findOne({ email });
      if (!user) return res.status(401).json({ error: 'Pogrešni podaci' });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Pogrešni podaci' });

      const token = jwt.sign({ userId: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { email, name: user.name } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // trenutni user
  router.get('/auth/me', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Nije autoriziran' });

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await users.findOne({ email: decoded.email }, { projection: { password: 0 } });
      res.json(user);
    } catch (error) {
      res.status(401).json({ error: 'Nevažeći token' });
    }
  });

  router.post('/auth/profile-picture', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Nije autoriziran' });

      const decoded = jwt.verify(token, JWT_SECRET);
      const { image } = req.body;
      
      if (!image) return res.status(400).json({ error: 'Slika nije poslana' });

      const imgbbKey = process.env.IMGBB_API_KEY;
      if (!imgbbKey) {
        return res.status(500).json({ error: 'IMGBB_API_KEY nije postavljen' });
      }

      const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

      const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `image=${encodeURIComponent(base64Image)}`
      });
      const imgbbData = await imgbbRes.json();

      if (!imgbbData.success) {
        console.error('imgBB error:', imgbbData);
        return res.status(500).json({ error: 'Greška pri uploadu slike', details: imgbbData });
      }

      const imageUrl = imgbbData.data.url;

      await users.updateOne(
        { email: decoded.email },
        { $set: { profilePicture: imageUrl } }
      );

      res.json({ profilePicture: imageUrl });
    } catch (error) {
      console.error('Profile picture error:', error);
      res.status(500).json({ error: error.message });
    }
  });


  return router;
}
