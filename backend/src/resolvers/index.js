const { ApolloServer } = require("apollo-server-express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const Product = require("../models/Product");
const Client = require("../models/Client");
const Sale = require("../models/Sale");

const typeDefs = require("../typeDefs");

const resolvers = {
  Query: {
    me: async (_, __, { req }) => {
      if (!req.user) throw new Error("No autenticado");
      return req.user;
    },
    users: async (_, __, { req }) => {
      if (!req.user || req.user.role !== "admin")
        throw new Error("No autorizado");
      return User.find();
    },
    products: async () => {
      return Product.find();
    },
    product: async (_, { id }) => {
      return Product.findById(id);
    },
    clients: async () => {
      return Client.find();
    },
    client: async (_, { id }) => {
      return Client.findById(id);
    },
    sales: async () => {
      return Sale.find().populate("client");
    },
    sale: async (_, { id }) => {
      return Sale.findById(id).populate("client products.product createdBy");
    },
  },

  Mutation: {
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error("Usuario no encontrado");

      const valid = await user.comparePassword(password);
      if (!valid) throw new Error("Contraseña incorrecta");

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "tu-secreto-jwt",
        { expiresIn: "1d" }
      );

      return {
        token,
        user,
      };
    },

    register: async (_, { email, password, name }) => {
      // Verifica si el email ya está registrado
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error("El email ya está registrado");
      }
      // Crea el usuario (el hash se hace en el pre-save del modelo)
      const user = new User({ email, password, name });
      await user.save();
      return {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      };
    },

    createUser: async (_, { email, password, name, role }, { req }) => {
      if (!req.user || req.user.role !== "admin")
        throw new Error("No autorizado");

      const existingUser = await User.findOne({ email });
      if (existingUser) throw new Error("El email ya está registrado");

      const user = new User({
        email,
        password,
        name,
        role: role || "user",
      });

      await user.save();
      return user;
    },

    createProduct: async (_, args, { req }) => {
      if (!req.user) throw new Error("No autenticado");

      const product = new Product({
        ...args,
        price: {
          current: args.price,
          currency: args.currency || "ARS",
          lastUpdate: new Date(),
        },
      });

      await product.save();
      return product;
    },

    updateProduct: async (_, args, { req }) => {
      try {
        console.log("Args recibidos en updateProduct:", args);
        if (!req.user) throw new Error("No autenticado");

        // Extraer id y el resto de campos
        const { id, price, currency, ...fieldsToUpdate } = args;

        // Si hay price, armar el objeto price
        if (price !== undefined) {
          fieldsToUpdate.price = {
            current: price,
            currency: currency || "ARS",
            lastUpdate: new Date(),
          };
        }

        // Limpiar campos undefined
        Object.keys(fieldsToUpdate).forEach(
          (key) =>
            fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
        );

        const product = await Product.findByIdAndUpdate(
          id,
          { $set: fieldsToUpdate },
          { new: true }
        );
        if (!product) throw new Error("Producto no encontrado");
        return product;
      } catch (error) {
        console.error("Error en updateProduct:", error);
        throw error;
      }
    },

    createClient: async (_, args, { req }) => {
      if (!req.user) throw new Error("No autenticado");

      const existingClient = await Client.findOne({
        documentNumber: args.documentNumber,
      });
      if (existingClient)
        throw new Error("El número de documento ya está registrado");

      const client = new Client({
        ...args,
        createdBy: req.user.id,
      });

      await client.save();
      return client;
    },

    updateClient: async (_, { id, ...updates }, { req }) => {
      if (!req.user) throw new Error("No autenticado");

      const client = await Client.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
      );

      if (!client) throw new Error("Cliente no encontrado");
      return client;
    },

    createSale: async (
      _,
      { client, products, paymentMethod, notes },
      { req }
    ) => {
      if (!req.user) throw new Error("No autenticado");

      // Calcular el monto total
      let totalAmount = 0;
      const saleProducts = await Promise.all(
        products.map(async (p) => {
          const product = await Product.findById(p.product);
          if (!product) throw new Error(`Producto no encontrado: ${p.product}`);

          if (product.stock < p.quantity) {
            throw new Error(`Stock insuficiente para ${product.name}`);
          }

          const amount = p.quantity * p.unitPrice;
          totalAmount += amount;

          // Actualizar stock
          product.stock -= p.quantity;
          await product.save();

          return {
            product: p.product,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            currency: p.currency || "ARS",
          };
        })
      );

      const sale = new Sale({
        client,
        products: saleProducts,
        totalAmount,
        paymentMethod,
        notes,
        createdBy: req.user.id,
      });

      await sale.save();
      return sale.populate("client products.product createdBy");
    },

    updateSale: async (_, { id, status, notes }, { req }) => {
      if (!req.user) throw new Error("No autenticado");

      const sale = await Sale.findByIdAndUpdate(
        id,
        { $set: { status, notes } },
        { new: true }
      ).populate("client products.product createdBy");

      if (!sale) throw new Error("Venta no encontrada");
      return sale;
    },
  },
};

module.exports = resolvers;
