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

  // ažuriranje profila (ime, email, lozinka)
  router.put('/auth/profile', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Nije autoriziran' });

      const decoded = jwt.verify(token, JWT_SECRET);
      const { name, email, currentPassword, newPassword } = req.body;
      
      const user = await users.findOne({ email: decoded.email });
      if (!user) return res.status(404).json({ error: 'Korisnik nije pronađen' });

      const updates = {};

      if (name && name !== user.name) {
        updates.name = name;
      }

      if (email && email !== user.email) {
        const existing = await users.findOne({ email });
        if (existing) return res.status(400).json({ error: 'Email već postoji' });
        updates.email = email;
      }

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Trenutna lozinka je obavezna' });
        }
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
          return res.status(400).json({ error: 'Pogrešna trenutna lozinka' });
        }
        updates.password = await bcrypt.hash(newPassword, 10);
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Nema promjena za spremiti' });
      }

      await users.updateOne({ email: decoded.email }, { $set: updates });

      // Ako se email change-ao, vrati novi token
      const newEmail = updates.email || decoded.email;
      const newToken = updates.email 
        ? jwt.sign({ userId: user._id, email: newEmail }, JWT_SECRET, { expiresIn: '7d' })
        : null;

      const updatedUser = await users.findOne({ email: newEmail }, { projection: { password: 0 } });
      
      res.json({ 
        user: updatedUser, 
        token: newToken,
        message: 'Profil uspješno ažuriran' 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
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

    // DELETE /auth/delete-account - trajno brisanje računa
    router.delete('/auth/delete-account', async (req, res) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'Nije autoriziran' });
  
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId; // ID iz tokena
        const userEmail = decoded.email;
  
        // brisannje svih korisnikovih podataka iz ostalih kolekcija
        await db.collection('rss_feedovi').deleteMany({ userId: userId }); //same vijesti
        await db.collection('grupe').deleteMany({ userId: userId });    //custom grupe
        await db.collection('sacuvani_clanci').deleteMany({ userId: userId }); //bookmarks 
        await db.collection('ai_summaries').deleteMany({ userId: userId });  //brisanje generiranih ai sažetaka korisnika
        await db.collection('ai_grupa').deleteMany({ userId: userId }); //brisanje ai grupe korisnika

        // brisanje samog korisnika
        const result = await users.deleteOne({ email: userEmail });
  
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Korisnik nije pronađen' });
        }
  
        res.json({ message: 'Račun i svi podaci su trajno obrisani.' });
      } catch (error) {
        console.error('Greška pri brisanju računa:', error);
        res.status(500).json({ error: 'Greška pri brisanju računa' });
      }
    });
  

  return router;
}
