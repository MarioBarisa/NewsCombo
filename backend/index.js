import express from "express";
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
import cors from 'cors';
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }));
const PORT = 3005;

app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      message: 'NewsCombo Backend is running',
      timestamp: new Date().toISOString()
    });
});
  

import { connectToDatabase } from './mongo.js';
import createNewsRoutes from "./routes/newsRoutes.js";
import createBookmarkRoutes from "./routes/bookMarkRoutes.js";
import createAIRoutes from "./routes/aiRoutes.js";
import createAuthRoutes from "./routes/authRoutes.js";
import { authMiddleware } from "./middleware/auth.js";

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
        
        // Auth routes 
        app.use('/api', createAuthRoutes(db));
        
        // Zaštićene rute
        app.use(authMiddleware);
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
