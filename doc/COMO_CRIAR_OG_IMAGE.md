# Como Criar og-image.jpg para Open Graph

## Opção 1: Converter o SVG (Recomendado)

1. **Online (Grátis):**
   - Acesse: https://svgtopng.com/
   - Upload `public/og-image.svg`
   - Configure: Width 1200px, Height 630px
   - Export como PNG ou JPG (qualidade 85%)
   - Salve como `public/og-image.jpg`

2. **Inkscape (Offline):**

   ```bash
   inkscape --export-filename=public/og-image.jpg \
            --export-width=1200 \
            --export-height=630 \
            public/og-image.svg
   ```

3. **ImageMagick:**
   ```bash
   convert public/og-image.svg -resize 1200x630! public/og-image.jpg
   ```

## Opção 2: Criar no Canva (Mais personalizado)

1. Acesse: https://www.canva.com/
2. Criar design → Dimensões personalizadas → 1200x630px
3. Template sugerido:
   - Fundo: Gradient azul (#2563eb → #1e40af)
   - Logo: "SERVIO.AI" (fonte bold, branco, 120px)
   - Badge: "BETA" (fundo branco, texto azul)
   - Tagline: "Conectando você aos melhores profissionais" (42px)
   - Icons: Adicionar ícones de IA, serviços, pagamento
4. Download como JPG (qualidade máxima)
5. Salve como `public/og-image.jpg`

## Opção 3: Usar Figma

1. Figma → Novo frame → 1200x630px
2. Importar design do Servio.AI (se existir)
3. Export → JPG → 2x quality
4. Salve como `public/og-image.jpg`

## Após criar a imagem:

1. Coloque em `public/og-image.jpg`
2. Atualize `SEOMetaTags.tsx` se necessário (já está configurado para usar `/og-image.jpg`)
3. Teste com: https://www.opengraph.xyz/ ou https://metatags.io/

## Especificações Recomendadas:

- **Dimensões:** 1200x630px (ratio 1.91:1)
- **Formato:** JPG ou PNG
- **Tamanho:** < 300KB (idealmente < 100KB)
- **Conteúdo:**
  - Logo SERVIO.AI
  - Badge BETA
  - Tagline principal
  - Background atraente (gradient azul)
  - Mínimo de texto (máximo 3 linhas)

## Teste Final:

Valide com Facebook Debugger:

- https://developers.facebook.com/tools/debug/
- Cole: https://servio.ai
- Clique "Scrape Again"
- Verifique preview da imagem
