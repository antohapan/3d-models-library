import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Interface for model in configuration file (without path)
interface ModelConfig {
  id: string;
  name: string;
  filename: string;
  tags: string[];
  description?: string;
  size?: number;
  dateAdded?: string;
}

// Interface for API response model (with path)
interface ModelWithPath extends ModelConfig {
  path: string;
}

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'public', 'models', 'models-config.json');
    
    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ models: [] });
    }
    
    const configData = fs.readFileSync(configPath, 'utf-8');
    const config: { models: ModelConfig[] } = JSON.parse(configData);
    
    // Automatically add path field based on filename
    if (config.models) {
      const modelsWithPath: ModelWithPath[] = config.models.map((model: ModelConfig) => ({
        ...model,
        path: `/models/${model.filename}`
      }));
      
      return NextResponse.json({ models: modelsWithPath });
    }
    
    return NextResponse.json({ models: [] });
  } catch (error) {
    console.error('Error reading models config:', error);
    return NextResponse.json({ error: 'Failed to load models' }, { status: 500 });
  }
} 