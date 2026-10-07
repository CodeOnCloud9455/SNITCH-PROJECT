import mongoose from  "mongoose";
import { config } from "./config.js"

export async function connectToDb() {
     if (!config.MONGO_URI) {
          throw new Error("MONGO_URI is not defined");
     }

     await mongoose.connect(config.MONGO_URI);
     console.log("MongoDB connected");
}