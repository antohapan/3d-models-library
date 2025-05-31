export interface Model3D {
  id: string;
  name: string;
  filename: string;
  path: string;
  tags: string[];
  description?: string;
  previewImage?: string;
  size?: number; // file size in bytes
  dateAdded?: string;
}

export interface ModelFilter {
  tags: string[];
  searchTerm: string;
} 