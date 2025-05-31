import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'public', 'models', 'models-config.json');
    
    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ models: [] });
    }
    
    const configData = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData);
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error reading models config:', error);
    return NextResponse.json({ error: 'Failed to load models' }, { status: 500 });
  }
} 