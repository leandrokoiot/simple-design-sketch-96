
import { Artboard } from "./projectState";

export interface ArtboardTemplate {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  backgroundColor?: string;
  description?: string;
  isCustom?: boolean;
}

export const defaultArtboardTemplates: ArtboardTemplate[] = [
  // Print Templates
  {
    id: 'a4-portrait',
    name: 'A4 Portrait',
    category: 'Print',
    width: 595,
    height: 842,
    backgroundColor: '#ffffff',
    description: '21 x 29.7 cm'
  },
  {
    id: 'a4-landscape',
    name: 'A4 Landscape',
    category: 'Print',
    width: 842,
    height: 595,
    backgroundColor: '#ffffff',
    description: '29.7 x 21 cm'
  },
  {
    id: 'a3-portrait',
    name: 'A3 Portrait',
    category: 'Print',
    width: 842,
    height: 1191,
    backgroundColor: '#ffffff',
    description: '29.7 x 42 cm'
  },

  // Digital Templates
  {
    id: 'hd-video',
    name: 'HD Video',
    category: 'Digital',
    width: 1920,
    height: 1080,
    backgroundColor: '#000000',
    description: '1920 x 1080 px'
  },
  {
    id: '4k-video',
    name: '4K Video',
    category: 'Digital',
    width: 3840,
    height: 2160,
    backgroundColor: '#000000',
    description: '3840 x 2160 px'
  },

  // Social Media Templates
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    category: 'Social Media',
    width: 1080,
    height: 1080,
    backgroundColor: '#ffffff',
    description: '1080 x 1080 px'
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    category: 'Social Media',
    width: 1080,
    height: 1920,
    backgroundColor: '#ffffff',
    description: '1080 x 1920 px'
  },
  {
    id: 'facebook-cover',
    name: 'Facebook Cover',
    category: 'Social Media',
    width: 1200,
    height: 630,
    backgroundColor: '#4267B2',
    description: '1200 x 630 px'
  },
  {
    id: 'twitter-header',
    name: 'Twitter Header',
    category: 'Social Media',
    width: 1500,
    height: 500,
    backgroundColor: '#1DA1F2',
    description: '1500 x 500 px'
  },

  // Web Templates
  {
    id: 'desktop-fullhd',
    name: 'Desktop Full HD',
    category: 'Web',
    width: 1920,
    height: 1080,
    backgroundColor: '#f8f9fa',
    description: '1920 x 1080 px'
  },
  {
    id: 'tablet-portrait',
    name: 'Tablet Portrait',
    category: 'Web',
    width: 768,
    height: 1024,
    backgroundColor: '#ffffff',
    description: '768 x 1024 px'
  },
  {
    id: 'mobile-portrait',
    name: 'Mobile Portrait',
    category: 'Web',
    width: 375,
    height: 667,
    backgroundColor: '#ffffff',
    description: '375 x 667 px'
  },

  // Custom
  {
    id: 'custom',
    name: 'Custom Size',
    category: 'Custom',
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    description: 'Tamanho personalizado'
  }
];

export const getTemplatesByCategory = (category?: string): ArtboardTemplate[] => {
  if (!category) return defaultArtboardTemplates;
  return defaultArtboardTemplates.filter(template => template.category === category);
};

export const getTemplateById = (id: string): ArtboardTemplate | null => {
  return defaultArtboardTemplates.find(template => template.id === id) || null;
};

export const createArtboardFromTemplate = (
  template: ArtboardTemplate,
  customName?: string,
  position?: { x: number; y: number }
): Omit<Artboard, 'id'> => {
  return {
    name: customName || template.name,
    width: template.width,
    height: template.height,
    x: position?.x || 100,
    y: position?.y || 100,
    backgroundColor: template.backgroundColor || '#ffffff',
    isActive: true,
    elementIds: []
  };
};

export const saveCustomTemplate = (artboard: Artboard): ArtboardTemplate => {
  return {
    id: `custom-${Date.now()}`,
    name: artboard.name,
    category: 'Custom',
    width: artboard.width,
    height: artboard.height,
    backgroundColor: artboard.backgroundColor,
    description: `${artboard.width} x ${artboard.height} px`,
    isCustom: true
  };
};
