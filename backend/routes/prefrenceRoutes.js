import express from "express";

export default function createPreferenceRoutes(db) {
  const router = express.Router();
  const collection = db.collection("user_source_preferences");

  // GET /preferences - dohvati sve preferencije 
  router.get("/preferences", async (req, res) => {
    try {
      const preferences = await collection.find().toArray();
      res.status(200).json(preferences);
    } catch (error) {
      res.status(500).json({ 
        error: "Greška pri dohvatu preferencija", 
        details: error.message 
      });
    }
  });

  // POST /preferences/like - like izvora (+1 bod)
  router.post("/preferences/like", async (req, res) => {
    try {
      const { source } = req.body;

      if (!source) {
        return res.status(400).json({ error: "Source (domain) je obavezan" });
      }

      // provjera ako postoji prefrence
      const existing = await collection.findOne({ source });

      if (existing) {
        // postoji -> +1bod
        await collection.updateOne(
          { source },
          { $inc: { score: 1 }, $set: { updatedAt: new Date() } }
        );
      } else {
        // ne postoji bod=1
        await collection.insertOne({
          source,
          score: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      res.status(200).json({ 
        poruka: `Source '${source}' dobio +1 poen`, 
        source 
      });
    } catch (error) {
      res.status(500).json({ 
        error: "Greška pri like-anju", 
        details: error.message 
      });
    }
  });

  // POST /preferences/dislike - dislike izvora (-1 bod)
  router.post("/preferences/dislike", async (req, res) => {
    try {
      const { source } = req.body;

      if (!source) {
        return res.status(400).json({ error: "Source (domain) je obavezan" });
      }

      const existing = await collection.findOne({ source });

      if (existing) {
        //  postoji -> bod = -1
        await collection.updateOne(
          { source },
          { $inc: { score: -1 }, $set: { updatedAt: new Date() } }
        );
      } else {
        //  ne postoji -> kreiraj sa bod = -1
        await collection.insertOne({
          source,
          score: -1,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      res.status(200).json({ 
        poruka: `Source '${source}' dobio -1 poen`, 
        source 
      });
    } catch (error) {
      res.status(500).json({ 
        error: "Greška pri dislike-anju", 
        details: error.message 
      });
    }
  });

  // DELETE /preferences/reset - reset svih preferencija
  router.delete("/preferences/reset", async (req, res) => {
    try {
      await collection.deleteMany({});
      res.status(200).json({ poruka: "Sve preferencije resetirane" });
    } catch (error) {
      res.status(500).json({ 
        error: "Greška pri resetiranju", 
        details: error.message 
      });
    }
  });

  return router;
}
