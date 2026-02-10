import express from "express";

function extractImageUrl(item) {
  // 1. Standardni enclosure 
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }

  // 2. (media:content, media:thumbnail)
  if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) {
    return item['media:content']['$'].url;
  }
  
  if (item['media:thumbnail'] && item['media:thumbnail']['$'] && item['media:thumbnail']['$'].url) {
    return item['media:thumbnail']['$'].url;
  }

  // 3.  (array)
  if (item['media:content'] && Array.isArray(item['media:content']) && item['media:content'][0]) {
    const media = item['media:content'][0];
    if (media['$'] && media['$'].url) {
      return media['$'].url;
    }
  }

  // 4. 
  const htmlContent = item['content:encoded'] || item.content || item.description || '';
  if (htmlContent) {
    const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
  }

  return null;
}

export default function createNewsRoutes(db) {
  const router = express.Router();

  // INICIJALNI PODACI
  const inicijalniRSSFeedovi = [
    { id: 1, naziv: 'Index.hr', url: 'https://www.index.hr/rss', domain: 'index.hr', kategorija: 'hrvatska', isCustom: true },
    { id: 2, naziv: 'Večernji list', url: 'https://www.vecernji.hr/rss', domain: 'vecernji.hr', kategorija: 'hrvatska', isCustom: true },
    { id: 3, naziv: '24sata', url: 'https://www.24sata.hr/feeds/najnovije.xml', domain: '24sata.hr', kategorija: 'hrvatska', isCustom: true },
    { id: 4, naziv: 'Bug.hr', url: 'https://www.bug.hr/rss', domain: 'bug.hr', kategorija: 'tech', isCustom: true },
    { id: 5, naziv: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', domain: 'bbc.co.uk', kategorija: 'world', isCustom: true },
    { id: 6, naziv: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', domain: 'aljazeera.com', kategorija: 'world', isCustom: true },
    { id: 7, naziv: 'TechCrunch', url: 'https://techcrunch.com/feed/', domain: 'techcrunch.com', kategorija: 'tech', isCustom: true },
    { id: 8, naziv: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', domain: 'arstechnica.com', kategorija: 'tech', isCustom: true },
    { id: 9, naziv: 'Hacker News', url: 'https://hnrss.org/frontpage', domain: 'news.ycombinator.com', kategorija: 'tech', isCustom: true },
    { id: 10, naziv: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', domain: 'technologyreview.com', kategorija: 'tech', isCustom: true },
    { id: 11, naziv: 'Aeon', url: 'https://aeon.co/feed.rss', domain: 'aeon.co', kategorija: 'science', isCustom: true },
    { id: 12, naziv: 'Financial Times', url: 'https://www.ft.com/?format=rss', domain: 'ft.com', kategorija: 'business', isCustom: true },
  ];


  const inicijalneGrupe = [
    { id: 1, naziv: "Tech", opis: "Tehnološke vijesti", feedIds: [7, 8, 9, 4, 10] },
    { id: 2, naziv: "HR vijesti", opis: "Vijesti iz Hrvatske", feedIds: [1, 2, 3,] },
    { id: 3, naziv: "Globalne vijesti", opis: "Vijesti sa svijeta", feedIds: [5, 6, 11, 12] }
  ];

  const inicijalniClanciMock = [
    { id: 1, naziv: "Nova AI tehnologija", opis: "Revolucionarna AI tehnologija...", feedId: 3, datuma: "2025-01-17", procitano: false },
    { id: 2, naziv: "iPhone 17 najava", opis: "Apple najavljuje novi iPhone...", feedId: 4, datuma: "2025-01-16", procitano: false },
    { id: 3, naziv: "Croatia dobila Euro", opis: "Hrvatskaа je pobijedila u finalu...", feedId: 2, datuma: "2025-01-15", procitano: true },
  ];

  //Početne rute

  // POST /pocetnoStanjeFeed - resetira sve feedove i stavlja hardcoded podatke
  router.post("/pocetnoStanjeFeed", async (req, res) => {
    let feedCollection = db.collection("rss_feedovi");
    try {
      await feedCollection.deleteMany({ userId: req.user.userId });
      const feedsWithUserId = inicijalniRSSFeedovi.map(f => ({ ...f, userId: req.user.userId }));
      let result = await feedCollection.insertMany(feedsWithUserId);
      res.status(200).json({ 
        poruka: "USPJEH -> Feedovi postavljenji",
        insertedCount: result.insertedCount 
      });
    } catch (error) {
      res.status(400).json({ error: "Greška pri inicijalizaciji feedova", details: error.message });
    }
  });

  // POST /pocetnoGrupe - resetira i dodaje inicijalne grupe
  router.post("/pocetnoGrupe", async (req, res) => {
    let grupeCollection = db.collection("grupe");
    try {
      await grupeCollection.deleteMany({ userId: req.user.userId });
      const grupeWithUserId = inicijalneGrupe.map(g => ({ ...g, userId: req.user.userId }));
      let result = await grupeCollection.insertMany(grupeWithUserId);
      res.status(200).json({ 
        poruka: "USPJEH -> Grupe inicijalizirane",
        insertedCount: result.insertedCount 
      });
    } catch (error) {
      res.status(400).json({ error: "Greška pri inicijalizaciji grupa", details: error.message });
    }
  });

  // POST /pocetnoClanci - resetira i dodaje inicijalne članke
  router.post("/pocetnoClanci", async (req, res) => {
    let clanci = db.collection("clanci");
    try {
      await clanci.deleteMany({ userId: req.user.userId });
      const clanciWithUserId = inicijalniClanciMock.map(c => ({ ...c, userId: req.user.userId }));
      let result = await clanci.insertMany(clanciWithUserId);
      res.status(200).json({ 
        poruka: "USPJEH -> Članci inicijalizirani",
        insertedCount: result.insertedCount 
      });
    } catch (error) {
      res.status(400).json({ error: "Greška pri inicijalizaciji članaka", details: error.message });
    }
  });

  // RSS FEEDOVI ->CRUD operacije

  // GET / - test ruta
  router.get("/test", (req, res) => {
    res.status(200).json({ poruka: "NewsCombo API radi!" });
  });

  // GET /feedovi - svi feedovi
  router.get("/feedovi", async (req, res) => {
    try {
      const collection = db.collection("rss_feedovi");
      const feedovi = await collection.find({ userId: req.user.userId }).toArray();
      res.status(200).json(feedovi);
    } catch (error) {
      res.status(400).json({ error: "Greška pri dohvatu feedova", details: error.message });
    }
  });

  // GET /feedovi/:id - jedan feed po ID-u
  router.get("/feedovi/:id", async (req, res) => {
    try {
      const feedId = parseInt(req.params.id);
      const collection = db.collection("rss_feedovi");
      const feed = await collection.findOne({ id: feedId, userId: req.user.userId });
      
      if (!feed) {
        return res.status(404).json({ error: "Feed nije pronađen" });
      }
      res.status(200).json(feed);
    } catch (error) {
      res.status(400).json({ error: "Greška pri dohvatu feeda", details: error.message });
    }
  });

  // POST /feedovi - dodaj novi feed
  router.post("/feedovi", async (req, res) => {
    const { naziv, url, kategorija } = req.body;

    if (!naziv || !url || !kategorija) {
      return res.status(400).json({ 
        error: "Nedostaju obavezna polja: naziv, url, kategorija" 
      });
    }

    try {
      const collection = db.collection("rss_feedovi");
      const sviFeedi = await collection.find({ userId: req.user.userId }).toArray();
      const noviId = Math.max(...sviFeedi.map(f => f.id), 0) + 1;

      const result = await collection.insertOne({
        id: noviId,
        naziv: naziv,
        url: url,
        kategorija: kategorija,
        isCustom: "true",
        userId: req.user.userId
      });

      res.status(201).json({ 
        poruka: "USPJEH -> Feed dodan.",
        insertedId: result.insertedId,
        noviId: noviId
      });
    } catch (error) {
      res.status(400).json({ error: "Greška pri dodavanju feeda", details: error.message });
    }
  });

  // DELETE /feedovi/:id - obriši feed
  router.delete("/feedovi/:id", async (req, res) => {
    try {
      const feedId = parseInt(req.params.id);
      const collection = db.collection("rss_feedovi");
      const result = await collection.deleteOne({ id: feedId, userId: req.user.userId });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Feed nije pronađen" });
      }
      res.status(200).json({ poruka: `USPJEH -> Feed sa ID ${feedId} je obrisan` });
    } catch (error) {
      res.status(400).json({ error: "Greška pri brisanju feeda", details: error.message });
    }
  });

  // PUT /feedovi/:id - ažurira kompletan feed
  router.put("/feedovi/:id", async (req, res) => {
    try {
      const feedId = parseInt(req.params.id);
      const { naziv, url, kategorija } = req.body;

      if (!naziv || !url || !kategorija) {
        return res.status(400).json({ error: "Nedostaju obavezna polja" });
      }

      const collection = db.collection("rss_feedovi");
      const result = await collection.updateOne(
        { id: feedId, userId: req.user.userId },
        { $set: { naziv, url, kategorija } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Feed nije pronađen" });
      }

      res.status(200).json({ 
        poruka: `USPJEH -> Feed sa ID ${feedId} je ažuriran` 
      });
    } catch (error) {
      res.status(400).json({ error: "Greška pri ažuriranju feeda", details: error.message });
    }
  });

  // PATCH /feedovi/:id/kategorija - changeaj samo kategoriju
  router.patch("/feedovi/:id/kategorija", async (req, res) => {
    try {
      const feedId = parseInt(req.params.id);
      const { kategorija } = req.body;

      if (!kategorija) {
        return res.status(400).json({ error: "Nedostaje kategorija" });
      }

      const collection = db.collection("rss_feedovi");
      const result = await collection.updateOne(
        { id: feedId, userId: req.user.userId },
        { $set: { kategorija } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Feed nije pronađen" });
      }

      res.status(200).json({ 
        poruka: `USPJEH -> Kategorija feeda sa ID ${feedId} je promjenjena na "${kategorija}"` 
      });
    } catch (error) {
      res.status(400).json({ error: "Greška pri ažuriranju kategorije", details: error.message });
    }
  });

  // GET /feedovi/kategorija/:kategorija - filtriraj feedove po kategoriji
  router.get("/feedovi/kategorija/:kategorija", async (req, res) => {
    try {
      const kategorija = req.params.kategorija;
      const collection = db.collection("rss_feedovi");
      const feedovi = await collection.find({ kategorija: kategorija, userId: req.user.userId }).toArray();
      
      res.status(200).json(feedovi);
    } catch (error) {
      res.status(400).json({ error: "Greška pri filtriranju feedova", details: error.message });
    }
  });

  // GRUPE - CRUD operacije

  // GET /grupe - sve grupe
  router.get("/grupe", async (req, res) => {
    try {
      const collection = db.collection("grupe");
      const grupe = await collection.find({ userId: req.user.userId }).toArray();
      res.status(200).json(grupe);
    } catch (error) {
      res.status(400).json({ error: "Greška pri dohvatu grupa", details: error.message });
    }
  });

  // GET /grupe/:id - jedna grupa po ID-u
  router.get("/grupe/:id", async (req, res) => {
    try {
      const grupaId = parseInt(req.params.id);
      const collection = db.collection("grupe");
      const grupa = await collection.findOne({ id: grupaId, userId: req.user.userId });
      
      if (!grupa) {
        return res.status(404).json({ error: "Grupa nije pronađena" });
      }
      res.status(200).json(grupa);
    } catch (error) {
      res.status(400).json({ error: "Greška pri dohvatu grupe", details: error.message });
    }
  });

  // POST /grupe - dodaj novu grupu
  router.post("/grupe", async (req, res) => {
    const { naziv, opis, feedIds } = req.body;

    if (!naziv || !opis || !feedIds || !Array.isArray(feedIds)) {
      return res.status(400).json({ 
        error: "Nedostaju obavezna polja: naziv, opis, feedIds (niz)" 
      });
    }

    try {
      const collection = db.collection("grupe");
      const sveGrupe = await collection.find({ userId: req.user.userId }).toArray();
      const noviId = Math.max(...sveGrupe.map(g => g.id), 0) + 1;

      const result = await collection.insertOne({
        id: noviId,
        naziv: naziv,
        opis: opis,
        feedIds: feedIds,
        userId: req.user.userId
      });

      res.status(201).json({ 
        poruka: "USPJEH -> Grupa dodana",
        noviId: noviId
      });
    } catch (error) {
      res.status(400).json({ error: "Greška pri dodavanju grupe", details: error.message });
    }
  });

  // DELETE /grupe/:id - obriši grupu
  router.delete("/grupe/:id", async (req, res) => {
    try {
      const grupaId = parseInt(req.params.id);
      const collection = db.collection("grupe");
      const result = await collection.deleteOne({ id: grupaId, userId: req.user.userId });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Grupa nije pronađena" });
      }
      res.status(200).json({ poruka: `USPJEH -> Grupa sa ID ${grupaId} je obrisana` });
    } catch (error) {
      res.status(400).json({ error: "Greška pri brisanju grupe", details: error.message });
    }
  });

  // PUT /grupe/:id - ažurira kompletnu grupu
  router.put("/grupe/:id", async (req, res) => {
    try {
      const grupaId = parseInt(req.params.id);
      const { naziv, opis, feedIds } = req.body;

      if (!naziv || !opis || !feedIds || !Array.isArray(feedIds)) {
        return res.status(400).json({ error: "Nedostaju obavezna polja" });
      }

      const collection = db.collection("grupe");
      const result = await collection.updateOne(
        { id: grupaId, userId: req.user.userId },
        { $set: { naziv, opis, feedIds } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Grupa nije pronađena" });
      }

      res.status(200).json({ 
        poruka: `USPJEH -> Grupa sa ID ${grupaId} je ažurirana` 
      });
    } catch (error) {
      res.status(400).json({ error: "Greška pri ažuriranju grupe", details: error.message });
    }
  });

  // PATCH /grupe/:id/feedIds - dodaj feedIds u grupu
  router.patch("/grupe/:id/feedIds", async (req, res) => {
    try {
      const grupaId = parseInt(req.params.id);
      const { feedIds } = req.body;

      if (!feedIds || !Array.isArray(feedIds)) {
        return res.status(400).json({ error: "feedIds mora biti niz" });
      }

      const collection = db.collection("grupe");
      const result = await collection.updateOne(
        { id: grupaId, userId: req.user.userId },
        { $set: { feedIds } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Grupa nije pronađena" });
      }

      res.status(200).json({ 
        poruka: `✅ FeedIds grupe sa ID ${grupaId} su ažurirani` 
      });
    } catch (error) {
      res.status(400).json({ error: "Greška pri ažuriranju feedIds", details: error.message });
    }
  });

  // ČLANCI - CRUD operacije - TRENUTNO SE NE KORISTI!!!!!!

  // GET /clanci - svi članci
  router.get("/clanci", async (req, res) => {
    try {
      const collection = db.collection("clanci");
      const clanci = await collection.find({ userId: req.user.userId }).toArray();
      res.status(200).json(clanci);
    } catch (error) {
      res.status(400).json({ error: "Greška pri dohvatu članaka", details: error.message });
    }
  });

  // GET /clanci/:id - jedan članak po ID-u
  router.get("/clanci/:id", async (req, res) => {
    try {
      const clanakId = parseInt(req.params.id);
      const collection = db.collection("clanci");
      const clanak = await collection.findOne({ id: clanakId, userId: req.user.userId });
      
      if (!clanak) {
        return res.status(404).json({ error: "Članak nije pronađen" });
      }
      res.status(200).json(clanak);
    } catch (error) {
      res.status(400).json({ error: "Greška pri dohvatu članka", details: error.message });
    }
  });

  // POST /clanci - dodaj novi članak
  router.post("/clanci", async (req, res) => {
    const { naziv, opis, feedId, datuma, procitano } = req.body;

    if (!naziv || !opis || !feedId || !datuma) {
      return res.status(400).json({ 
        error: "Nedostaju obavezna polja: naziv, opis, feedId, datuma" 
      });
    }

    try {
      const collection = db.collection("clanci");
      const sviClanci = await collection.find({ userId: req.user.userId }).toArray();
      const noviId = Math.max(...sviClanci.map(c => c.id), 0) + 1;

      const result = await collection.insertOne({
        id: noviId,
        naziv: naziv,
        opis: opis,
        feedId: feedId,
        datuma: datuma,
        procitano: procitano || false,
        userId: req.user.userId
      });

      res.status(201).json({ 
        poruka: "✅ Članak dodan",
        noviId: noviId
      });
    } catch (error) {
      res.status(400).json({ error: "Greška pri dodavanju članka", details: error.message });
    }
  });

  // DELETE /clanci/:id - obriši članak
  router.delete("/clanci/:id", async (req, res) => {
    try {
      const clanakId = parseInt(req.params.id);
      const collection = db.collection("clanci");
      const result = await collection.deleteOne({ id: clanakId, userId: req.user.userId });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Članak nije pronađen" });
      }
      res.status(200).json({ poruka: `✅ Članak sa ID ${clanakId} je obrisan` });
    } catch (error) {
      res.status(400).json({ error: "Greška pri brisanju članka", details: error.message });
    }
  });

  // PUT /clanci/:id - ažurira kompletan članak
  router.put("/clanci/:id", async (req, res) => {
    try {
      const clanakId = parseInt(req.params.id);
      const { naziv, opis, feedId, datuma, procitano } = req.body;

      if (!naziv || !opis || !feedId || !datuma) {
        return res.status(400).json({ error: "Nedostaju obavezna polja" });
      }

      const collection = db.collection("clanci");
      const result = await collection.updateOne(
        { id: clanakId, userId: req.user.userId },
        { $set: { naziv, opis, feedId, datuma, procitano: procitano || false } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Članak nije pronađen" });
      }

      res.status(200).json({ 
        poruka: `USPJEH -> Članak sa ID ${clanakId} je ažuriran` 
      });
    } catch (error) {
      res.status(400).json({ error: "Greška pri ažuriranju članka", details: error.message });
    }
  }); 

  // PATCH /clanci/:id/procitano - označi članak kao pročitan
  router.patch("/clanci/:id/procitano", async (req, res) => {
    try {
      const clanakId = parseInt(req.params.id);
      const { procitano } = req.body;

      if (typeof procitano !== 'boolean') {
        return res.status(400).json({ error: "procitano mora biti boolean" });
      }

      const collection = db.collection("clanci");
      const result = await collection.updateOne(
        { id: clanakId, userId: req.user.userId },
        { $set: { procitano } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Članak nije pronađen" });
      }

      const status = procitano ? "pročitan" : "nepročitan";
      res.status(200).json({ 
        poruka: `USPJEH -> Članak sa ID ${clanakId} je označen kao ${status}` 
      });
    } catch (error) {
      res.status(400).json({ error: "Greška pri ažuriranju statusa", details: error.message });
    }
  });

  // GET /clanci/feedId/:feedId - svi članci za određeni feed
  router.get("/clanci/feedId/:feedId", async (req, res) => {
    try {
      const feedId = parseInt(req.params.feedId);
      const collection = db.collection("clanci");
      const clanci = await collection.find({ feedId: feedId, userId: req.user.userId }).toArray();
      
      res.status(200).json(clanci);
    } catch (error) {
      res.status(400).json({ error: "Greška pri filtriranju članaka", details: error.message });
    }
  });

  // GET /clanci/procitani/false - svi nepročitani članci
  router.get("/clanci/procitani/false", async (req, res) => {
    try {
      const collection = db.collection("clanci");
      const clanci = await collection.find({ procitano: false, userId: req.user.userId }).toArray();
      
      res.status(200).json(clanci);
    } catch (error) {
      res.status(400).json({ error: "Greška pri dohvatu nepročitanih članaka", details: error.message });
    }
  });

  //Provjera RSS LINKA -> validacija
router.get("/rss/validate", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ 
      valid: false, 
      message: 'URL nije naveden' 
    });
  }

  try {
    const Parser = (await import('rss-parser')).default;
    const parser = new Parser({
      timeout: 5000, 
      headers: {
        'User-Agent': 'NewsCombo RSS Validator/1.0',
      }
    });

    const feed = await parser.parseURL(url);

    if (feed && feed.items && feed.items.length > 0) {
      return res.status(200).json({
        valid: true,
        itemCount: feed.items.length,
        feedTitle: feed.title || 'N/A',
        message: 'RSS feed je validan'
      });
    } else {
      return res.status(200).json({
        valid: false,
        message: 'RSS feed ne sadrži vijesti'
      });
    }
  } catch (error) {
    console.error('Greška pri validaciji RSS-a:', error.message);
    return res.status(200).json({
      valid: false,
      message: 'Link nije validan RSS feed ili je nedostupan',
      error: error.message
    });
  }
});
  
  
  // RSS PARSER ENDPOINT 
  // NE KORISTI SE JER SE KORISTI NewsGlobal.js client side pristup
router.get("/rss/parse/:feedId", async (req, res) => {
  try {
    const feedId = parseInt(req.params.feedId);
    const feedCollection = db.collection("rss_feedovi");
    
    const feed = await feedCollection.findOne({ 
      id: feedId, 
      userId: req.user.userId 
    });
    
    if (!feed) {
      return res.status(404).json({ error: "Feed nije pronađen" });
    }

    const Parser = (await import('rss-parser')).default;
    const parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'NewsCombo/1.0',
      }
    });

    const rssFeed = await parser.parseURL(feed.url);
    
    const articles = rssFeed.items.slice(0, 30).map(item => ({
      title: item.title || "Bez naslova",
      description: item.contentSnippet || item.description || "",
      content: item.content || item.description || "",
      link: item.link,
      pubDate: item.pubDate,
      isoDate: item.isoDate,
      guid: item.guid || item.link,
      source: feed.naziv,
      feedId: feed.id,
      category: feed.kategorija,
      imageUrl: extractImageUrl(item),  // ✅ Nova helper funkcija
      enclosure: item.enclosure  // Zadrži za kompatibilnost
    }));
    

    res.json({
      feedId: feed.id,
      feedName: feed.naziv,
      articles: articles,
      totalCount: articles.length
    });

  } catch (error) {
    console.error('RSS parse greška:', error);
    res.status(500).json({ 
      error: "Greška pri parsiranju RSS-a", 
      details: error.message 
    });
  }
});

// Batch endpoint
router.post("/rss/parse-multiple", async (req, res) => {
  try {
    const { feedIds } = req.body;
    
    if (!feedIds || !Array.isArray(feedIds)) {
      return res.status(400).json({ error: "feedIds mora biti niz" });
    }

    const feedCollection = db.collection("rss_feedovi");
    const Parser = (await import('rss-parser')).default;
    const parser = new Parser({
      timeout: 10000,
      headers: { 'User-Agent': 'NewsCombo/1.0' }
    });

    const results = [];

    for (const feedId of feedIds) {
      try {
        const feed = await feedCollection.findOne({ 
          id: parseInt(feedId), 
          userId: req.user.userId 
        });
        
        if (!feed) continue;

        const rssFeed = await parser.parseURL(feed.url);
        
        const articles = rssFeed.items.slice(0, 30).map(item => ({
          title: item.title || "Bez naslova",
          description: item.contentSnippet || item.description || "",
          content: item.content || item.description || "",
          link: item.link,
          pubDate: item.pubDate,
          isoDate: item.isoDate,
          guid: item.guid || item.link,
          source: feed.naziv,
          feedId: feed.id,
          category: feed.kategorija,
          imageUrl: extractImageUrl(item),  // ✅ Nova helper funkcija
          enclosure: item.enclosure
        }));
        

        results.push({
          feedId: feed.id,
          feedName: feed.naziv,
          articles: articles
        });

      } catch (error) {
        console.error(`Feed ${feedId} greška:`, error.message);
        continue;
      }
    }

    const allArticles = results.flatMap(r => r.articles);

    res.json({
      feeds: results,
      totalArticles: allArticles.length,
      articles: allArticles
    });

  } catch (error) {
    res.status(500).json({ 
      error: "Greška pri parsiranju feedova", 
      details: error.message 
    });
  }
});


  return router;
}
