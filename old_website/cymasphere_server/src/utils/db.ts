import mongoose from "mongoose";

// Get MongoDB connection details from environment
const DB_CONNECTION =
  Deno.env.get("DB_CONNECTION") || "mongodb://localhost:27017/cymasphere";
const DB_USER = Deno.env.get("DB_USER") || "";
const DB_PASS = Deno.env.get("DB_PASS") || "";

// Connect to MongoDB
export async function connectToDatabase(): Promise<void> {
  try {
    mongoose.set("strictQuery", false);

    const options: mongoose.ConnectOptions = {};

    if (DB_USER && DB_PASS) {
      options.user = DB_USER;
      options.pass = DB_PASS;
    }

    console.log(`Connecting to MongoDB at ${DB_CONNECTION}...`);
    await mongoose.connect(DB_CONNECTION, options);
    console.log("Connected to MongoDB successfully");
  } catch (error: any) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

// Close MongoDB connection
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error: any) {
    console.error("Error disconnecting from MongoDB:", error);
  }
}
