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
import { exportToExcel, exportToPDF } from "../utils/clientsUtils";
import "./Clients.css"; // Importa tu CSS

const GET_CLIENTS = gql`
  query GetClients {
    clients {
      id
      name
      type
      documentType
      documentNumber
      email
      phone
      address {
        street
        city
        state
        zipCode
        country
      }
      businessInfo {
        businessName
        taxCategory
        taxStatus
      }
      creditLimit
      paymentTerms
      status
      notes
      createdAt
      updatedAt
    }
  }
`;

const CREATE_CLIENT_MUTATION = gql`
  mutation CreateClient(
    $name: String!
    $type: String!
    $documentType: String!
    $documentNumber: String!
    $email: String!
    $phone: String!
    $address: AddressInput
    $businessInfo: BusinessInfoInput
    $creditLimit: Float
    $paymentTerms: Int
  ) {
    createClient(
      name: $name
      type: $type
      documentType: $documentType
      documentNumber: $documentNumber
      email: $email
      phone: $phone
      address: $address
      businessInfo: $businessInfo
      creditLimit: $creditLimit
      paymentTerms: $paymentTerms
    ) {
      id
      name
      type
      documentNumber
    }
  }
`;

const UPDATE_CLIENT_MUTATION = gql`
  mutation UpdateClient(
    $id: ID!
    $name: String
    $email: String
    $phone: String
    $address: AddressInput
    $businessInfo: BusinessInfoInput
    $creditLimit: Float
    $paymentTerms: Int
    $status: String
  ) {
    updateClient(
      id: $id
      name: $name
      email: $email
      phone: $phone
      address: $address
      businessInfo: $businessInfo
      creditLimit: $creditLimit
      paymentTerms: $paymentTerms
      status: $status
    ) {
      id
      name
      email
      phone
      address {
        street
        city
        state
        zipCode
        country
      }
      businessInfo {
        businessName
        taxCategory
        taxStatus
      }
      creditLimit
      paymentTerms
      status
    }
  }
`;

const DELETE_CLIENT_MUTATION = gql`
  mutation DeleteClient($id: ID!) {
    deleteClient(id: $id)
  }
`;

function Clients() {
  const { loading: queryLoading, error, data, refetch } = useQuery(GET_CLIENTS);
  const [formData, setFormData] = useState({
    name: "",
    type: "individual",
    documentType: "dni",
    documentNumber: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    businessInfo: {
      businessName: "",
      taxCategory: "",
      taxStatus: "",
    },
    creditLimit: "",
    paymentTerms: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  const [orderBy, setOrderBy] = useState("name");
  const [order, setOrder] = useState("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteClientId, setDeleteClientId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    type: "",
    documentType: "",
    document: "",
    email: "",
    phone: "",
    businessInfo: {
      name: "",
      address: "",
    },
    creditLimit: "",
    paymentTerms: "",
  });
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  const [createClient, { loading: mutationLoading }] = useMutation(
    CREATE_CLIENT_MUTATION,
    {
      onCompleted: (data) => {
        refetch();
        setFormData({
          name: "",
          type: "individual",
          documentType: "dni",
          documentNumber: "",
          email: "",
          phone: "",
          address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          },
          businessInfo: {
            businessName: "",
            taxCategory: "",
            taxStatus: "",
          },
          creditLimit: "",
          paymentTerms: "",
        });
      },
      onError: (error) => {
        console.error("Error al crear cliente:", error);
      },
    }
  );

  const [updateClient] = useMutation(UPDATE_CLIENT_MUTATION, {
    onCompleted: () => {
      setEditingClient(null);
      refetch();
    },
  });

  const [deleteClient] = useMutation(DELETE_CLIENT_MUTATION, {
    onCompleted: () => {
      setDeleteClientId(null);
      refetch();
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else if (name.startsWith("businessInfo.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        businessInfo: {
          ...prev.businessInfo,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createClient({
      variables: {
        ...formData,
        address: formData.address, // siempre objeto
        businessInfo: formData.businessInfo, // siempre objeto
        creditLimit: formData.creditLimit
          ? parseFloat(formData.creditLimit)
          : null,
        paymentTerms: formData.paymentTerms
          ? parseInt(formData.paymentTerms)
          : null,
      },
    });
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleTypeFilterChange = (event) => {
    setTypeFilter(event.target.value);
  };

  const handleDocumentTypeFilterChange = (event) => {
    setDocumentTypeFilter(event.target.value);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const filteredClients = React.useMemo(() => {
    const clients = data?.clients ?? [];
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.documentNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (client.email &&
          client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.phone &&
          client.phone.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = typeFilter === "all" || client.type === typeFilter;

      const matchesDocumentType =
        documentTypeFilter === "all" ||
        client.documentType === documentTypeFilter;

      return matchesSearch && matchesType && matchesDocumentType;
    });
  }, [data, searchTerm, typeFilter, documentTypeFilter]);

  const paginatedClients = React.useMemo(() => {
    return filteredClients.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredClients, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditClick = (client) => {
    setEditingClient(client);
    setEditFormData({
      name: client.name,
      type: client.type,
      documentType: client.documentType,
      document: client.documentNumber,
      email: client.email,
      phone: client.phone,
      businessInfo: {
        name: client.businessInfo?.businessName || "",
        address: client.businessInfo?.taxId || "",
      },
      creditLimit: client.creditLimit?.toString() || "",
      paymentTerms: client.paymentTerms,
    });
  };

  const handleDeleteClick = (clientId) => {
    setDeleteClientId(clientId);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateClient({
      variables: {
        id: editingClient.id,
        name: editFormData.name,
        documentType: editFormData.documentType,
        documentNumber: editFormData.document,
        email: editFormData.email,
        phone: editFormData.phone,
        address: editFormData.address,
        businessInfo: {
          businessName: editFormData.businessInfo.businessName,
          taxCategory: editFormData.businessInfo.taxCategory,
          taxStatus: editFormData.businessInfo.taxStatus,
        },
        creditLimit: parseFloat(editFormData.creditLimit),
        paymentTerms: parseInt(editFormData.paymentTerms),
        status: editFormData.status,
      },
    });
  };

  const handleDeleteConfirm = () => {
    deleteClient({
      variables: {
        id: deleteClientId,
      },
    });
  };

  const handleExportClick = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  if (error)
    return (
      <Typography color="error">
        Error al cargar los clientes: {error.message}
      </Typography>
    );

  return (
    <Box
      className="clients-root"
      sx={{
        backgroundColor: "#f5f6fa",
        minHeight: "100vh",
        p: { xs: 1, sm: 2, md: 3 },
      }}
    >
      {/* Encabezado */}
      <Box className="clients-header">
        <Typography variant="h4">Gestión de Clientes</Typography>
        <Box>
          <Button
            variant="contained"
            onClick={handleExportClick}
            startIcon={<FileDownloadIcon />}
            className="clients-export-btn"
          >
            Exportar
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={handleExportClose}
          >
            <MenuItem
              onClick={() => {
                exportToExcel(filteredClients);
                handleExportClose();
              }}
            >
              <ExcelIcon className="clients-icon" /> Exportar a Excel
            </MenuItem>
            <MenuItem
              onClick={() => {
                exportToPDF(filteredClients);
                handleExportClose();
              }}
            >
              <PdfIcon className="clients-icon" /> Exportar a PDF
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Typography variant="h4" gutterBottom>
        Clientes
      </Typography>

      {/* Formulario Nuevo Cliente */}
      <Paper className="clients-form">
        <Typography variant="h6" gutterBottom>
          Nuevo Cliente
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Tipo"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <MenuItem value="individual">Individual</MenuItem>
                <MenuItem value="business">Empresa</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Tipo de Documento"
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                required
              >
                <MenuItem value="dni">DNI</MenuItem>
                <MenuItem value="cuit">CUIT</MenuItem>
                <MenuItem value="passport">Pasaporte</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Documento"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>
            {/* Dirección */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Dirección
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Calle"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ciudad"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Estado"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Código Postal"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="País"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
              />
            </Grid>
            {/* Solo para empresas */}
            {formData.type === "business" && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    Información de Negocio
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre de la Empresa"
                    name="businessInfo.businessName"
                    value={formData.businessInfo.businessName}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Categoría Impositiva"
                    name="businessInfo.taxCategory"
                    value={formData.businessInfo.taxCategory}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Estado Impositivo"
                    name="businessInfo.taxStatus"
                    value={formData.businessInfo.taxStatus}
                    onChange={handleChange}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Límite de Crédito"
                name="creditLimit"
                type="number"
                value={formData.creditLimit}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Plazo de Pago (días)"
                name="paymentTerms"
                type="number"
                value={formData.paymentTerms}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                fullWidth
                disabled={mutationLoading}
              >
                {mutationLoading ? "Creando cliente..." : "Crear Cliente"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Listado de Clientes */}
      <Paper className="clients-table-paper">
        <Typography variant="h6" gutterBottom>
          Listado de Clientes
        </Typography>
        <Grid container spacing={2} className="clients-filters">
          {/* Filtros y Búsqueda */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar clientes"
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
              label="Filtrar por tipo"
              value={typeFilter}
              onChange={handleTypeFilterChange}
            >
              <MenuItem value="all">Todos los tipos</MenuItem>
              <MenuItem value="individual">Individual</MenuItem>
              <MenuItem value="business">Empresa</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Filtrar por documento"
              value={documentTypeFilter}
              onChange={handleDocumentTypeFilterChange}
            >
              <MenuItem value="all">Todos los documentos</MenuItem>
              <MenuItem value="dni">DNI</MenuItem>
              <MenuItem value="cuit">CUIT</MenuItem>
              <MenuItem value="passport">Pasaporte</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        {queryLoading ? (
          <Box className="clients-loading">
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography
              variant="body2"
              color="textSecondary"
              className="clients-count"
            >
              Mostrando {filteredClients?.length} de {data?.clients.length}{" "}
              clientes
            </Typography>
            <TableContainer className="clients-table-container">
              <Table>
                <TableHead>
                  <TableRow>
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
                        active={orderBy === "type"}
                        direction={orderBy === "type" ? order : "asc"}
                        onClick={() => handleRequestSort("type")}
                      >
                        Tipo
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "documentNumber"}
                        direction={orderBy === "documentNumber" ? order : "asc"}
                        onClick={() => handleRequestSort("documentNumber")}
                      >
                        Documento
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "email"}
                        direction={orderBy === "email" ? order : "asc"}
                        onClick={() => handleRequestSort("email")}
                      >
                        Email
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Dirección</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "businessInfo"}
                        direction={orderBy === "businessInfo" ? order : "asc"}
                        onClick={() => handleRequestSort("businessInfo")}
                      >
                        Información Empresarial
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "creditLimit"}
                        direction={orderBy === "creditLimit" ? order : "asc"}
                        onClick={() => handleRequestSort("creditLimit")}
                      >
                        Límite de Crédito
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "paymentTerms"}
                        direction={orderBy === "paymentTerms" ? order : "asc"}
                        onClick={() => handleRequestSort("paymentTerms")}
                      >
                        Plazo de Pago
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedClients?.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>
                        {client.type === "individual"
                          ? "Individual"
                          : "Empresa"}
                      </TableCell>
                      <TableCell>{`${client.documentType.toUpperCase()}: ${
                        client.documentNumber
                      }`}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>
                        {client.address
                          ? `${client.address.street}, ${client.address.city}, ${client.address.state}, ${client.address.zipCode}, ${client.address.country}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {client.businessInfo
                          ? `${client.businessInfo.businessName} (${client.businessInfo.taxCategory} - ${client.businessInfo.taxStatus})`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {client.creditLimit ? `$${client.creditLimit}` : "-"}
                      </TableCell>
                      <TableCell>
                        {client.paymentTerms
                          ? `${client.paymentTerms} días`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(client)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(client.id)}
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
              count={filteredClients?.length || 0}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
              className="clients-pagination"
            />
          </>
        )}
      </Paper>

      {/* Diálogos de edición y eliminación */}
      {/* Edit Dialog */}
      <Dialog
        open={!!editingClient}
        onClose={() => setEditingClient(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Cliente</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Tipo"
                  value={editFormData.type}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, type: e.target.value })
                  }
                  required
                >
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="business">Empresa</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Tipo de Documento"
                  value={editFormData.documentType}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      documentType: e.target.value,
                    })
                  }
                  required
                >
                  <MenuItem value="dni">DNI</MenuItem>
                  <MenuItem value="ruc">RUC</MenuItem>
                  <MenuItem value="passport">Pasaporte</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Número de Documento"
                  value={editFormData.document}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      document: e.target.value,
                    })
                  }
                  required
                >
                  <MenuItem value="dni">DNI</MenuItem>
                  <MenuItem value="ruc">RUC</MenuItem>
                  <MenuItem value="passport">Pasaporte</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Número de Documento"
                  value={editFormData.document}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      document: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      email: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={editFormData.phone}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      phone: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Información de Negocio
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre del Negocio"
                  value={editFormData.businessInfo.name}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      businessInfo: {
                        ...editFormData.businessInfo,
                        name: e.target.value,
                      },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={editFormData.businessInfo.address}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      businessInfo: {
                        ...editFormData.businessInfo,
                        address: e.target.value,
                      },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Límite de Crédito"
                  type="number"
                  value={editFormData.creditLimit}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      creditLimit: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Términos de Pago"
                  value={editFormData.paymentTerms}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      paymentTerms: e.target.value,
                    })
                  }
                  required
                >
                  <MenuItem value={0}>Inmediato</MenuItem>
                  <MenuItem value={15}>15 días</MenuItem>
                  <MenuItem value={30}>30 días</MenuItem>
                  <MenuItem value={60}>60 días</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingClient(null)}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary">
              Guardar Cambios
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteClientId} onClose={() => setDeleteClientId(null)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar este cliente? Esta acción no se
            puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteClientId(null)}>Cancelar</Button>
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

export default Clients;
