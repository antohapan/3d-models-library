# 3D Models Library

A modern web application for browsing, viewing, and downloading 3D models in STL format. Built with Next.js, TypeScript, and Three.js.

## Features

- 🎯 **3D Model Viewer**: Interactive 3D visualization of STL models using Three.js
- 🖼️ **Automatic Preview Generation**: Real-time preview image generation from STL models
- 💾 **Smart Caching**: Intelligent caching system with 7-day expiry for generated previews
- 🏷️ **Tag-based Filtering**: Organize and filter models by tags
- 🔍 **Search Functionality**: Search models by name, description, or tags
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- ⬇️ **Download Support**: One-click download of STL files
- 🎨 **Modern UI**: Clean, professional interface with Tailwind CSS
- ⚡ **Performance Optimized**: Background preview generation with progress tracking

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern browser with WebGL support

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd 3d-models-library
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Preview Generation

The application features an advanced preview generation system:

### Automatic Generation
- **On-Demand**: Previews are automatically generated when viewing model cards
- **Background Processing**: Generation happens in the background without blocking the UI
- **Smart Caching**: Generated previews are cached in browser storage for 7 days
- **Error Handling**: Graceful fallback with retry options for failed generations

### Manual Management
- **Batch Generation**: Generate previews for all models at once
- **Progress Tracking**: Real-time progress indicator for batch operations
- **Cache Management**: View cache size and clear cached previews
- **Error Reporting**: Detailed error reporting for troubleshooting

### Preview Options
The preview generator supports various customization options:
- Custom camera positioning
- Adjustable lighting (ambient and directional)
- Configurable background colors
- Model color customization
- Multiple viewing angles

## Adding New Models

To add new 3D models to the library:

1. **Add STL files**: Place your STL files in the `public/models/` directory.

2. **Update configuration**: Edit `public/models/models-config.json` to include metadata for your new models:

```json
{
  "models": [
    {
      "id": "unique-model-id",
      "name": "Model Name",
      "filename": "model-file.stl",
      "path": "/models/model-file.stl",
      "tags": ["tag1", "tag2", "category"],
      "description": "Description of the model",
      "dateAdded": "2024-01-01"
    }
  ]
}
```

### Model Configuration Fields

- `id`: Unique identifier for the model (used for preview caching)
- `name`: Display name of the model
- `filename`: Name of the STL file
- `path`: Relative path to the STL file (should start with `/models/`)
- `tags`: Array of tags for filtering and categorization
- `description`: Optional description of the model
- `previewImage`: Optional URL to a custom preview image (if not provided, auto-generated)
- `size`: Optional file size in bytes
- `dateAdded`: Optional date when the model was added

## Project Structure

```
src/
├── app/
│   ├── api/models/          # API routes for model data
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx            # Main page
├── components/
│   ├── Model3DViewer.tsx    # 3D model viewer component
│   ├── ModelCard.tsx        # Model card component
│   ├── ModelFilter.tsx      # Filtering component
│   └── PreviewManager.tsx   # Preview generation management
├── hooks/
│   └── useModelPreview.ts   # React hook for preview generation
├── types/
│   └── models.ts           # TypeScript type definitions
└── utils/
    ├── stlLoader.ts        # STL file loader utility
    └── previewGenerator.ts # Preview image generation utility

public/
└── models/
    ├── models-config.json  # Models configuration
    ├── cube.stl           # Example STL files
    └── sphere.stl
```

## Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Three.js**: 3D graphics, STL rendering, and preview generation
- **Tailwind CSS**: Utility-first CSS framework
- **React**: UI component library
- **WebGL**: Hardware-accelerated 3D rendering

## Features in Detail

### 3D Viewer
- Interactive mouse controls (drag to rotate)
- Auto-rotation option
- Proper lighting and shadows
- Automatic model centering and scaling

### Preview Generation System
- **Real-time Rendering**: Uses Three.js to render STL models to canvas
- **Optimal Camera Positioning**: Automatically positions camera for best view
- **Professional Lighting**: Multi-light setup with ambient and directional lighting
- **High Quality Output**: Anti-aliased rendering with PNG compression
- **Memory Management**: Proper cleanup of Three.js resources
- **Batch Processing**: Ability to generate multiple previews efficiently

### Filtering System
- Filter by multiple tags simultaneously
- Text search across model names and descriptions
- Real-time filtering without page reloads
- Clear all filters option

### Caching System
- **Browser Storage**: Uses localStorage for client-side caching
- **Expiry Management**: Automatic cleanup of expired cache entries
- **Size Monitoring**: Track cache size and usage
- **Manual Control**: Options to clear cache manually

### Responsive Design
- Mobile-first approach
- Adaptive grid layout
- Touch-friendly controls on mobile devices

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

The project uses ESLint for code quality and follows Next.js best practices.

## Performance Considerations

### Preview Generation
- Previews are generated asynchronously to avoid blocking the UI
- Small delays between batch generations prevent browser overwhelming
- Automatic cleanup of Three.js resources prevents memory leaks
- Canvas is hidden during generation to avoid visual artifacts

### Caching Strategy
- 7-day expiry for cached previews balances freshness and performance
- Base64 encoded cache keys prevent conflicts
- Graceful degradation when localStorage is unavailable

## Browser Support

- **Chrome (recommended)**: Full support for all features
- **Firefox**: Full support for all features
- **Safari**: Full support for all features
- **Edge**: Full support for all features

**Requirements:**
- WebGL support (required for 3D rendering and preview generation)
- LocalStorage support (for preview caching)
- Canvas API support (for image generation)

## Troubleshooting

### Common Issues

1. **STL files not loading**: Make sure the files are placed in `public/models/` and the paths in `models-config.json` are correct.

2. **3D viewer not working**: Ensure WebGL is supported in your browser and that Three.js dependencies are installed correctly.

3. **Preview generation failing**: 
   - Check browser console for detailed error messages
   - Ensure STL files are valid and not corrupted
   - Verify WebGL is enabled in browser settings
   - Try clearing the preview cache

4. **Build errors**: Check that all TypeScript types are correctly defined and imported.

### Debug Mode

To enable debug mode for preview generation, open browser console and run:
```javascript
localStorage.setItem('preview_debug', 'true');
```

This will provide detailed logging during preview generation.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
