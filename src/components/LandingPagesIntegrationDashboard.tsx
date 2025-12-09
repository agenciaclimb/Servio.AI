import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Typography,
  MenuItem,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Analytics as AnalyticsIcon,
  Rocket as RocketIcon,
  AutoFixHigh as AutoFixHighIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

/**
 * Landing Pages Generator Dashboard
 * 
 * Interface para criar, editar e gerenciar landing pages com IA Gemini
 * Funcionalidades:
 * - Geração automática com IA
 * - A/B testing
 * - Analytics integrado
 * - Deploy automático
 * 
 * @component
 */
const LandingPagesIntegrationDashboard = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dialog para gerar nova página
  const [generateDialog, setGenerateDialog] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    serviceName: '',
    serviceType: 'consultoria',
    description: '',
    targetAudience: '',
    ctaText: 'Solicitar Orçamento',
  });

  // Dialog para visualizar analytics
  const [analyticsDialog, setAnalyticsDialog] = useState(false);
  const [selectedPageAnalytics, setSelectedPageAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Dialog para criar variante A/B
  const [variantDialog, setVariantDialog] = useState(false);
  const [selectedPageForVariant, setSelectedPageForVariant] = useState(null);
  const [variantForm, setVariantForm] = useState({
    headline: '',
    subheadline: '',
    ctaText: '',
  });

  const serviceTypes = [
    { value: 'consultoria', label: '📊 Consultoria' },
    { value: 'design', label: '🎨 Design' },
    { value: 'desenvolvimento', label: '💻 Desenvolvimento' },
    { value: 'marketing', label: '📱 Marketing' },
    { value: 'vendas', label: '💼 Vendas' },
    { value: 'educacao', label: '📚 Educação' },
    { value: 'saude', label: '⚕️ Saúde' },
    { value: 'ecommerce', label: '🛍️ E-commerce' },
  ];

  // Carregar páginas
  useEffect(() => {
    loadPages();
  }, [user]);

  const loadPages = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/landing-pages', {
        headers: {
          'x-user-email': user.email,
        },
      });

      if (!response.ok) throw new Error('Failed to load pages');

      const data = await response.json();
      setPages(data.pages || []);
    } catch (err) {
      setError(err.message);
      console.error('Load pages error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePage = async () => {
    if (!generateForm.serviceName || !generateForm.description || !generateForm.targetAudience) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/landing-pages/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email,
        },
        body: JSON.stringify(generateForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate page');
      }

      const data = await response.json();
      setSuccess('Landing page gerada com sucesso! 🎉');
      setGenerateDialog(false);
      setGenerateForm({
        serviceName: '',
        serviceType: 'consultoria',
        description: '',
        targetAudience: '',
        ctaText: 'Solicitar Orçamento',
      });

      // Recarrega lista
      await loadPages();
    } catch (err) {
      setError(err.message);
      console.error('Generate error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishPage = async (pageId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/landing-pages/${pageId}/publish`, {
        method: 'POST',
        headers: {
          'x-user-email': user.email,
        },
      });

      if (!response.ok) throw new Error('Failed to publish page');

      const data = await response.json();
      setSuccess(`Página publicada! 🚀\nURL: ${data.url}`);
      await loadPages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalytics = async (pageId) => {
    try {
      setAnalyticsLoading(true);
      setError(null);

      const response = await fetch(`/api/landing-pages/${pageId}/analytics`, {
        headers: {
          'x-user-email': user.email,
        },
      });

      if (!response.ok) throw new Error('Failed to load analytics');

      const data = await response.json();
      setSelectedPageAnalytics(data);
      setAnalyticsDialog(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCreateVariant = async () => {
    if (!generateForm.headline && !generateForm.ctaText && !generateForm.subheadline) {
      setError('Selecione pelo menos uma modificação');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/landing-pages/${selectedPageForVariant}/variant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email,
        },
        body: JSON.stringify(variantForm),
      });

      if (!response.ok) throw new Error('Failed to create variant');

      const data = await response.json();
      setSuccess(`Variante criada! 📊\nURL: ${data.url}`);
      setVariantDialog(false);
      setVariantForm({
        headline: '',
        subheadline: '',
        ctaText: '',
      });
      await loadPages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta página?')) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/landing-pages/${pageId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': user.email,
        },
      });

      if (!response.ok) throw new Error('Failed to delete page');

      setSuccess('Página deletada');
      await loadPages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = (pageId) => {
    const url = `https://landing.servio.ai/${pageId}`;
    navigator.clipboard.writeText(url);
    setSuccess('URL copiada para clipboard! 📋');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          🎨 Landing Pages Generator
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Crie landing pages profissionais com IA Gemini em segundos
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: '1px solid #e0e0e0' }}
        >
          <Tab label="📄 Minhas Páginas" />
          <Tab label="➕ Gerar Nova" />
          <Tab label="📊 Performance" />
        </Tabs>
      </Paper>

      {/* Tab 1: Lista de Páginas */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Suas Landing Pages ({pages.length})</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setGenerateDialog(true)}
              >
                Gerar Nova Página
              </Button>
            </Box>

            {loading ? (
              <CircularProgress sx={{ my: 4 }} />
            ) : pages.length === 0 ? (
              <Alert severity="info">
                Nenhuma landing page criada ainda. Clique em "Gerar Nova Página" para começar!
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Nome</strong></TableCell>
                      <TableCell><strong>Tipo</strong></TableCell>
                      <TableCell align="center"><strong>Status</strong></TableCell>
                      <TableCell align="center"><strong>Views</strong></TableCell>
                      <TableCell align="center"><strong>Conversões</strong></TableCell>
                      <TableCell align="center"><strong>Taxa</strong></TableCell>
                      <TableCell align="center"><strong>Ações</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pages.map((page) => (
                      <TableRow key={page.id} hover>
                        <TableCell>{page.serviceName}</TableCell>
                        <TableCell>
                          <Chip
                            label={page.serviceType}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={page.status || 'draft'}
                            size="small"
                            color={page.status === 'published' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="center">{page.views || 0}</TableCell>
                        <TableCell align="center">{page.conversions || 0}</TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ color: '#2196F3', fontWeight: 'bold' }}>
                            {page.conversionRate || 0}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Visualizar">
                            <IconButton
                              size="small"
                              onClick={() => window.open(`/api/landing-pages/${page.id}/html`)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Analytics">
                            <IconButton
                              size="small"
                              onClick={() => handleViewAnalytics(page.id)}
                            >
                              <AnalyticsIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="A/B Test">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedPageForVariant(page.id);
                                setVariantDialog(true);
                              }}
                            >
                              <AutoFixHighIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copiar URL">
                            <IconButton
                              size="small"
                              onClick={() => handleCopyUrl(page.id)}
                            >
                              <ShareIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {page.status !== 'published' && (
                            <Tooltip title="Publicar">
                              <IconButton
                                size="small"
                                onClick={() => handlePublishPage(page.id)}
                                sx={{ color: '#FF9800' }}
                              >
                                <RocketIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Deletar">
                            <IconButton
                              size="small"
                              onClick={() => handleDeletePage(page.id)}
                              sx={{ color: '#F44336' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Gerar Nova Página */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Criar Nova Landing Page com IA
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome do Serviço"
                  placeholder="Ex: Consultoria de Marketing Digital"
                  value={generateForm.serviceName}
                  onChange={(e) => setGenerateForm({ ...generateForm, serviceName: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Tipo de Serviço"
                  value={generateForm.serviceType}
                  onChange={(e) => setGenerateForm({ ...generateForm, serviceType: e.target.value })}
                >
                  {serviceTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Descrição Detalhada"
                  placeholder="Descreva o serviço, benefícios, diferenciais..."
                  value={generateForm.description}
                  onChange={(e) => setGenerateForm({ ...generateForm, description: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Público-Alvo"
                  placeholder="Ex: Pequenas e médias empresas de tecnologia"
                  value={generateForm.targetAudience}
                  onChange={(e) => setGenerateForm({ ...generateForm, targetAudience: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Texto do Botão CTA"
                  value={generateForm.ctaText}
                  onChange={(e) => setGenerateForm({ ...generateForm, ctaText: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleGeneratePage}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AutoFixHighIcon />}
                  >
                    {loading ? 'Gerando...' : 'Gerar Landing Page com IA'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Performance */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              📊 Performance das Páginas
            </Typography>

            {pages.length === 0 ? (
              <Alert severity="info">
                Nenhuma página para analisar. Crie sua primeira landing page!
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {pages.map((page) => (
                  <Grid item xs={12} key={page.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={3}>
                            <Typography variant="subtitle2" color="textSecondary">
                              {page.serviceName}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                Conversão
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(page.conversionRate || 0, 100)}
                                sx={{ mt: 0.5 }}
                              />
                              <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 'bold' }}>
                                {page.conversionRate || 0}%
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Typography variant="body2">
                              👁️ {page.views || 0} views<br/>
                              ✅ {page.conversions || 0} conversões
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={3} sx={{ textAlign: 'right' }}>
                            <Button
                              size="small"
                              onClick={() => handleViewAnalytics(page.id)}
                              endIcon={<AnalyticsIcon />}
                            >
                              Detalhes
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog: Gerar Página */}
      <Dialog open={generateDialog} onClose={() => setGenerateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Gerar Nova Landing Page</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            A IA Gemini vai gerar uma landing page completa, otimizada para conversão!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialog(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Analytics */}
      <Dialog open={analyticsDialog} onClose={() => setAnalyticsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>📊 Analytics - {selectedPageAnalytics?.pageName}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {analyticsLoading ? (
            <CircularProgress />
          ) : selectedPageAnalytics ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Views (Total)
                    </Typography>
                    <Typography variant="h4">
                      {selectedPageAnalytics.metrics.totalViews}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Conversões (Total)
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#4CAF50' }}>
                      {selectedPageAnalytics.metrics.totalConversions}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Taxa de Conversão
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#2196F3' }}>
                      {selectedPageAnalytics.metrics.conversionRate}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      SEO Score
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#FF9800' }}>
                      {selectedPageAnalytics.seoScore}/100
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyticsDialog(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Criar Variante A/B */}
      <Dialog open={variantDialog} onClose={() => setVariantDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📊 Criar Variante A/B</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Modifique elementos para testar diferentes versões
          </Typography>
          <TextField
            fullWidth
            label="Novo Headline"
            placeholder="Deixe em branco para não alterar"
            value={variantForm.headline}
            onChange={(e) => setVariantForm({ ...variantForm, headline: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Novo Subheadline"
            placeholder="Deixe em branco para não alterar"
            value={variantForm.subheadline}
            onChange={(e) => setVariantForm({ ...variantForm, subheadline: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Novo CTA Text"
            placeholder="Deixe em branco para não alterar"
            value={variantForm.ctaText}
            onChange={(e) => setVariantForm({ ...variantForm, ctaText: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVariantDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreateVariant}
            disabled={loading}
          >
            Criar Variante
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LandingPagesIntegrationDashboard;
