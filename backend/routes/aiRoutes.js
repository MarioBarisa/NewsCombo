import express from "express";
import cron from 'node-cron';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default function createAIRoutes(db) {
  const router = express.Router();
  
  let dailySummaryCount = 0;
  let lastResetDate = new Date().toDateString();
  
  cron.schedule('0 0 * * *', () => {
    dailySummaryCount = 0;
    lastResetDate = new Date().toDateString();
  });

  router.get("/ai-grupa", async (req, res) => {
    try {
      const collection = db.collection("ai_grupa");
      let aiGrupa = await collection.findOne({ type: "ai_spotlight", userId: req.user.userId });
      
      if (!aiGrupa) {
        aiGrupa = {
          type: "ai_spotlight",
          feedIds: [],
          generatedToday: 0,
          lastResetDate: new Date().toDateString(),
          userId: req.user.userId,
          createdAt: new Date()
        };
        await collection.insertOne(aiGrupa);
      }
      
      res.status(200).json(aiGrupa);
    } catch (error) {
      res.status(500).json({ error: "Greška", details: error.message });
    }
  });
  

  router.post("/ai-grupa/feed", async (req, res) => {
    const { feedId } = req.body;
    
    if (!feedId) {
      return res.status(400).json({ error: "feedId je obavezan" });
    }

    try {
      const collection = db.collection("ai_grupa");
      const feedCollection = db.collection("rss_feedovi");
      
      let feed = await feedCollection.findOne({ id: parseInt(feedId), userId: req.user.userId });
      if (!feed) feed = await feedCollection.findOne({ id: feedId.toString(), userId: req.user.userId });
      
      if (!feed) {
        return res.status(404).json({ error: "Feed ne postoji" });
      }

      const aiGrupa = await collection.findOne({ type: "ai_spotlight", userId: req.user.userId });
      if (!aiGrupa) {
        return res.status(404).json({ error: "AI grupa ne postoji" });
      }

      if (aiGrupa.feedIds.length >= 5) {
        return res.status(400).json({ error: "Maksimum 5 feedova" });
      }

      const feedIdValue = feed.id;
      const isDuplicate = aiGrupa.feedIds.some(id => 
        id == feedIdValue || id.toString() === feedIdValue.toString()
      );
      
      if (isDuplicate) {
        return res.status(400).json({ error: "Feed već postoji" });
      }

      await collection.updateOne(
        { type: "ai_spotlight", userId: req.user.userId },
        { $push: { feedIds: feedIdValue }, $set: { updatedAt: new Date() } }
      );

      res.status(200).json({ 
        poruka: "Feed dodan", 
        feedId: feedIdValue, 
        totalFeeds: aiGrupa.feedIds.length + 1 
      });
    } catch (error) {
      res.status(500).json({ error: "Greška", details: error.message });
    }
  });

  router.delete("/ai-grupa/feed/:feedId", async (req, res) => {
    const feedId = req.params.feedId;

    try {
      const collection = db.collection("ai_grupa");
      const result = await collection.updateOne(
        { type: "ai_spotlight", userId: req.user.userId },
        { 
          $pull: { feedIds: { $in: [feedId, feedId.toString(), parseInt(feedId) || feedId] } },
          $set: { updatedAt: new Date() }
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "Feed nije pronađen" });
      }

      res.status(200).json({ poruka: `Feed ${feedId} uklonjen` });
    } catch (error) {
      res.status(500).json({ error: "Greška", details: error.message });
    }
  });

  router.get("/ai-grupa/summary/status", async (req, res) => {
    try {
      const collection = db.collection("ai_grupa");
      const currentDate = new Date().toDateString();
      
      let aiGrupa = await collection.findOne({ type: "ai_spotlight", userId: req.user.userId });
      
      if (!aiGrupa) {
        return res.status(404).json({ error: "AI grupa ne postoji" });
      }

      if (aiGrupa.lastResetDate !== currentDate) {
        await collection.updateOne(
          { type: "ai_spotlight", userId: req.user.userId },
          { 
            $set: { 
              generatedToday: 0,
              lastResetDate: currentDate
            }
          }
        );
        aiGrupa.generatedToday = 0;
        aiGrupa.lastResetDate = currentDate;
        dailySummaryCount = 0;
        lastResetDate = currentDate;
      } else {
        dailySummaryCount = aiGrupa.generatedToday || 0;
      }

      res.status(200).json({
        canGenerate: aiGrupa.generatedToday < 3,
        dailyLimit: 3,
        generatedToday: aiGrupa.generatedToday || 0,
        remainingGenerations: 3 - (aiGrupa.generatedToday || 0),
        lastResetDate: aiGrupa.lastResetDate
      });
    } catch (error) {
      res.status(500).json({ error: "Greška", details: error.message });
    }
  });

  router.post("/ai-grupa/summary/generate", async (req, res) => {
    try {
      const aiGrupaCollection = db.collection("ai_grupa");
      const feedCollection = db.collection("rss_feedovi");
      const summaryCollection = db.collection("ai_summaries");
      const currentDate = new Date().toDateString();
  
      let aiGrupa = await aiGrupaCollection.findOne({ type: "ai_spotlight", userId: req.user.userId });
      
      if (!aiGrupa) {
        return res.status(404).json({ error: "AI grupa ne postoji" });
      }
  
      if (aiGrupa.lastResetDate !== currentDate) {
        await aiGrupaCollection.updateOne(
          { type: "ai_spotlight", userId: req.user.userId },
          { 
            $set: { 
              generatedToday: 0,
              lastResetDate: currentDate
            }
          }
        );
        aiGrupa.generatedToday = 0;
        dailySummaryCount = 0;
        lastResetDate = currentDate;
      } else {
        dailySummaryCount = aiGrupa.generatedToday || 0;
      }
  
      if ((aiGrupa.generatedToday || 0) >= 3) {
        return res.status(429).json({ error: "Dosegnut dnevni limit (3/3)" });
      }
  
      if (!aiGrupa.feedIds || aiGrupa.feedIds.length === 0) {
        return res.status(400).json({ error: "Dodaj barem jedan RSS feed" });
      }
  
      const feeds = [];
      for (const feedId of aiGrupa.feedIds) {
        let feed = await feedCollection.findOne({ id: feedId, userId: req.user.userId });
        if (!feed) feed = await feedCollection.findOne({ id: feedId.toString(), userId: req.user.userId });
        if (!feed && !isNaN(feedId)) feed = await feedCollection.findOne({ id: parseInt(feedId), userId: req.user.userId });
        if (feed) feeds.push(feed);
      }
  
      if (feeds.length === 0) {
        return res.status(400).json({ error: "Feedovi nisu pronađeni" });
      }
  
      const Parser = (await import('rss-parser')).default;
      const parser = new Parser();
      let allArticles = [];
      
      for (const feed of feeds) {
        try {
          const rssFeed = await parser.parseURL(feed.url);
          const articles = rssFeed.items.slice(0, 5).map(item => ({
            title: item.title || "Bez naslova",
            description: (item.contentSnippet || item.description || "").substring(0, 300),
            link: item.link,
            pubDate: item.pubDate,
            source: feed.naziv
          }));
          allArticles = allArticles.concat(articles);
        } catch (error) {
          continue;
        }
      }
  
      if (allArticles.length === 0) {
        return res.status(400).json({ error: "Nema dostupnih članaka" });
      }
  
      const aiSummary = await generateAISummary(allArticles);
  
      const summaryDoc = {
        _id: new Date().getTime().toString(),
        type: "daily_spotlight",
        summary: aiSummary,
        articlesCount: allArticles.length,
        feedsSources: feeds.map(f => f.naziv),
        userId: req.user.userId,
        generatedAt: new Date(),
        generationNumber: (aiGrupa.generatedToday || 0) + 1
      };
  
      await summaryCollection.insertOne(summaryDoc);
  
      await aiGrupaCollection.updateOne(
        { type: "ai_spotlight", userId: req.user.userId },
        { 
          $inc: { generatedToday: 1 },
          $set: { updatedAt: new Date() }
        }
      );
  
      dailySummaryCount++;
  
      res.status(200).json({
        poruka: "AI sažetak generiran",
        summary: aiSummary,
        articlesProcessed: allArticles.length,
        generatedAt: summaryDoc.generatedAt,
        remainingGenerations: 3 - dailySummaryCount
      });
  
    } catch (error) {
      res.status(500).json({ 
        error: "Greška pri generiranju", 
        details: error.message
      });
    }
  });
  

  router.get("/ai-grupa/summaries", async (req, res) => {
    try {
      const collection = db.collection("ai_summaries");
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const summaries = await collection
        .find({ generatedAt: { $gte: sevenDaysAgo }, userId: req.user.userId })
        .sort({ generatedAt: -1 })
        .toArray();

      res.status(200).json(summaries);
    } catch (error) {
      res.status(500).json({ error: "Greška", details: error.message });
    }
  });

  router.delete("/ai-grupa/summaries/:id", async (req, res) => {
    try {
      const summaryCollection = db.collection("ai_summaries");
      
      const result = await summaryCollection.deleteOne({ 
        _id: req.params.id,
        userId: req.user.userId
      });
  
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Sažetak nije pronađen" });
      }
  
      res.status(200).json({ poruka: "Sažetak obrisan" });
    } catch (error) {
      res.status(500).json({ error: "Greška", details: error.message });
    }
  });
  
  

  async function generateAISummary(articles) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY nije postavljen");
    }

    const articlesText = articles.map((a, i) => 
      `[${i + 1}] ${a.title} (${a.source})\n${a.description}\nLink: ${a.link}\n`
    ).join('\n');

    const prompt = `Analiziraj sljedeće vijesti i kreiraj strukturirani sažetak na hrvatskom jeziku. Neka budu zanimljive i interesantne teme ali isto uključi najbitnije informacije.

VIJESTI:
${articlesText}

Napravi JSON odgovor s ovakvom strukturom:
{
  "headline": "Glavni naslov za danas (max 8 riječi)",
  "sections": [
    {
      "category": "Naziv kategorije",
      "summary": "5-10 rečenica sažetka",
      "topArticles": [
        {"title": "Naslov članka", "source": "Izvor", "link": "link"}
      ]
    }
  ],
  "insights": ["Ključni insight 1", "Ključni insight 2"]
}

Grupiraj vijesti po kategorijama (max 3). Budi koncizan. Odgovori SAMO JSON-om, bez dodatnog teksta.`;

    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash"
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Gemini nije vratio valjan JSON");
      }

      const summary = JSON.parse(jsonMatch[0]);
      
      summary.sections = summary.sections.map(section => ({
        ...section,
        topArticles: section.topArticles.slice(0, 3).map(article => {
          const original = articles.find(a => 
            a.title.toLowerCase().includes(article.title.toLowerCase().substring(0, 15))
          );
          return {
            title: article.title,
            source: article.source,
            link: original?.link || article.link || "#"
          };
        })
      }));

      return summary;
    } catch (error) {
      throw new Error(`Gemini API greška: ${error.message}`);
    }
  }

  return router;
}
