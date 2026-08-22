import express from "express";

// Profil interesa — minimalno spremište za cross-device sync.
// Algoritam radi u pregledniku; ovdje se samo čitaju/pišu mali agregati
// (nikad članci, naslovi ili povijest čitanja).

const MAX_PAYLOAD_BYTES = 20 * 1024;

const CAPS = { src: 60, top: 250, cat: 15, hb: 150 };

const clampNum = (v, lo, hi) => {
    const n = Number(v);
    // Sanitizer smije vratiti SAMO finite broj (NaN bi Mongo pretvorio u null)
    if (!Number.isFinite(n)) return 0;
    return Math.min(hi, Math.max(lo, n));
};

// Defenzivna sanitizacija profila s klijenta (nikad ne vjeruj ulazu)
function sanitizeProfile(input) {
    if (!input || typeof input !== "object") return null;

    const cleanMap = (raw, cap) => {
        const out = {};
        if (!raw || typeof raw !== "object") return out;
        const entries = Object.entries(raw)
            .filter(([key, val]) => typeof key === "string" && key.length <= 64 && val && typeof val === "object")
            .map(([key, val]) => [key, {
                s: clampNum(val.s, -1, 1),
                ...(typeof val.n === "number" ? { n: Math.max(0, Math.floor(val.n)) } : {}),
                t: Number.isFinite(Number(val.t)) ? Number(val.t) : Date.now(),
            }])
            .sort((a, b) => b[1].t - a[1].t) // zadrži najnovije ako je previše
            .slice(0, cap);
        for (const [key, val] of entries) out[key] = val;
        return out;
    };

    const st = input.st && typeof input.st === "object" ? input.st : {};
    const hb = Array.isArray(input.hb)
        ? input.hb.filter((h) => typeof h === "string" && h.length <= 16).slice(0, CAPS.hb)
        : [];

    return {
        v: clampNum(input.v || 1, 1, 99),
        src: cleanMap(input.src, CAPS.src),
        top: cleanMap(input.top, CAPS.top),
        cat: cleanMap(input.cat, CAPS.cat),
        st: {
            likes: Math.max(0, Math.floor(clampNum(st.likes ?? 0, 0, 1e6))),
            dislikes: Math.max(0, Math.floor(clampNum(st.dislikes ?? 0, 0, 1e6))),
            opens: Math.max(0, Math.floor(clampNum(st.opens ?? 0, 0, 1e6))),
        },
        hb,
    };
}

export default function createProfileRoutes(db) {
    const router = express.Router();
    const collection = db.collection("taste_profiles");

    // Unique index na userId (jedan profil po korisniku) — jednom, fire-and-forget
    collection.createIndex({ userId: 1 }, { unique: true }).catch(() => {});

    // GET /api/profile — dohvati profil prijavljenog korisnika
    router.get("/api/profile", async (req, res) => {
        try {
            const doc = await collection.findOne(
                { userId: req.user.userId },
                { projection: { _id: 0, userId: 0 } }
            );
            res.status(200).json({ profile: doc || null });
        } catch (error) {
            res.status(500).json({ error: "Greška pri dohvatu profila", details: error.message });
        }
    });

    // PUT /api/profile — spremi (upsert) profil s klijenta
    router.put("/api/profile", async (req, res) => {
        try {
            const size = Buffer.byteLength(JSON.stringify(req.body?.profile || {}));
            if (size > MAX_PAYLOAD_BYTES) {
                return res.status(413).json({ error: "Profil prevelik" });
            }

            const profile = sanitizeProfile(req.body?.profile);
            if (!profile) {
                return res.status(400).json({ error: "Neispravan profil" });
            }

            await collection.updateOne(
                { userId: req.user.userId },
                { $set: { ...profile, userId: req.user.userId, updatedAt: new Date() } },
                { upsert: true }
            );

            res.status(200).json({ poruka: "Profil spremljen" });
        } catch (error) {
            res.status(500).json({ error: "Greška pri spremanju profila", details: error.message });
        }
    });

    // DELETE /api/profile — brisanje profila interesa
    router.delete("/api/profile", async (req, res) => {
        try {
            await collection.deleteOne({ userId: req.user.userId });
            res.status(200).json({ poruka: "Profil interesa obrisan" });
        } catch (error) {
            res.status(500).json({ error: "Greška pri brisanju profila", details: error.message });
        }
    });

    return router;
}
