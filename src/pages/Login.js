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

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState('');
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION, {
    onCompleted: ({ login }) => {
      localStorage.setItem('token', login.token);
      navigate('/dashboard');
    },
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(form.email)) {
      setFormError('El correo electrónico no es válido.');
      return;
    }
    if (!form.password) {
      setFormError('La contraseña es obligatoria.');
      return;
    }
    try {
      await login({ variables: form });
    } catch (err) {
      // El error de GraphQL se muestra abajo
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        minWidth: '100vw',
        backgroundImage:
          'url(https://www.manduvimarketing.com.br/arquivos/blog/conteudo/agromarketing-manduvi-marketing-1727796226.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: 4,
          width: 350,
          bgcolor: 'rgba(255,255,255,0.95)',
          boxShadow: 6,
          borderRadius: 3,
          mx: 2, // margen horizontal para separar del borde en pantallas pequeñas
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Iniciar sesión
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
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
            Ingresar
          </Button>
        </Box>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          ¿No tienes cuenta?{' '}
          <Link
            to="/register"
            style={{ color: '#1976d2', textDecoration: 'none' }}
          >
            Regístrate aquí
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}

export default Login;