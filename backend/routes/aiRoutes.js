import express from "express";
import cron from 'node-cron';

export default function createAIRoutes(db) {
  const router = express.Router();
  
  // counter koliko je puta danas dobiven summary
  let dailySummaryCount = 0;
  let lastResetDate = new Date().toDateString();
  
  // reset svaki dan u 00:00
  cron.schedule('0 0 * * *', () => {
    dailySummaryCount = 0;
    lastResetDate = new Date().toDateString();
    console.log('🔄 AI summary brojač resetiran');
  });

  // GET /ai-grupa - dohvati AI grupu s feedovima
  router.get("/ai-grupa", async (req, res) => {
    try {
      const collection = db.collection("ai_grupa");
      let aiGrupa = await collection.findOne({ type: "ai_spotlight" });
      
      // ne postoji -> kreiraj novu
      if (!aiGrupa) {
        aiGrupa = {
          type: "ai_spotlight",
          naziv: "AI Spotlight 💡",
          opis: "Personalizirani AI sažetak do 3x dnevno",
          feedIds: [],
          maxFeeds: 5,
          dailyLimit: 3,
          createdAt: new Date()
        };
        await collection.insertOne(aiGrupa);
      }
      
      res.status(200).json(aiGrupa);
    } catch (error) {
      res.status(500).json({ 
        error: "Greška pri dohvatu AI grupe", 
        details: error.message 
      });
    }
  });

  // POST /ai-grupa/feed - add feed u AI grupu (max 5)
  router.post("/ai-grupa/feed", async (req, res) => {
    const { feedId } = req.body;
    
    if (!feedId) {
      return res.status(400).json({ error: "feedId je obavezan" });
    }

    try {
      const collection = db.collection("ai_grupa");
      const feedCollection = db.collection("rss_feedovi");
      
      // feed postoji?
      const feed = await feedCollection.findOne({ id: parseInt(feedId) });
      if (!feed) {
        return res.status(404).json({ error: "Feed ne postoji" });
      }

      const aiGrupa = await collection.findOne({ type: "ai_spotlight" });
      
      if (!aiGrupa) {
        return res.status(404).json({ error: "AI grupa ne postoji" });
      }

      // limit 5 feedova ( rss linkova )
      if (aiGrupa.feedIds.length >= 5) {
        return res.status(400).json({ 
          error: "Dosegnut maksimalni broj feedova (5)" 
        });
      }

      // provjera da se ne doda dva ista feeda
      if (aiGrupa.feedIds.includes(parseInt(feedId))) {
        return res.status(400).json({ 
          error: "Feed je već u AI grupi" 
        });
      }

      // add feed
      await collection.updateOne(
        { type: "ai_spotlight" },
        { 
          $push: { feedIds: parseInt(feedId) },
          $set: { updatedAt: new Date() }
        }
      );

      res.status(200).json({ 
        poruka: "Feed uspješno dodan u AI grupu",
        feedId: feedId,
        totalFeeds: aiGrupa.feedIds.length + 1
      });
    } catch (error) {
      res.status(500).json({ 
        error: "Greška pri dodavanju feeda", 
        details: error.message 
      });
    }
  });

  // DELETE /ai-grupa/feed/:feedId - ukloni feed iz AI grupe
  router.delete("/ai-grupa/feed/:feedId", async (req, res) => {
    const feedId = parseInt(req.params.feedId);

    try {
      const collection = db.collection("ai_grupa");
      
      const result = await collection.updateOne(
        { type: "ai_spotlight" },
        { 
          $pull: { feedIds: feedId },
          $set: { updatedAt: new Date() }
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "Feed nije pronađen u AI grupi" });
      }

      res.status(200).json({ 
        poruka: `Feed ${feedId} uklonjen iz AI grupe` 
      });
    } catch (error) {
      res.status(500).json({ 
        error: "Greška pri uklanjanju feeda", 
        details: error.message 
      });
    }
  });

  // GET /ai-grupa/summary/status - provjeri status sažetka
  router.get("/ai-grupa/summary/status", async (req, res) => {
    try {
      const currentDate = new Date().toDateString();
      
      // reset novi dan
      if (lastResetDate !== currentDate) {
        dailySummaryCount = 0;
        lastResetDate = currentDate;
      }

      const canGenerate = dailySummaryCount < 3;
      const remainingGenerations = 3 - dailySummaryCount;

      res.status(200).json({
        canGenerate,
        dailyLimit: 3,
        generatedToday: dailySummaryCount,
        remainingGenerations,
        lastResetDate
      });
    } catch (error) {
      res.status(500).json({ 
        error: "Greška pri provjeri statusa", 
        details: error.message 
      });
    }
  });

  // POST /ai-grupa/summary/generate - generiraj AI sažetak
  router.post("/ai-grupa/summary/generate", async (req, res) => {
    try {
      const currentDate = new Date().toDateString();
      
      // reset novi dan
      if (lastResetDate !== currentDate) {
        dailySummaryCount = 0;
        lastResetDate = currentDate;
      }

      // provjera daily limita
      if (dailySummaryCount >= 3) {
        return res.status(429).json({ 
          error: "Dosegnut dnevni limit AI sažetaka (3/3)",
          nextAvailableAt: "00:00 sljedećeg dana"
        });
      }

      const aiGrupaCollection = db.collection("ai_grupa");
      const feedCollection = db.collection("rss_feedovi");
      const summaryCollection = db.collection("ai_summaries");

      // get ai grupa
      const aiGrupa = await aiGrupaCollection.findOne({ type: "ai_spotlight" });
      
      if (!aiGrupa || aiGrupa.feedIds.length === 0) {
        return res.status(400).json({ 
          error: "Dodaj barem jedan RSS feed u AI grupu" 
        });
      }

      //get feedove iz ai grupe
      const feeds = await feedCollection
        .find({ id: { $in: aiGrupa.feedIds } })
        .toArray();

      // fetch i parse rss-a
      const Parser = (await import('rss-parser')).default;
      const parser = new Parser();
      
      let allArticles = [];
      
      for (const feed of feeds) {
        try {
          const rssFeed = await parser.parseURL(feed.url);
          const articles = rssFeed.items.slice(0, 5).map(item => ({
            title: item.title,
            description: item.contentSnippet || item.description,
            link: item.link,
            pubDate: item.pubDate,
            source: feed.naziv
          }));
          allArticles = allArticles.concat(articles);
        } catch (error) {
          console.error(`Greška pri parsiranju ${feed.naziv}:`, error.message);
        }
      }

      if (allArticles.length === 0) {
        return res.status(400).json({ 
          error: "Nema dostupnih članaka za sažetak" 
        });
      }

      // generacija ai summary-a ( treba implementirati sa gpt )
      const aiSummary = await generateAISummary(allArticles);

      // spremi sažetak
      const summaryDoc = {
        type: "daily_spotlight",
        summary: aiSummary,
        articlesCount: allArticles.length,
        feedsSources: feeds.map(f => f.naziv),
        generatedAt: new Date(),
        generationNumber: dailySummaryCount + 1
      };

      await summaryCollection.insertOne(summaryDoc);
      
      // inc counter
      dailySummaryCount++;

      res.status(200).json({
        poruka: "AI sažetak uspješno generiran",
        summary: aiSummary,
        articlesProcessed: allArticles.length,
        generatedAt: summaryDoc.generatedAt,
        remainingGenerations: 3 - dailySummaryCount
      });

    } catch (error) {
      res.status(500).json({ 
        error: "Greška pri generiranju AI sažetka", 
        details: error.message 
      });
    }
  });

  // GET /ai-grupa/summaries - get sve ai sažetak
  router.get("/ai-grupa/summaries", async (req, res) => {
    try {
      const collection = db.collection("ai_summaries");
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const summaries = await collection
        .find({ 
          generatedAt: { $gte: sevenDaysAgo }
        })
        .sort({ generatedAt: -1 })
        .toArray();

      res.status(200).json(summaries);
    } catch (error) {
      res.status(500).json({ 
        error: "Greška pri dohvatu sažetaka", 
        details: error.message 
      });
    }
  });

  // DELETE /ai-grupa/summaries/:id -delete sažetak
  router.delete("/ai-grupa/summaries/:id", async (req, res) => {
    try {
      const collection = db.collection("ai_summaries");
      const ObjectId = (await import('mongodb')).ObjectId;
      
      const result = await collection.deleteOne({ 
        _id: new ObjectId(req.params.id) 
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Sažetak nije pronađen" });
      }

      res.status(200).json({ poruka: "Sažetak obrisan" });
    } catch (error) {
      res.status(500).json({ 
        error: "Greška pri brisanju sažetka", 
        details: error.message 
      });
    }
  });

  return router;
}

// Funkcija za generiranje AI sažetka
async function generateAISummary(articles) {
  // OVDJE IDE INTEGRACIJA S OpenAI/Anthropic API
  
  // temp mock implementacija
  const articlesText = articles.map((a, i) => 
    `${i + 1}. ${a.title} (${a.source})\n${a.description}`
  ).join('\n\n');

  // MOCK verzija 
  const mockSummary = {
    headline: "🔥 Najvažnije vijesti danas",
    sections: [
      {
        category: "Tech & Inovacije",
        summary: "Najnoviji razvoji u tehnologiji uključuju...",
        topArticles: articles.slice(0, 3).map(a => ({
          title: a.title,
          source: a.source,
          link: a.link
        }))
      }
    ],
    insights: [
      "Trend rasta AI tehnologija nastavlja se",
      "Povećan fokus na cyber sigurnost"
    ],
    generated: new Date().toISOString()
  };

    // za napraviti: implementacija pravog API poziv
    //generic chatGPT ai ;;;;;;
  // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [{
  //     role: "system",
  //     content: "Ti si novinski analitičar koji kreira koncizne sažetke vijesti..."
  //   }, {
  //     role: "user",
  //     content: `Kreiraj detaljan sažetak sljedećih vijesti:\n\n${articlesText}`
  //   }],
  //   temperature: 0.7,
  //   max_tokens: 1000
  // });

  return mockSummary;
}
