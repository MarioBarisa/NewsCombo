import { config } from "dotenv";

config();

const URL = process.env.URL;

import { MongoClient } from "mongodb";

async function connectToDatabase() {

    if (!URL) {
        throw new Error("MongoDB URL nije postavljen u .env datoteci.");
      }

    const client = new MongoClient(URL)
    try {
        await client.connect();
        console.log("Uspjeh. SPOJEN NA DB.");
        let db = client.db("NewsCombo")
        await db.collection('rss_feedovi').createIndex({ userId: 1, id: 1 }, { unique: true });
        await db.collection('grupe').createIndex({ userId: 1, id: 1 }, { unique: true });
        return db;
        
    } catch (error) {
        await client.close();
        console.error("Spajanje ili provjera indeksa nije uspjela.")
        throw error;
    }
    
}

export { connectToDatabase };
