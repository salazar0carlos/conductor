import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LOGO_MODELS, LogoGenerationRequest, GeneratedLogo } from '@/lib/ai/logo-models';
import { z } from 'zod';

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  model: z.enum(['dalle-3', 'midjourney', 'stable-diffusion-xl', 'ideogram', 'leonardo']),
  prompt: z.string().min(1),
  negativePrompt: z.string().optional(),
  style: z.string().optional(),
  colorScheme: z.array(z.string()).optional(),
  industry: z.string().optional(),
  aspectRatio: z.string().optional(),
  batchSize: z.number().min(1).max(16).optional(),
  userApiKey: z.string().optional()
});

/**
 * Generate logo using DALL-E 3 (OpenAI)
 */
async function generateWithDallE3(request: LogoGenerationRequest, apiKey: string) {
  const startTime = Date.now();

  // Build enhanced prompt
  let fullPrompt = `Professional logo design: ${request.prompt}`;
  if (request.style) fullPrompt += `, ${request.style} style`;
  if (request.industry) fullPrompt += `, for ${request.industry} industry`;
  if (request.colorScheme && request.colorScheme.length > 0) {
    fullPrompt += `, using colors ${request.colorScheme.join(', ')}`;
  }
  fullPrompt += ', vector art, clean design, white background, high quality';

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'vivid'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'DALL-E 3 generation failed');
  }

  const data = await response.json();
  const generationTime = Date.now() - startTime;

  const logos: GeneratedLogo[] = data.data.map((img: any, index: number) => ({
    id: `dalle3-${Date.now()}-${index}`,
    url: img.url,
    prompt: fullPrompt,
    model: 'dalle-3',
    metadata: {
      resolution: '1024x1024',
      aspectRatio: '1:1',
      style: request.style,
      colorPalette: request.colorScheme
    },
    createdAt: new Date().toISOString()
  }));

  return { logos, generationTime };
}

/**
 * Generate logo using Stable Diffusion XL (Replicate)
 */
async function generateWithSDXL(request: LogoGenerationRequest, apiKey: string) {
  const startTime = Date.now();

  // Build prompt
  let fullPrompt = `professional logo design, ${request.prompt}`;
  if (request.style) fullPrompt += `, ${request.style} style`;
  if (request.industry) fullPrompt += `, ${request.industry}`;
  fullPrompt += ', vector art, clean, minimalist, white background, 8k, high quality';

  const negativePrompt = request.negativePrompt ||
    'photo, photograph, realistic, 3d render, lowres, bad quality, blurry, noise';

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${apiKey}`
    },
    body: JSON.stringify({
      version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      input: {
        prompt: fullPrompt,
        negative_prompt: negativePrompt,
        width: 1024,
        height: 1024,
        num_outputs: request.batchSize || 1,
        guidance_scale: 7.5,
        num_inference_steps: 50
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'SDXL generation failed');
  }

  const prediction = await response.json();

  // Poll for completion (simplified - in production, use webhooks)
  let result = prediction;
  while (result.status === 'starting' || result.status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pollResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${result.id}`,
      {
        headers: {
          'Authorization': `Token ${apiKey}`
        }
      }
    );
    result = await pollResponse.json();
  }

  if (result.status === 'failed') {
    throw new Error('SDXL generation failed');
  }

  const generationTime = Date.now() - startTime;

  const logos: GeneratedLogo[] = (result.output || []).map((url: string, index: number) => ({
    id: `sdxl-${Date.now()}-${index}`,
    url,
    prompt: fullPrompt,
    model: 'stable-diffusion-xl',
    metadata: {
      resolution: '1024x1024',
      aspectRatio: request.aspectRatio || '1:1',
      style: request.style,
      colorPalette: request.colorScheme
    },
    createdAt: new Date().toISOString()
  }));

  return { logos, generationTime };
}

/**
 * Placeholder for other models (to be implemented with actual API keys)
 */
async function generatePlaceholder(request: LogoGenerationRequest, modelName: string) {
  // For demo purposes, return mock data
  const logos: GeneratedLogo[] = [{
    id: `${request.model}-${Date.now()}`,
    url: `https://placehold.co/1024x1024/667EEA/FFFFFF?text=${modelName}+Logo`,
    prompt: request.prompt,
    model: request.model,
    metadata: {
      resolution: '1024x1024',
      aspectRatio: '1:1',
      style: request.style,
      colorPalette: request.colorScheme
    },
    createdAt: new Date().toISOString()
  }];

  return { logos, generationTime: 1000 };
}

/**
 * POST /api/ai/generate-logo
 * Generate logo using selected AI model
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedRequest = requestSchema.parse(body) as LogoGenerationRequest;

    // Get model configuration
    const modelConfig = LOGO_MODELS[validatedRequest.model];
    if (!modelConfig) {
      return NextResponse.json(
        { success: false, error: 'Invalid model selected' },
        { status: 400 }
      );
    }

    // Check for API key (use user's key or system key)
    const apiKey = validatedRequest.userApiKey ||
      (validatedRequest.model === 'dalle-3'
        ? process.env.OPENAI_API_KEY
        : process.env.REPLICATE_API_KEY);

    if (!apiKey && validatedRequest.model !== 'midjourney') {
      return NextResponse.json(
        {
          success: false,
          error: `API key required for ${modelConfig.name}. Please provide your own API key.`
        },
        { status: 400 }
      );
    }

    // Generate logo based on model
    let result;
    switch (validatedRequest.model) {
      case 'dalle-3':
        result = await generateWithDallE3(validatedRequest, apiKey!);
        break;

      case 'stable-diffusion-xl':
        result = await generateWithSDXL(validatedRequest, apiKey!);
        break;

      case 'midjourney':
        // Midjourney API implementation (requires Discord bot or official API)
        result = await generatePlaceholder(validatedRequest, 'Midjourney');
        break;

      case 'ideogram':
        // Ideogram API implementation
        result = await generatePlaceholder(validatedRequest, 'Ideogram');
        break;

      case 'leonardo':
        // Leonardo.ai API implementation
        result = await generatePlaceholder(validatedRequest, 'Leonardo');
        break;

      default:
        throw new Error('Model not implemented');
    }

    // Calculate cost
    const cost = (validatedRequest.batchSize || 1) * modelConfig.pricing.perImage;

    // Save to database (optional - requires user authentication)
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        for (const logo of result.logos) {
          await supabase.from('generated_logos').insert({
            user_id: user.id,
            logo_id: logo.id,
            url: logo.url,
            prompt: logo.prompt,
            model: logo.model,
            metadata: logo.metadata,
            cost: cost / result.logos.length
          });
        }
      }
    } catch (dbError) {
      console.error('Failed to save to database:', dbError);
      // Continue anyway - generation succeeded
    }

    return NextResponse.json({
      success: true,
      images: result.logos,
      cost,
      generationTime: result.generationTime,
      model: validatedRequest.model
    });

  } catch (error) {
    console.error('Logo generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Logo generation failed'
      },
      { status: 500 }
    );
  }
}
