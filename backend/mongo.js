import { config } from "dotenv";

config();

const URL = process.env.URL;

import { MongoClient } from "mongodb";

async function connectToDatabase() {

    if (!URL) {
        throw new Error("MongoDB URL nije postavljen u .env datoteci.");
      }

    try {

        const client = new MongoClient(URL)
        await client.connect();
        console.log("Uspjeh. SPOJEN NA DB.");
        let db = client.db("NewsCombo")
        return db;
        
    } catch (error) {
        console.error("Došlo je do greške u spajanju.", error)
    }
    
}

export { connectToDatabase };