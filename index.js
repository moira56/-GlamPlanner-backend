import express from "express";
import { connectToDatabase } from "./db.js";

const app = express();
app.use(express.json());

let db = await connectToDatabase();

let PORT = 3000;

app.listen(PORT, (error) => {
  if (error) {
    console.error(`Greška prilikom pokretanja poslužitelja: ${error.message}`);
  } else {
    console.log(`Poslužitelj radi na http://localhost:${PORT}`);
  }
});
