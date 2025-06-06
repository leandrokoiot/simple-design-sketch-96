
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
  tags?: string[];
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
    description: '21 x 29.7 cm',
    tags: ['document', 'letter']
  },
  {
    id: 'a4-landscape',
    name: 'A4 Landscape',
    category: 'Print',
    width: 842,
    height: 595,
    backgroundColor: '#ffffff',
    description: '29.7 x 21 cm',
    tags: ['document', 'presentation']
  },
  {
    id: 'a3-portrait',
    name: 'A3 Portrait',
    category: 'Print',
    width: 842,
    height: 1191,
    backgroundColor: '#ffffff',
    description: '29.7 x 42 cm',
    tags: ['poster', 'large']
  },
  {
    id: 'letter-portrait',
    name: 'US Letter Portrait',
    category: 'Print',
    width: 612,
    height: 792,
    backgroundColor: '#ffffff',
    description: '8.5 x 11 in',
    tags: ['document', 'us']
  },
  {
    id: 'business-card',
    name: 'Business Card',
    category: 'Print',
    width: 252,
    height: 144,
    backgroundColor: '#ffffff',
    description: '3.5 x 2 in',
    tags: ['card', 'small']
  },

  // Digital Templates
  {
    id: 'hd-video',
    name: 'HD Video',
    category: 'Digital',
    width: 1920,
    height: 1080,
    backgroundColor: '#000000',
    description: '1920 x 1080 px',
    tags: ['video', 'youtube']
  },
  {
    id: '4k-video',
    name: '4K Video',
    category: 'Digital',
    width: 3840,
    height: 2160,
    backgroundColor: '#000000',
    description: '3840 x 2160 px',
    tags: ['video', 'uhd']
  },
  {
    id: 'presentation-16-9',
    name: 'Presentation 16:9',
    category: 'Digital',
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff',
    description: '1920 x 1080 px',
    tags: ['presentation', 'slides']
  },
  {
    id: 'presentation-4-3',
    name: 'Presentation 4:3',
    category: 'Digital',
    width: 1024,
    height: 768,
    backgroundColor: '#ffffff',
    description: '1024 x 768 px',
    tags: ['presentation', 'classic']
  },

  // Social Media Templates
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    category: 'Social Media',
    width: 1080,
    height: 1080,
    backgroundColor: '#ffffff',
    description: '1080 x 1080 px',
    tags: ['instagram', 'square']
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    category: 'Social Media',
    width: 1080,
    height: 1920,
    backgroundColor: '#ffffff',
    description: '1080 x 1920 px',
    tags: ['instagram', 'vertical']
  },
  {
    id: 'instagram-reel',
    name: 'Instagram Reel',
    category: 'Social Media',
    width: 1080,
    height: 1920,
    backgroundColor: '#000000',
    description: '1080 x 1920 px',
    tags: ['instagram', 'video']
  },
  {
    id: 'facebook-post',
    name: 'Facebook Post',
    category: 'Social Media',
    width: 1200,
    height: 630,
    backgroundColor: '#ffffff',
    description: '1200 x 630 px',
    tags: ['facebook', 'horizontal']
  },
  {
    id: 'facebook-cover',
    name: 'Facebook Cover',
    category: 'Social Media',
    width: 1200,
    height: 630,
    backgroundColor: '#4267B2',
    description: '1200 x 630 px',
    tags: ['facebook', 'cover']
  },
  {
    id: 'twitter-post',
    name: 'Twitter Post',
    category: 'Social Media',
    width: 1200,
    height: 675,
    backgroundColor: '#ffffff',
    description: '1200 x 675 px',
    tags: ['twitter', 'x']
  },
  {
    id: 'twitter-header',
    name: 'Twitter Header',
    category: 'Social Media',
    width: 1500,
    height: 500,
    backgroundColor: '#1DA1F2',
    description: '1500 x 500 px',
    tags: ['twitter', 'header']
  },
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    category: 'Social Media',
    width: 1200,
    height: 627,
    backgroundColor: '#ffffff',
    description: '1200 x 627 px',
    tags: ['linkedin', 'professional']
  },
  {
    id: 'youtube-thumbnail',
    name: 'YouTube Thumbnail',
    category: 'Social Media',
    width: 1280,
    height: 720,
    backgroundColor: '#ff0000',
    description: '1280 x 720 px',
    tags: ['youtube', 'thumbnail']
  },

  // Web Templates
  {
    id: 'desktop-fullhd',
    name: 'Desktop Full HD',
    category: 'Web',
    width: 1920,
    height: 1080,
    backgroundColor: '#f8f9fa',
    description: '1920 x 1080 px',
    tags: ['desktop', 'website']
  },
  {
    id: 'desktop-standard',
    name: 'Desktop Standard',
    category: 'Web',
    width: 1440,
    height: 900,
    backgroundColor: '#ffffff',
    description: '1440 x 900 px',
    tags: ['desktop', 'standard']
  },
  {
    id: 'tablet-portrait',
    name: 'Tablet Portrait',
    category: 'Web',
    width: 768,
    height: 1024,
    backgroundColor: '#ffffff',
    description: '768 x 1024 px',
    tags: ['tablet', 'ipad']
  },
  {
    id: 'tablet-landscape',
    name: 'Tablet Landscape',
    category: 'Web',
    width: 1024,
    height: 768,
    backgroundColor: '#ffffff',
    description: '1024 x 768 px',
    tags: ['tablet', 'horizontal']
  },
  {
    id: 'mobile-portrait',
    name: 'Mobile Portrait',
    category: 'Web',
    width: 375,
    height: 667,
    backgroundColor: '#ffffff',
    description: '375 x 667 px',
    tags: ['mobile', 'phone']
  },
  {
    id: 'mobile-large',
    name: 'Mobile Large',
    category: 'Web',
    width: 414,
    height: 896,
    backgroundColor: '#ffffff',
    description: '414 x 896 px',
    tags: ['mobile', 'large']
  },

  // Custom
  {
    id: 'custom',
    name: 'Custom Size',
    category: 'Custom',
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    description: 'Tamanho personalizado',
    tags: ['custom']
  }
];

export const getTemplatesByCategory = (category?: string): ArtboardTemplate[] => {
  if (!category) return defaultArtboardTemplates;
  return defaultArtboardTemplates.filter(template => template.category === category);
};

export const getTemplateById = (id: string): ArtboardTemplate | null => {
  return defaultArtboardTemplates.find(template => template.id === id) || null;
};

export const searchTemplates = (query: string): ArtboardTemplate[] => {
  const lowercaseQuery = query.toLowerCase();
  return defaultArtboardTemplates.filter(template => 
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description?.toLowerCase().includes(lowercaseQuery) ||
    template.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
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
    isCustom: true,
    tags: ['custom', 'user-created']
  };
};

export const getPopularTemplates = (): ArtboardTemplate[] => {
  const popularIds = [
    'instagram-post', 'instagram-story', 'a4-portrait', 
    'desktop-fullhd', 'mobile-portrait', 'youtube-thumbnail',
    'facebook-post', 'presentation-16-9'
  ];
  return popularIds.map(id => getTemplateById(id)).filter(Boolean) as ArtboardTemplate[];
};

export const getRecentTemplates = (): ArtboardTemplate[] => {
  // In a real app, this would come from user's recent usage
  return getPopularTemplates().slice(0, 4);
};
