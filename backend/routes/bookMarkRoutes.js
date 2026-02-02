import express from "express";

export default function createBookmarkRoutes(db) {
  const router = express.Router();
  const collection = db.collection("sacuvani_clanci"); 

  // GET /bookmarks 
  router.get("/bookmarks", async (req, res) => {
    try {
      const bookmarks = await collection.find({ userId: req.user.userId }).sort({ createdAt: -1 }).toArray();
      res.status(200).json(bookmarks);
    } catch (error) {
      res.status(500).json({ error: "Greška pri dohvatu bookmarka", details: error.message });
    }
  });

   // POST /bookmarks
  router.post("/bookmarks", async (req, res) => {
    try {
      const { title, body, originalUrl, source, publishedAt } = req.body;

      if (!title || !originalUrl) {
        return res.status(400).json({ error: "Nedostaju obavezni podaci (title, originalUrl)" });
      }

      const existing = await collection.findOne({ originalUrl, userId: req.user.userId });
      if (existing) {
        return res.status(200).json({ poruka: "Članak je već spremljen." });
      }

      const cleanBody = body ? body.replace(/<img[^>]*>/g, "") : "";

      const newBookmark = {
        title,
        body: cleanBody,
        originalUrl,
        source,
        publishedAt,
        userId: req.user.userId,
        createdAt: new Date()
      };

      await collection.insertOne(newBookmark);
      res.status(201).json({ poruka: "Članak uspješno spremljen!" });

    } catch (error) {
      res.status(500).json({ error: "Greška pri spremanju", details: error.message });
    }
  });

  // DELETE /bookmarks 
  router.delete("/bookmarks", async (req, res) => {
    try {
      const { originalUrl } = req.body;
      const result = await collection.deleteOne({ originalUrl, userId: req.user.userId });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Članak nije pronađen" });
      }
      res.status(200).json({ poruka: "Bookmark obrisan" });
    } catch (error) {
      res.status(500).json({ error: "Greška pri brisanju", details: error.message });
    }
  });

  return router;
}
