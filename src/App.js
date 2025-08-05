import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import { ApolloProvider } from "@apollo/client";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Clients from "./pages/Clients";
import Sales from "./pages/Sales";
import { client } from "./utils/api";

function App() {
  return (
    <ApolloProvider client={client}>
      <Box sx={{ display: "flex" }}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="clients" element={<Clients />} />
            <Route path="sales" element={<Sales />} />
          </Route>
        </Routes>
      </Box>
    </ApolloProvider>
  );
}

export default App;
