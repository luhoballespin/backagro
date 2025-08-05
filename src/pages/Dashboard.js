import React, { useEffect, useState } from "react";
import axios from "axios";
import { Grid, Paper, Typography, Box, CircularProgress } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery, gql } from "@apollo/client";
import SummaryCard from "../components/SummaryCard";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const GET_SALES = gql`
  query GetSales {
    sales { 
    id
    totalAmount
      products {
        product {
          name
        }
        quantity 
        unitPrice
      }
    }
  }
`;

function Dashboard() {
  const [dolarOficial, setDolarOficial] = useState(null);
  const [dolarFecha, setDolarFecha] = useState(null);
  const [cereales, setCereales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCereales, setLoadingCereales] = useState(true);

  const { data: salesData, loading: loadingSales } = useQuery(GET_SALES);

  useEffect(() => {
    const fetchDatos = async () => {
      setLoading(true);
      try {
        const dolarRes = await axios.get("http://localhost:4000/api/dolar");
        if (
          dolarRes.data?.oficial?.value_buy !== undefined &&
          dolarRes.data?.oficial?.value_sell !== undefined
        ) {
          setDolarOficial({
            compra: dolarRes.data.oficial.value_buy,
            venta: dolarRes.data.oficial.value_sell,
          });
          setDolarFecha(dolarRes.data.last_update);
        }
      } catch (err) {
        setDolarOficial(null);
        setDolarFecha(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
  }, []);

  useEffect(() => {
    const fetchCereales = async () => {
      setLoadingCereales(true);
      try {
        const response = await axios.get("http://localhost:4000/api/cereales");
        setCereales(response.data);
      } catch (err) {
        setCereales(null);
      } finally {
        setLoadingCereales(false);
      }
    };
    fetchCereales();
  }, []);

  // Procesar ventas
  const ventasPorProducto = {};
  let totalCantidadVendida = 0;
  let totalVentasDinero = 0;

  if (salesData && salesData.sales) {
    salesData.sales.forEach((venta) => {
      venta.products.forEach((p) => {
        const nombre = p.product?.name || "Sin nombre";
        const precioUnitario = p.unitPrice || 0;
        const cantidad = p.quantity || 0;

        ventasPorProducto[nombre] =
          (ventasPorProducto[nombre] || 0) + cantidad;

        totalCantidadVendida += cantidad;
        totalVentasDinero += precioUnitario * cantidad;
      });
    });
  }

  const ventasData = Object.entries(ventasPorProducto).map(([name, value]) => ({
    name,
    value:
      totalCantidadVendida > 0
        ? ((value / totalCantidadVendida) * 100).toFixed(2)
        : 0,
  }));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <SummaryCard
            title="Cotización Dólar"
            value={
              dolarOficial
                ? `Compra: $${dolarOficial.compra} / Venta: $${dolarOficial.venta}`
                : "N/A"
            }
            subtitle={
              dolarFecha
                ? `Última actualización: ${new Date(
                    dolarFecha
                  ).toLocaleDateString("es-AR")}`
                : ""
            }
            icon="currency_exchange"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <SummaryCard
            title="Total de Ventas"
            value={`$${totalVentasDinero.toFixed(2)}`}
            subtitle="Suma total de ventas"
            icon="shopping_cart"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "400px" }}>
            <Typography variant="h6" gutterBottom>
              % de Ventas por Producto
            </Typography>
            {loadingSales ? (
              <CircularProgress />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ventasData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {ventasData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Cotizaciones de Cereales
            </Typography>
            {loadingCereales ? (
              <div>Cargando...</div>
            ) : cereales ? (
              <ul>
                {Object.entries(cereales).map(([nombre, datos]) => (
                  <li key={nombre}>
                    <strong>
                      {nombre.charAt(0).toUpperCase() + nombre.slice(1)}:
                    </strong>{" "}
                    ${datos.precio} {datos.unidad} (Fecha: {datos.fecha})
                  </li>
                ))}
              </ul>
            ) : (
              <div>No hay datos de cereales disponibles.</div>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
