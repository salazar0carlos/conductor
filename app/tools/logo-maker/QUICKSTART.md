# AI Logo Maker - Quick Start Guide

Get your AI Logo Maker up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Supabase project set up
- At least one AI provider API key (OpenAI or Replicate recommended)

## Step 1: Install Dependencies

```bash
# Dependencies are already installed!
# If needed, run:
npm install
```

## Step 2: Configure Environment Variables

Create or update `.env.local`:

```bash
# Minimum required configuration
OPENAI_API_KEY=sk-proj-your-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Get API Keys:**
- **OpenAI**: https://platform.openai.com/api-keys (Recommended - $18 free credit)
- **Replicate**: https://replicate.com/account/api-tokens (Alternative - pay-as-you-go)

## Step 3: Set Up Database

Run the migration to create required tables:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy contents from supabase/migrations/create_logo_maker_tables.sql
# 3. Click "Run"
```

## Step 4: Start Development Server

```bash
npm run dev
```

## Step 5: Access the Logo Maker

Open your browser and navigate to:
```
http://localhost:3000/tools/logo-maker
```

## Your First Logo

### Using Wizard Mode (Recommended for first-time users):

1. **Step 1 - Select Model**: Choose "DALL-E 3"
   - Best quality for beginners
   - Reliable results
   - Good prompt understanding

2. **Step 2 - Design Prompt**:
   - Try this example: "Modern tech startup logo with a cloud icon"
   - Select Industry: "SaaS"
   - Select Style: "Modern"
   - Choose Colors: "Tech Gradient"

3. **Step 3 - Generate**:
   - Set Batch Size: 4 (recommended)
   - Click "Generate"
   - Wait 10-20 seconds

4. **Step 4 - Customize**:
   - Preview on different backgrounds
   - Try different export formats
   - View mockups

5. **Step 5 - Save to Brand Kit**:
   - Save your favorite logos
   - Extract color palette
   - Generate brand assets

### Using Free Mode (All tools visible):

1. Click "Free Mode" in top-right
2. Configure all settings at once:
   - Model selection
   - Prompt building
   - Generation settings
3. Click "Generate Logos"
4. View results in gallery

## Example Prompts

### Minimalist Tech Logo
```
Modern tech startup logo, abstract geometric shapes,
minimalist, clean lines, blue gradient, vector art
```

### Vintage Coffee Shop
```
Vintage coffee shop logo, retro badge style,
coffee cup icon, warm brown tones, hand-drawn feel
```

### Elegant Fashion Brand
```
Elegant luxury fashion logo, sophisticated monogram,
gold and black, refined typography, timeless
```

### Playful Kids Brand
```
Playful children's brand logo, cartoon style,
colorful, friendly mascot, rounded shapes, fun
```

## Cost Estimation

Before generating, check the cost estimate in the sidebar:

| Batch Size | DALL-E 3 | Stable Diffusion XL |
|------------|----------|---------------------|
| 1 logo     | $0.04    | $0.02              |
| 4 logos    | $0.16    | $0.08              |
| 8 logos    | $0.32    | $0.16              |
| 16 logos   | $0.64    | $0.32              |

## Tips for Best Results

### 1. Be Specific
❌ Bad: "company logo"
✅ Good: "Modern SaaS company logo with cloud icon, blue gradient, minimalist"

### 2. Use Industry Templates
Start with an industry template, then customize:
- SaaS → Modern, tech, professional
- Retail → Friendly, accessible, colorful
- Finance → Trust, security, established

### 3. Leverage Style Presets
Combine multiple styles:
- "Minimalist modern logo"
- "Vintage elegant design"
- "Bold geometric pattern"

### 4. Specify Colors
Instead of "blue", use:
- "Deep navy blue and electric blue gradient"
- "Pastel blue tones"
- "Vibrant cyan accents"

### 5. Use Negative Prompts (Advanced)
Tell the AI what to avoid:
```
Negative: photo, realistic, 3d render, blurry,
low quality, text, watermark
```

## Common Issues & Solutions

### Issue: "API key required"
**Solution**: Add your API key to `.env.local` or use "Use Your Own API Key" option

### Issue: Generation takes too long
**Solution**:
- DALL-E 3: 10-20s (normal)
- Stable Diffusion XL: 5-15s (normal)
- Midjourney: 30-60s (normal)
- Check your internet connection

### Issue: Low-quality results
**Solution**:
- Use DALL-E 3 for best quality
- Be more specific in prompts
- Add style keywords
- Use industry templates

### Issue: Can't download logo
**Solution**:
- Check browser permissions
- Try different export format
- Right-click → "Save Image As"

### Issue: Colors not matching
**Solution**:
- Specify exact hex codes in prompt
- Use color scheme selector
- Generate variations with different colors
- Use Customization Studio to preview on backgrounds

## Next Steps

Once you're comfortable with basic generation:

1. **Explore All Models**: Try different AI models for varied styles
2. **Build Brand Kit**: Save your favorite logos and generate matching assets
3. **Customize Further**: Use Customization Studio for fine-tuning
4. **Generate Assets**: Create favicons, social headers, email signatures
5. **Export Everything**: Download complete brand kit

## Advanced Features

### Using Your Own API Keys
1. Click "Use Your Own API Key" in settings
2. Enter your API key (stored locally, not on server)
3. Generate without using platform credits

### Batch Generation
1. Set batch size to 8-16
2. Generate multiple variations at once
3. Select best logos from gallery
4. Save to brand kit

### Customization Studio
1. Click any logo to open studio
2. Test on different backgrounds
3. Export in multiple formats
4. Generate mockups

### Brand Guidelines
1. Save logos to brand kit
2. Auto-extract color palette
3. Get typography suggestions
4. Download PDF guidelines

## Support

- **Documentation**: See README.md for full documentation
- **API Reference**: Check API endpoints documentation
- **Database Schema**: Review database tables and relationships
- **Troubleshooting**: Common issues and solutions

## Resources

- **OpenAI DALL-E 3**: https://platform.openai.com/docs/guides/images
- **Replicate Models**: https://replicate.com/collections/text-to-image
- **Prompt Engineering**: https://platform.openai.com/docs/guides/prompt-engineering
- **Logo Design Principles**: Research basic logo design concepts

## Pro Tips

1. **Start with batch of 4**: Good balance of variety and cost
2. **Use industry templates**: Saves time, better results
3. **Iterate on good results**: Refine prompts based on what works
4. **Save everything**: Build a collection of options
5. **Test on backgrounds**: Always preview on white and dark
6. **Export multiple formats**: PNG for web, SVG for scalability
7. **Generate complete kit**: Favicons, headers, signatures together

## Pricing (If Monetizing)

Suggested pricing tiers:

- **Free**: 5 logos/month, DALL-E 3 only, watermarked
- **Starter** ($9/month): 25 logos, all models, no watermark
- **Pro** ($29/month): 100 logos, priority generation, API access
- **Business** ($79/month): Unlimited, team features, white-label

---

**Ready to create amazing logos?** Navigate to `/tools/logo-maker` and start generating! 🎨
