import { MongoClient } from "mongodb";
import { config } from "dotenv";

config();

const mongoURI = process.env.MONGO_URI;
const db_name = process.env.MONGO_DB_NAME;

export async function connectToDatabase() {
  try {
    const client = new MongoClient(mongoURI);
    await client.connect();
    console.log("Uspješno spajanje na bazu podataka");
    return client.db(db_name);
  } catch (error) {
    console.error("Greška prilikom spajanja na bazu podataka", error);
    throw error;
  }
}
