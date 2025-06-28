const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String!
    role: String!
    createdAt: String!
  }
  type Price {
    current: Float!
    currency: String!
    lastUpdate: String!
  }

  type Product {
    id: ID!
    name: String!
    category: String!
    description: String
    sku: String!
    stock: Float!
    unit: String!
    price: Price!
    supplier: Supplier
    minStock: Float!
    location: Location
    active: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Location {
    warehouse: String
    shelf: String
  }

  type Client {
    id: ID!
    name: String!
    type: String!
    documentType: String!
    documentNumber: String!
    email: String!
    phone: String!
    address: Address
    businessInfo: BusinessInfo
    creditLimit: Float!
    paymentTerms: Int!
    status: String!
    notes: String
    createdAt: String!
    updatedAt: String!
  }

  type Address {
    street: String
    city: String
    state: String
    zipCode: String
    country: String
  }

  type BusinessInfo {
    businessName: String
    taxCategory: String
    taxStatus: String
  }

  type Sale {
    id: ID!
    client: Client! # <--- Esto es importante
    totalAmount: Float!
    status: String!
    paymentMethod: String!
    createdAt: String!
    products: [SaleProduct!]!
    notes: String
  }

  type SaleProduct {
    product: Product!
    quantity: Int!
    unitPrice: Float!
    currency: String!
  }

  type Supplier {
    id: ID!
    name: String!
    contactInfo: ContactInfo!
    products: [Product!]
  }

  type ContactInfo {
    email: String
    phone: String
    address: Address
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    users: [User!]!
    products: [Product!]!
    product(id: ID!): Product
    clients: [Client!]!
    client(id: ID!): Client
    sales: [Sale!]!
    sale(id: ID!): Sale
    suppliers: [Supplier!]!
    supplier(id: ID!): Supplier
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    register(email: String!, password: String!, name: String!): User
    createUser(
      email: String!
      password: String!
      name: String!
      role: String
    ): User!
    updateUser(id: ID!, email: String, name: String, role: String): User!
    deleteUser(id: ID!): Boolean!

    createProduct(
      name: String!
      category: String!
      description: String
      sku: String!
      stock: Float!
      unit: String!
      price: Float!
      currency: String
      supplier: ID
      minStock: Float
      location: LocationInput
    ): Product!

    updateProduct(
      id: ID!
      name: String
      sku: String
      category: String
      description: String
      stock: Float
      unit: String
      price: Float
      currency: String
      supplier: ID
      minStock: Float
      location: LocationInput
      active: Boolean
    ): Product!

    deleteProduct(id: ID!): Boolean!

    createClient(
      name: String!
      type: String!
      documentType: String!
      documentNumber: String!
      email: String!
      phone: String!
      address: AddressInput
      businessInfo: BusinessInfoInput
      creditLimit: Float
      paymentTerms: Int
    ): Client!

    updateClient(
      id: ID!
      name: String
      email: String
      phone: String
      address: AddressInput
      businessInfo: BusinessInfoInput
      creditLimit: Float
      paymentTerms: Int
      status: String
    ): Client!

    deleteClient(id: ID!): Boolean!

    createSale(
      client: ID!
      products: [SaleProductInput!]!
      paymentMethod: String!
      notes: String
    ): Sale!

    updateSale(id: ID!, status: String, notes: String): Sale!

    deleteSale(id: ID!): Boolean!
  }

  input LocationInput {
    warehouse: String
    shelf: String
  }

  input AddressInput {
    street: String
    city: String
    state: String
    zipCode: String
    country: String
  }

  input BusinessInfoInput {
    businessName: String
    taxCategory: String
    taxStatus: String
  }

  input SaleProductInput {
    product: ID!
    quantity: Float!
    unitPrice: Float!
    currency: String
  }
`;

module.exports = typeDefs;
