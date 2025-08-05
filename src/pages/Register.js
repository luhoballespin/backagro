import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';

const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $password: String!, $name: String!) {
    register(email: $email, password: $password, name: $name) {
      id
      email
      name
    }
  }
`;

function validateEmail(email) {
  // Validación básica de email
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [formError, setFormError] = useState('');
  const [register, { loading, error }] = useMutation(REGISTER_MUTATION, {
    onCompleted: () => navigate('/login')
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    // Validaciones
    if (!form.name.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }
    if (!validateEmail(form.email)) {
      setFormError('El correo electrónico no es válido.');
      return;
    }
    if (form.password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      await register({ variables: form });
    } catch (err) {
      // El error de GraphQL se muestra abajo
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        minWidth: '100vw',
        backgroundImage: 'url(https://www.manduvimarketing.com.br/arquivos/blog/conteudo/agromarketing-manduvi-marketing-1727796226.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: 350,
          bgcolor: 'rgba(255,255,255,0.95)',
          boxShadow: 6,
          borderRadius: 3,
          mx: 2,
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Crear cuenta
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Nombre"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Correo electrónico"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Contraseña"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            helperText="Mínimo 6 caracteres"
          />
          {formError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error.message.replace('GraphQL error: ', '')}
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            Registrarse
          </Button>
        </Box>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>
            Inicia sesión
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}

export default Register;