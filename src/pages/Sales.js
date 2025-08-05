import React, { useState } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Grid,
  InputAdornment,
  IconButton,
  TableSortLabel,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Menu,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const GET_SALES_AND_CLIENTS = gql`
  query GetSalesAndClients {
    sales {
      id
      client {
        id
        name
      }
      totalAmount
      status
      paymentMethod
      createdAt
      products {
  product {
    id
    name
    price {
      current
      currency
      lastUpdate
    }
  }
  quantity
  unitPrice
  currency
}

      notes
    }
    clients {
      id
      name
    }
  }
`;

const CREATE_SALE_MUTATION = gql`
  mutation CreateSale(
    $client: ID!
    $products: [SaleProductInput!]!
    $paymentMethod: String!
    $notes: String
  ) {
    createSale(
      client: $client
      products: $products
      paymentMethod: $paymentMethod
      notes: $notes
    ) {
      id
      totalAmount
      status
    }
  }
`;

const UPDATE_SALE_MUTATION = gql`
  mutation UpdateSale($id: ID!, $input: SaleInput!) {
    updateSale(id: $id, input: $input) {
      id
      client {
        id
        name
      }
      total
      status
      paymentMethod
      date
    }
  }
`;

const DELETE_SALE_MUTATION = gql`
  mutation DeleteSale($id: ID!) {
    deleteSale(id: $id)
  }
`;

const GET_PRODUCTS = gql`
  query {
    products {
      id
      name
      stock
      price {
        current
        currency
        lastUpdate
      }
    }
  }
`;


function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

function Sales() {
  const {
    loading: queryLoading,
    error,
    data,
    refetch,
  } = useQuery(GET_SALES_AND_CLIENTS);
  const { data: productsData } = useQuery(GET_PRODUCTS);
  const [formData, setFormData] = useState({
    client: "",
    paymentMethod: "cash",
    notes: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingSale, setEditingSale] = useState(null);
  const [deleteSaleId, setDeleteSaleId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    clientId: "",
    total: "",
    status: "",
    paymentMethod: "",
    date: "",
  });
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const [createSale, { loading: mutationLoading }] = useMutation(
    CREATE_SALE_MUTATION,
    {
      onCompleted: (data) => {
        console.log("Venta creada:", data);
        refetch(); // Recargar la lista de ventas
        setFormData({ client: "", paymentMethod: "cash", notes: "" }); // Limpiar formulario
      },
      onError: (error) => {
        console.error("Error al crear venta:", error);
      },
    }
  );

  const [updateSale] = useMutation(UPDATE_SALE_MUTATION, {
    onCompleted: () => {
      setEditingSale(null);
      refetch();
    },
  });

  const [deleteSale] = useMutation(DELETE_SALE_MUTATION, {
    onCompleted: () => {
      setDeleteSaleId(null);
      refetch();
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Agregar producto a la venta
  const handleAddProduct = (productId) => {
    const product = productsData.products.find((p) => p.id === productId);
    setSelectedProducts([
      ...selectedProducts,
      {
        productId,
        name: product.name,
        price: product.price.current,
        quantity: 1,
        stock: product.stock,
      },
    ]);
  };

  // Cambiar cantidad
  const handleQuantityChange = (index, quantity) => {
    setSelectedProducts((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }
          : item
      )
    );
  };

  // Eliminar producto
  const handleRemoveProduct = (index) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  // Calcular total
  const totalAmount = selectedProducts.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    createSale({
      variables: {
        client: formData.client,
        products: selectedProducts.map((item) => ({
          product: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
          currency: "ARS",
        })),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      },
    });
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handlePaymentMethodFilterChange = (event) => {
    setPaymentMethodFilter(event.target.value);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const filteredAndSortedSales = React.useMemo(() => {
    const filtered = (data?.sales || []).filter((sale) => {
      const matchesSearch =
        sale.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || sale.status === statusFilter;

      const matchesPaymentMethod =
        paymentMethodFilter === "all" ||
        sale.paymentMethod === paymentMethodFilter;

      return matchesSearch && matchesStatus && matchesPaymentMethod;
    });

    return stableSort(filtered, getComparator(order, orderBy));
  }, [
    data?.sales,
    searchTerm,
    statusFilter,
    paymentMethodFilter,
    order,
    orderBy,
  ]);

  const paginatedSales = React.useMemo(() => {
    return filteredAndSortedSales?.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredAndSortedSales, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditClick = (sale) => {
    setEditingSale(sale);
    setEditFormData({
      clientId: sale.client.id,
      total: sale.totalAmount.toString(),
      status: sale.status,
      paymentMethod: sale.paymentMethod,
      date: new Date(sale.createdAt).toISOString().split("T")[0],
    });
  };

  const handleDeleteClick = (saleId) => {
    setDeleteSaleId(saleId);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateSale({
      variables: {
        id: editingSale.id,
        input: {
          clientId: editFormData.clientId,
          total: parseFloat(editFormData.total),
          status: editFormData.status,
          paymentMethod: editFormData.paymentMethod,
          date: editFormData.date,
        },
      },
    });
  };

  const handleDeleteConfirm = () => {
    deleteSale({
      variables: {
        id: deleteSaleId,
      },
    });
  };

  const handleExportClick = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  const exportToExcel = () => {
    const data = filteredAndSortedSales.map((sale) => ({
      ID: sale.id,
      Cliente: sale.client.name,
      Total: sale.totalAmount,
      Estado:
        sale.status === "completed"
          ? "Completada"
          : sale.status === "pending"
          ? "Pendiente"
          : "Cancelada",
      "Método de Pago":
        sale.paymentMethod === "cash"
          ? "Efectivo"
          : sale.paymentMethod === "credit"
          ? "Crédito"
          : "Transferencia",
      Fecha: new Date(sale.createdAt).toLocaleDateString(),
      Productos: sale.products
        .map((p) => `${p.product.name} (${p.quantity} x $${p.price})`)
        .join(", "),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    XLSX.writeFile(wb, "ventas.xlsx");
    handleExportClose();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(16);
    doc.text("Reporte de Ventas", 14, 15);

    // Fecha
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 22);

    // Tabla
    const tableData = filteredAndSortedSales.map((sale) => [
      sale.id,
      sale.client.name,
      sale.totalAmount,
      sale.status === "completed"
        ? "Completada"
        : sale.status === "pending"
        ? "Pendiente"
        : "Cancelada",
      sale.paymentMethod === "cash"
        ? "Efectivo"
        : sale.paymentMethod === "credit"
        ? "Crédito"
        : "Transferencia",
      new Date(sale.createdAt).toLocaleDateString(),
      sale.products
        .map((p) => `${p.product.name} (${p.quantity} x $${p.price})`)
        .join(", "),
    ]);

    doc.autoTable({
      head: [
        [
          "ID",
          "Cliente",
          "Total",
          "Estado",
          "Método de Pago",
          "Fecha",
          "Productos",
        ],
      ],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("ventas.pdf");
    handleExportClose();
  };

  if (error)
    return (
      <Typography color="error">
        Error al cargar las ventas: {error.message}
      </Typography>
    );

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Gestión de Ventas</Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleExportClick}
            startIcon={<FileDownloadIcon />}
          >
            Exportar
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={exportToExcel}>
              <ExcelIcon sx={{ mr: 1 }} /> Exportar a Excel
            </MenuItem>
            <MenuItem onClick={exportToPDF}>
              <PdfIcon sx={{ mr: 1 }} /> Exportar a PDF
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      <Typography variant="h4" gutterBottom>
        Ventas
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Nueva Venta
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          {!data?.clients || data.clients.length === 0 ? (
            <Typography color="error" sx={{ my: 2 }}>
              No hay clientes cargados. Por favor, registre un cliente antes de
              crear una venta.
            </Typography>
          ) : (
            <TextField
              fullWidth
              margin="normal"
              select
              label="Cliente"
              name="client"
              value={formData.client}
              onChange={handleChange}
              required
            >
              {data.clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            fullWidth
            margin="normal"
            select
            label="Método de Pago"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            required
          >
            <MenuItem value="cash">Efectivo</MenuItem>
            <MenuItem value="transfer">Transferencia</MenuItem>
            <MenuItem value="credit">Crédito</MenuItem>
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label="Notas"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
          {/* Selección de productos */}
          <TextField
            select
            label="Agregar producto"
            fullWidth
            onChange={(e) => handleAddProduct(e.target.value)}
            value=""
            sx={{ mb: 2 }}
          >
            {productsData?.products
              .filter(
                (p) =>
                  !selectedProducts.some((sp) => sp.productId === p.id) &&
                  p.stock > 0
              )
              .map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name} (${product.price.current}) - Stock:{" "}
                  {product.stock}
                </MenuItem>
              ))}
          </TextField>
          {/* Lista de productos seleccionados */}
          {selectedProducts.map((item, index) => (
            <Box key={item.productId} display="flex" alignItems="center" mb={1}>
              <Typography sx={{ mr: 2 }}>
                {item.name} (${item.price}) x
              </Typography>
              <TextField
                type="number"
                size="small"
                value={item.quantity}
                onChange={(e) =>
                  handleQuantityChange(index, Number(e.target.value))
                }
                inputProps={{ min: 1, max: item.stock }}
                sx={{ width: 80, mr: 2 }}
              />
              <Button
                color="error"
                onClick={() => handleRemoveProduct(index)}
                size="small"
              >
                Quitar
              </Button>
            </Box>
          ))}
          <Typography variant="h6" sx={{ mt: 2 }}>
            Total: ${totalAmount}
          </Typography>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            disabled={mutationLoading || selectedProducts.length === 0}
          >
            {mutationLoading ? "Creando venta..." : "Crear Venta"}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Listado de Ventas
        </Typography>

        {/* Filtros y Búsqueda */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar ventas"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearSearch} size="small">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Filtrar por estado"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="all">Todos los estados</MenuItem>
              <MenuItem value="pending">Pendiente</MenuItem>
              <MenuItem value="completed">Completada</MenuItem>
              <MenuItem value="cancelled">Cancelada</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Filtrar por método de pago"
              value={paymentMethodFilter}
              onChange={handlePaymentMethodFilterChange}
            >
              <MenuItem value="all">Todos los métodos</MenuItem>
              <MenuItem value="cash">Efectivo</MenuItem>
              <MenuItem value="transfer">Transferencia</MenuItem>
              <MenuItem value="credit">Crédito</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {queryLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Mostrando {filteredAndSortedSales?.length} de {data?.sales.length}{" "}
              ventas
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "id"}
                        direction={orderBy === "id" ? order : "asc"}
                        onClick={() => handleRequestSort("id")}
                      >
                        ID
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "client"}
                        direction={orderBy === "client" ? order : "asc"}
                        onClick={() => handleRequestSort("client")}
                      >
                        Cliente
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "totalAmount"}
                        direction={orderBy === "totalAmount" ? order : "asc"}
                        onClick={() => handleRequestSort("totalAmount")}
                      >
                        Total
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "status"}
                        direction={orderBy === "status" ? order : "asc"}
                        onClick={() => handleRequestSort("status")}
                      >
                        Estado
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "paymentMethod"}
                        direction={orderBy === "paymentMethod" ? order : "asc"}
                        onClick={() => handleRequestSort("paymentMethod")}
                      >
                        Método de Pago
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "createdAt"}
                        direction={orderBy === "createdAt" ? order : "asc"}
                        onClick={() => handleRequestSort("createdAt")}
                      >
                        Fecha
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedSales?.map((sale) => (
                    <TableRow
                      key={sale.id}
                      sx={{
                        backgroundColor:
                          sale.status === "pending"
                            ? "#fff3e0"
                            : sale.status === "cancelled"
                            ? "#ffebee"
                            : "inherit",
                      }}
                    >
                      <TableCell>{sale.id}</TableCell>
                      <TableCell>
                        {sale.client?.name || "Sin cliente"}
                      </TableCell>
                      <TableCell>${sale.totalAmount}</TableCell>
                      <TableCell>{sale.status}</TableCell>
                      <TableCell>{sale.paymentMethod}</TableCell>
                      <TableCell>
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(sale)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(sale.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredAndSortedSales?.length || 0}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingSale}
        onClose={() => setEditingSale(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Venta</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Cliente"
                  value={editFormData.clientId}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      clientId: e.target.value,
                    })
                  }
                  required
                  disabled={!data?.clients || data.clients.length === 0}
                >
                  {data?.clients && data.clients.length > 0 ? (
                    data.clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="">No hay clientes</MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Total"
                  type="number"
                  value={editFormData.total}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, total: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Estado"
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value })
                  }
                  required
                >
                  <MenuItem value="completed">Completada</MenuItem>
                  <MenuItem value="pending">Pendiente</MenuItem>
                  <MenuItem value="cancelled">Cancelada</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Método de Pago"
                  value={editFormData.paymentMethod}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      paymentMethod: e.target.value,
                    })
                  }
                  required
                >
                  <MenuItem value="cash">Efectivo</MenuItem>
                  <MenuItem value="credit">Crédito</MenuItem>
                  <MenuItem value="transfer">Transferencia</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha"
                  type="date"
                  value={editFormData.date}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, date: e.target.value })
                  }
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingSale(null)}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary">
              Guardar Cambios
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteSaleId} onClose={() => setDeleteSaleId(null)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar esta venta? Esta acción no se puede
            deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteSaleId(null)}>Cancelar</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Sales;
 