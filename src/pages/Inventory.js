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
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Menu,
  TableSortLabel,
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

const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      name
      category
      description
      sku
      stock
      unit
      price {
        current
        currency
        lastUpdate
      }
      supplier {
        id
        name
      }
      minStock
      location {
        warehouse
        shelf
      }
      active
      createdAt
      updatedAt
    }
  }
`;

const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct(
    $name: String!
    $category: String!
    $sku: String!
    $stock: Float!
    $unit: String!
    $price: Float!
    $currency: String!
  ) {
    createProduct(
      name: $name
      category: $category
      sku: $sku
      stock: $stock
      unit: $unit
      price: $price
      currency: $currency
    ) {
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

const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct(
    $id: ID!
    $name: String
    $sku: String
    $category: String
    $stock: Float
    $unit: String
    $price: Float
    $currency: String
  ) {
    updateProduct(
      id: $id
      name: $name
      sku: $sku
      category: $category
      stock: $stock
      unit: $unit
      price: $price
      currency: $currency
    ) {
      id
      name
      sku
      category
      stock
      unit
      price {
        current
        currency
        lastUpdate
      }
    }
  }
`;

const DELETE_PRODUCT_MUTATION = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

function Inventory() {
  const {
    loading: queryLoading,
    error,
    data,
    refetch,
  } = useQuery(GET_PRODUCTS);
  const [formData, setFormData] = useState({
    name: "",
    category: "cereal",
    sku: "",
    stock: "",
    unit: "kg",
    price: "",
    currency: "USD",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteProductId, setDeleteProductId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    sku: "",
    category: "",
    stock: 0,
    price: 0,
    description: "",
  });
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("name");

  const [createProduct, { loading: mutationLoading }] = useMutation(
    CREATE_PRODUCT_MUTATION,
    {
      onCompleted: (data) => {
        console.log("Producto creado:", data);
        refetch(); // Recargar la lista de productos
        setFormData({
          // Limpiar formulario
          name: "",
          category: "cereal",
          sku: "",
          stock: "",
          unit: "kg",
          price: "",
          currency: "USD",
        });
      },
      onError: (error) => {
        console.error("Error al crear producto:", error);
        if (error.networkError && error.networkError.result) {
          console.error("Detalles del error:", error.networkError.result);
          // identificador del error
          if (error.networkError.result.errors) {
            error.networkError.result.errors.forEach((err) => {
              console.error("Mensaje del backend:", err.message);
            });
          }
        }
      },
    }
  );

  const [updateProduct] = useMutation(UPDATE_PRODUCT_MUTATION, {
    onCompleted: () => {
      setEditingProduct(null);
      refetch();
    },
  });

  const [deleteProduct] = useMutation(DELETE_PRODUCT_MUTATION, {
    onCompleted: () => {
      setDeleteProductId(null);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Valores enviados al crear producto:", {
      name: formData.name,
      category: formData.category,
      sku: formData.sku,
      stock: parseFloat(formData.stock),
      unit: formData.unit,
      price: parseFloat(formData.price),
      currency: formData.currency,
    });
    createProduct({
      variables: {
        name: formData.name,
        category: formData.category,
        sku: formData.sku,
        stock: parseFloat(formData.stock),
        unit: formData.unit,
        price: parseFloat(formData.price),
        currency: formData.currency,
      },
    });
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleCategoryFilterChange = (event) => {
    setCategoryFilter(event.target.value);
  };

  const handleStockFilterChange = (event) => {
    setStockFilter(event.target.value);
  };

  const descendingComparator = (a, b, orderBy) => {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  };

  // Envuelve getComparator en useCallback para referencia estable
  const getComparator = React.useCallback(
    (order, orderBy) => {
      return order === "desc"
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
    },
    [] // No depende de nada externo
  );

  const filteredAndSortedProducts = React.useMemo(() => {
    const filtered = data?.products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && product.stock < 10) ||
        (stockFilter === "out" && product.stock === 0) ||
        (stockFilter === "available" && product.stock > 0);

      return matchesSearch && matchesCategory && matchesStock;
    });

    return filtered?.slice().sort(getComparator(order, orderBy));
  }, [
    data?.products,
    searchTerm,
    categoryFilter,
    stockFilter,
    order,
    orderBy,
    getComparator,
  ]);

  const paginatedProducts = React.useMemo(() => {
    return filteredAndSortedProducts?.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredAndSortedProducts, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      stock: product.stock,
      price: product.price,
      description: product.description || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDeleteClick = (productId) => {
    setDeleteProductId(productId);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    console.log("Valores enviados al editar producto:", {
      id: editingProduct.id,
      name: editFormData.name,
      sku: editFormData.sku,
      category: editFormData.category,
      stock: parseFloat(editFormData.stock),
      unit: editFormData.unit,
      price: parseFloat(editFormData.price),
      currency: editFormData.currency,
    });
    updateProduct({
      variables: {
        id: editingProduct.id,
        name: editFormData.name,
        sku: editFormData.sku,
        category: editFormData.category,
        stock: parseFloat(editFormData.stock),
        unit: editFormData.unit,
        price: parseFloat(editFormData.price),
        currency: editFormData.currency,
      },
    });
  };

  const handleDeleteConfirm = () => {
    deleteProduct({
      variables: {
        id: deleteProductId,
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
    const data = filteredAndSortedProducts.map((product) => ({
      SKU: product.sku,
      Nombre: product.name,
      Categoría: product.category,
      Stock: product.stock,
      Unidad: product.unit,
      Precio: product.price,
      Moneda: product.currency,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "inventario.xlsx");
    handleExportClose();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(16);
    doc.text("Reporte de Inventario", 14, 15);

    // Fecha
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 22);

    // Tabla
    const tableData = filteredAndSortedProducts.map((product) => [
      product.sku,
      product.name,
      product.category,
      product.stock,
      product.unit,
      product.price,
      product.currency,
    ]);

    doc.autoTable({
      head: [
        ["SKU", "Nombre", "Categoría", "Stock", "Unidad", "Precio", "Moneda"],
      ],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("inventario.pdf");
    handleExportClose();
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  if (error)
    return (
      <Typography color="error">
        Error al cargar los productos: {error.message}
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
        <Typography variant="h4">Gestión de Inventario</Typography>
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
        Inventario
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Nuevo Producto
        </Typography>
        {/* Formulario de creación */}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            select
            label="Categoría"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <MenuItem value="cereal">Cereal</MenuItem>
            <MenuItem value="fertilizante">Fertilizante</MenuItem>
            <MenuItem value="semilla">Semilla</MenuItem>
            <MenuItem value="otro">Otro</MenuItem>
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label="SKU"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Stock"
            name="stock"
            type="number"
            value={formData.stock}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            select
            label="Unidad"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            required
          >
            <MenuItem value="kg">Kilogramos</MenuItem>
            <MenuItem value="ton">Toneladas</MenuItem>
            <MenuItem value="unit">Unidades</MenuItem>
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label="Precio"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            select
            label="Moneda"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            required
          >
            <MenuItem value="USD">USD</MenuItem>
            <MenuItem value="ARS">ARS</MenuItem>
          </TextField>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            disabled={mutationLoading}
          >
            {mutationLoading ? "Creando producto..." : "Crear Producto"}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Listado de Productos
        </Typography>

        {/* Filtros y Búsqueda */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar productos"
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
              label="Filtrar por categoría"
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
            >
              <MenuItem value="all">Todas las categorías</MenuItem>
              <MenuItem value="cereal">Cereal</MenuItem>
              <MenuItem value="fertilizer">Fertilizante</MenuItem>
              <MenuItem value="seed">Semilla</MenuItem>
              <MenuItem value="other">Otro</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Filtrar por stock"
              value={stockFilter}
              onChange={handleStockFilterChange}
            >
              <MenuItem value="all">Todo el stock</MenuItem>
              <MenuItem value="low">Stock bajo (&lt; 10)</MenuItem>
              <MenuItem value="out">Sin stock</MenuItem>
              <MenuItem value="available">Con stock</MenuItem>
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
              Mostrando {filteredAndSortedProducts?.length} de{" "}
              {data?.products.length} productos
            </Typography>
            {data?.products?.length === 0 ? (
              <Typography color="error" sx={{ my: 2 }}>
                No hay productos para mostrar.
              </Typography>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <TableSortLabel
                            active={orderBy === "sku"}
                            direction={orderBy === "sku" ? order : "asc"}
                            onClick={() => handleRequestSort("sku")}
                          >
                            SKU
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={orderBy === "name"}
                            direction={orderBy === "name" ? order : "asc"}
                            onClick={() => handleRequestSort("name")}
                          >
                            Nombre
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={orderBy === "category"}
                            direction={orderBy === "category" ? order : "asc"}
                            onClick={() => handleRequestSort("category")}
                          >
                            Categoría
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={orderBy === "stock"}
                            direction={orderBy === "stock" ? order : "asc"}
                            onClick={() => handleRequestSort("stock")}
                          >
                            Stock
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={orderBy === "price"}
                            direction={orderBy === "price" ? order : "asc"}
                            onClick={() => handleRequestSort("price")}
                          >
                            Precio
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(paginatedProducts || []).map((product) => (
                        <TableRow
                          key={product.id}
                          sx={{
                            backgroundColor:
                              product.stock === 0
                                ? "#ffebee"
                                : product.stock < 10
                                ? "#fff3e0"
                                : "inherit",
                          }}
                        >
                          <TableCell>{product.sku}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>
                            {product.price
                              ? `${product.price.current} ${product.price.currency}`
                              : "Sin precio"}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditClick(product)}
                                  color="primary"
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(product.id)}
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
                  count={filteredAndSortedProducts?.length || 0}
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
          </>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Producto</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="SKU"
                  name="sku"
                  value={editFormData.sku}
                  onChange={handleEditChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Categoría"
                  name="category"
                  value={editFormData.category}
                  onChange={handleEditChange}
                  required
                >
                  <MenuItem value="cereal">Cereal</MenuItem>
                  <MenuItem value="fertilizer">Fertilizante</MenuItem>
                  <MenuItem value="seed">Semilla</MenuItem>
                  <MenuItem value="other">Otro</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Stock"
                  name="stock"
                  type="number"
                  value={editFormData.stock}
                  onChange={handleEditChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Unidad"
                  name="unit"
                  value={editFormData.unit}
                  onChange={handleEditChange}
                  required
                >
                  <MenuItem value="kg">Kilogramos</MenuItem>
                  <MenuItem value="ton">Toneladas</MenuItem>
                  <MenuItem value="unit">Unidades</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Precio"
                  name="price"
                  type="number"
                  value={editFormData.price}
                  onChange={handleEditChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Moneda"
                  name="currency"
                  value={editFormData.currency}
                  onChange={handleEditChange}
                  required
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="ARS">ARS</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingProduct(null)}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary">
              Guardar Cambios
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteProductId} onClose={() => setDeleteProductId(null)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar este producto? Esta acción no se
            puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteProductId(null)}>Cancelar</Button>
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

export default Inventory;
