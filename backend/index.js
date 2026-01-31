import express from "express";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
import cors from 'cors';
app.use(cors()); 
const PORT = 3005;
import { connectToDatabase } from './mongo.js';
import createNewsRoutes from "./routes/newsRoutes.js";
import createBookmarkRoutes from "./routes/bookMarkRoutes.js";
import createAIRoutes from "./routes/aiRoutes.js";

const logger = (req, res, next) => {
    const timeStamp = new Date().toISOString();
    console.log("Vrijeme: ", timeStamp);
    console.log("Ruta", req.originalUrl);
    console.log(req.method);
    console.log(req.headers);
    console.log(req.body);
    next();
};

app.use(logger);


async function startNC() {
    try {
        const db = await connectToDatabase();
        app.use(createNewsRoutes(db));
        app.use(createBookmarkRoutes(db));
        app.use('/api', createAIRoutes(db)); 
        
        app.listen(PORT, () => {
            console.log(`Server je pokrenut na: ${PORT}`);
        });
    } catch (error) {
        console.error("Greška prilikom pokretanja servera:", error);
        process.exit(1);
    }
}



startNC();

