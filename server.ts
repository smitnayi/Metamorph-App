import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes (Mocks) ---

  // Dashboard Summary
  app.get("/api/dashboard", (req, res) => {
    res.json({
      orders: { pending: 15, processing: 8, completed: 142 },
      inventory: { lowStockCount: 3, totalItems: 45 },
      metrics: {
        gas: [
          { name: "Mon", usage: 120 }, { name: "Tue", usage: 132 },
          { name: "Wed", usage: 101 }, { name: "Thu", usage: 134 },
          { name: "Fri", usage: 90 }, { name: "Sat", usage: 230 },
          { name: "Sun", usage: 210 }
        ],
        water: [
          { name: "Mon", usage: 220 }, { name: "Tue", usage: 182 },
          { name: "Wed", usage: 191 }, { name: "Thu", usage: 234 },
          { name: "Fri", usage: 290 }, { name: "Sat", usage: 330 },
          { name: "Sun", usage: 310 }
        ]
      },
      qualityFailRate: "2.4%"
    });
  });

  // Example generic route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- UI Serving ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
