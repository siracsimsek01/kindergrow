import { MongoClient, MongoClientOptions, Db, ServerApiVersion } from "mongodb"

// Connection URI with retry writes and majority write concern
const uri = process.env.MONGODB_URI || ""
const dbName = process.env.MONGODB_DB || "KinderGrow"

// Improved connection options
const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  minPoolSize: 5,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 30000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>
let db: Db

// Global variable for development mode
if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
    _mongoDb?: Db
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
      .catch(err => {
        console.error("Failed to connect to MongoDB:", err)
        throw err
      })
    
    globalWithMongo._mongoDb = client.db(dbName)
  }
  
  clientPromise = globalWithMongo._mongoClientPromise
  db = globalWithMongo._mongoDb!
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
    .catch(err => {
      console.error("Failed to connect to MongoDB:", err)
      throw err
    })
  db = client.db(dbName)
}

// Export a module-scoped MongoClient promise
export default async function connectToDatabase() {
  try {
    const connectedClient = await clientPromise
    return { 
      client: connectedClient, 
      db: connectedClient.db(dbName)
    }
  } catch (error) {
    console.error("MongoDB connection error:", error)
    // Attempt to reconnect once
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
    return { 
      client: await clientPromise, 
      db: (await clientPromise).db(dbName) 
    }
  }
}

// Add these helper functions
export async function createIndexes() {
  const { db } = await connectToDatabase()
  
  // Add indexes on commonly queried fields
  await Promise.all([
    db.collection("events").createIndex({ childId: 1, eventType: 1 }),
    db.collection("events").createIndex({ startTime: 1 }),
    db.collection("events").createIndex({ timestamp: 1 }),
    db.collection("children").createIndex({ parentId: 1 }),
  ])
  
  console.log("MongoDB indexes created successfully")
}