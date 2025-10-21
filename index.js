import express from "express";
import cors from "cors";
import { connectToDatabase } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

let db = await connectToDatabase();

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend radi i CORS je OK" });
});

let PORT = 3000;

app.listen(PORT, (error) => {
  if (error) {
    console.error(`Greška prilikom pokretanja poslužitelja: ${error.message}`);
  } else {
    console.log(`Poslužitelj radi na http://localhost:${PORT}`);
  }
});
