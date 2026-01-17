import express from "express";

export default function createNewsRoutes(db) {
  const router = express.Router();

  // INICIJALNI PODACI 
  

  const inicijalniRSSFeedovi = [
    { id: 1, naziv: "BBC News", url: "https://feeds.bbc.co.uk/news/rss.xml", kategorija: "Globalne vijesti" },
    { id: 2, naziv: "HRT Vijesti", url: "https://hrt.hr/vijesti/rss", kategorija: "HR vijesti" },
    { id: 3, naziv: "TechCrunch", url: "https://techcrunch.com/feed/", kategorija: "Tech" },
    { id: 4, naziv: "The Verge", url: "https://www.theverge.com/rss/index.xml", kategorija: "Tech" },
    { id: 5, naziv: "ESPN", url: "https://www.espn.com/espn/rss", kategorija: "Sport" },
  ];

  const inicijalneGrupe = [
    { id: 1, naziv: "Tech", opis: "Tehnološke vijesti", feedIds: [3, 4] },
    { id: 2, naziv: "HR vijesti", opis: "Vijesti iz Hrvatske", feedIds: [2] },
    { id: 3, naziv: "Globalne vijesti", opis: "Vijesti sa svijeta", feedIds: [1] },
    { id: 4, naziv: "Sport", opis: "Sportske vijesti", feedIds: [5] },
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
      await feedCollection.deleteMany({});
      let result = await feedCollection.insertMany(inicijalniRSSFeedovi);
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
      await grupeCollection.deleteMany({});
      let result = await grupeCollection.insertMany(inicijalneGrupe);
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
      await clanci.deleteMany({});
      let result = await clanci.insertMany(inicijalniClanciMock);
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
      const feedovi = await collection.find().toArray();
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
      const feed = await collection.findOne({ id: feedId });
      
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
      const sviFeedi = await collection.find().toArray();
      const noviId = Math.max(...sviFeedi.map(f => f.id), 0) + 1;

      const result = await collection.insertOne({
        id: noviId,
        naziv: naziv,
        url: url,
        kategorija: kategorija
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
      const result = await collection.deleteOne({ id: feedId });

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
        { id: feedId },
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
        { id: feedId },
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
      const feedovi = await collection.find({ kategorija: kategorija }).toArray();
      
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
      const grupe = await collection.find().toArray();
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
      const grupa = await collection.findOne({ id: grupaId });
      
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
      const sveGrupe = await collection.find().toArray();
      const noviId = Math.max(...sveGrupe.map(g => g.id), 0) + 1;

      const result = await collection.insertOne({
        id: noviId,
        naziv: naziv,
        opis: opis,
        feedIds: feedIds
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
      const result = await collection.deleteOne({ id: grupaId });

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
        { id: grupaId },
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
        { id: grupaId },
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

  // ČLANCI - CRUD operacije

  // GET /clanci - svi članci
  router.get("/clanci", async (req, res) => {
    try {
      const collection = db.collection("clanci");
      const clanci = await collection.find().toArray();
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
      const clanak = await collection.findOne({ id: clanakId });
      
      if (!clanak) {
        return res.status(404).json({ error: "Članak nije pronađen" });
      }
      res.status(200).json(clanak);
    } catch (error) {
      res.status(400).json({ error: "Greška pri dohvatu članka", details: error.message });
    }
  });
    
    /*

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
      const sviClanci = await collection.find().toArray();
      const noviId = Math.max(...sviClanci.map(c => c.id), 0) + 1;

      const result = await collection.insertOne({
        id: noviId,
        naziv: naziv,
        opis: opis,
        feedId: feedId,
        datuma: datuma,
        procitano: procitano || false
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
      const result = await collection.deleteOne({ id: clanakId });

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
        { id: clanakId },
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
  }); */

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
        { id: clanakId },
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
      const clanci = await collection.find({ feedId: feedId }).toArray();
      
      res.status(200).json(clanci);
    } catch (error) {
      res.status(400).json({ error: "Greška pri filtriranju članaka", details: error.message });
    }
  });

  // GET /clanci/procitani/false - svi nepročitani članci
  router.get("/clanci/procitani/false", async (req, res) => {
    try {
      const collection = db.collection("clanci");
      const clanci = await collection.find({ procitano: false }).toArray();
      
      res.status(200).json(clanci);
    } catch (error) {
      res.status(400).json({ error: "Greška pri dohvatu nepročitanih članaka", details: error.message });
    }
  });

  return router;
}

