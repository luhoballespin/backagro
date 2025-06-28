require("dotenv").config();
const express = require("express");
const { ApolloServer } = require("apollo-server-express");

const cors = require("cors");
const jwt = require("jsonwebtoken");
const axios = require("axios"); // Asegúrate de tener este import

// Importar typeDefs y resolvers
const typeDefs = require("./typeDefs");
const resolvers = require("./resolvers");

// Configuración de la base de datos

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.MONGODB_URI
  

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

// Configuración de Express
const app = express();
app.use(cors());
app.use(express.json());
// Endpoint proxy para cereales (Agrofy)
app.get("/api/cereales", (req, res) => {
  // Datos de ejemplo
  res.json({
    soja: { precio: 350, unidad: "USD/ton", fecha: "2025-06-19" },
    maiz: { precio: 180, unidad: "USD/ton", fecha: "2025-06-19" },
    trigo: { precio: 220, unidad: "USD/ton", fecha: "2025-06-19" },
  });
});

// Endpoint proxy para el dólar oficial
app.get("/api/dolar", async (req, res) => {
  try {
    const response = await axios.get("https://api.bluelytics.com.ar/v2/latest");
    res.json(response.data);
  } catch (error) {
    console.error("Error al obtener datos del dólar:", error.message);
    res.status(500).json({ error: "Error al obtener datos del dólar" });
  }
});

// Configuración de Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    console.log("Authorization header:", req.headers.authorization);
    // Leer el header Authorization
    const auth = req.headers.authorization || "";
    let user = null;
    if (auth && auth.startsWith("Bearer ")) {
      const token = auth.replace("Bearer ", "");
      try {
        user = jwt.verify(token, process.env.JWT_SECRET || "tu-secreto-jwt");
      } catch (e) {
        // Token inválido o expirado
        user = null;
      }
    }
    console.log("Decoded user:", user);
    console.log("JWT_SECRET:", process.env.JWT_SECRET);
    return { req: { ...req, user } };
  },
  formatError: (err) => {
    console.error("GraphQL Error:", err);
    return err;
  },
});

// Ruta para obtener datos del BCRA

// Iniciar el servidor
async function startServer() {
  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(
      `GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`
    );
  });
}

startServer();
