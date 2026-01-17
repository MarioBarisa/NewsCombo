import express from "express";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
import cors from 'cors';
app.use(cors()); 
const PORT = 3005;
import { connectToDatabase } from './mongo.js';
import createNewsRoutes from "./routes/newsRoutes.js";




async function startNC() {
    try {
        const db = await connectToDatabase();
        app.use(createNewsRoutes(db));
        
        app.listen(PORT, () => {
            console.log(`Server je pokrenut na: ${PORT}`);
        });
    } catch (error) {
        console.error("Greška prilikom pokretanja servera:", error);
        process.exit(1);
    }
}

startNC();

