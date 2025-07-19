// Image Registry for Progressive Preloading
// Contains all images organized by sections with priority levels

export interface ImageItem {
  url: string;
  section: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  size?: number; // estimated size in bytes
}

export interface ImageSection {
  name: string;
  priority: number;
  images: ImageItem[];
}

// All images organized by sections
export const IMAGE_REGISTRY: ImageSection[] = [
  {
    name: 'home',
    priority: 1,
    images: [
      {
        url: '/static/home/lemrabott_pic.png',
        section: 'home',
        priority: 'high',
        description: 'Profile picture on homepage',
        size: 50000
      },
      {
        url: '/static/home/toulba_lemrabott.png',
        section: 'home',
        priority: 'high',
        description: 'Main homepage image',
        size: 80000
      },
      {
        url: '/static/home/image.png',
        section: 'home',
        priority: 'medium',
        description: 'Homepage background image',
        size: 120000
      }
    ]
  },
  {
    name: 'education',
    priority: 2,
    images: [
      {
        url: '/static/education/miu-university/image.png',
        section: 'education',
        priority: 'high',
        description: 'MIU University image',
        size: 60000
      },
      {
        url: '/static/education/miu-university/miu_logo.png',
        section: 'education',
        priority: 'medium',
        description: 'MIU University logo',
        size: 30000
      },
      {
        url: '/static/education/una-university-bachelor/una.png',
        section: 'education',
        priority: 'high',
        description: 'UNA University Bachelor image',
        size: 70000
      },
      {
        url: '/static/education/una-university-master/una.png',
        section: 'education',
        priority: 'high',
        description: 'UNA University Master image',
        size: 70000
      },
      {
        url: '/static/education/certificate1/',
        section: 'education',
        priority: 'low',
        description: 'Certificate 1',
        size: 40000
      },
      {
        url: '/static/education/certificate2/',
        section: 'education',
        priority: 'low',
        description: 'Certificate 2',
        size: 40000
      }
    ]
  },
  {
    name: 'projects',
    priority: 3,
    images: [
      {
        url: '/static/projects/cognito-app/image.png',
        section: 'projects',
        priority: 'high',
        description: 'Cognito App project image',
        size: 80000
      },
      {
        url: '/static/projects/housing-management-api/cover.png',
        section: 'projects',
        priority: 'high',
        description: 'Housing Management API cover',
        size: 100000
      },
      {
        url: '/static/projects/java-swing-project/JavaSwingProject.png',
        section: 'projects',
        priority: 'medium',
        description: 'Java Swing Project image',
        size: 90000
      },
      {
        url: '/static/projects/mean-stack-app/mean-image.png',
        section: 'projects',
        priority: 'medium',
        description: 'MEAN Stack App image',
        size: 85000
      }
    ]
  },
  {
    name: 'experience',
    priority: 4,
    images: [
      {
        url: '/static/experience/bnm/click_app.png',
        section: 'experience',
        priority: 'high',
        description: 'BNM Click App image',
        size: 75000
      },
      {
        url: '/static/experience/mauribit/img1.jpeg',
        section: 'experience',
        priority: 'medium',
        description: 'Mauribit experience image',
        size: 65000
      }
    ]
  },
  {
    name: 'blogs',
    priority: 5,
    images: [
      {
        url: '/static/blogs/cognito-auth/image.png',
        section: 'blogs',
        priority: 'medium',
        description: 'Cognito Auth blog image',
        size: 70000
      },
      {
        url: '/static/blogs/deploy-hugo-to-s3/deploy-hugo-site-on-s3.png',
        section: 'blogs',
        priority: 'medium',
        description: 'Deploy Hugo to S3 blog image 1',
        size: 80000
      },
      {
        url: '/static/blogs/deploy-hugo-to-s3/deploy-hugo-site-to-s3.png',
        section: 'blogs',
        priority: 'medium',
        description: 'Deploy Hugo to S3 blog image 2',
        size: 80000
      }
    ]
  }
];

// Utility functions for image registry
export class ImageRegistryManager {
  private registry: ImageSection[];

  constructor(registry: ImageSection[] = IMAGE_REGISTRY) {
    this.registry = registry;
  }

  // Get all images for a specific section
  getImagesBySection(sectionName: string): ImageItem[] {
    const section = this.registry.find(s => s.name === sectionName);
    return section ? section.images : [];
  }

  // Get all images with a specific priority
  getImagesByPriority(priority: 'high' | 'medium' | 'low'): ImageItem[] {
    return this.registry.flatMap(section => 
      section.images.filter(img => img.priority === priority)
    );
  }

  // Get all images sorted by section priority
  getAllImagesSorted(): ImageItem[] {
    return this.registry
      .sort((a, b) => a.priority - b.priority)
      .flatMap(section => section.images);
  }

  // Get images for progressive loading (by priority levels)
  getImagesForProgressiveLoading(): ImageItem[] {
    const highPriority = this.getImagesByPriority('high');
    const mediumPriority = this.getImagesByPriority('medium');
    const lowPriority = this.getImagesByPriority('low');

    return [...highPriority, ...mediumPriority, ...lowPriority];
  }

  // Get total estimated size of all images
  getTotalEstimatedSize(): number {
    return this.registry
      .flatMap(section => section.images)
      .reduce((total, img) => total + (img.size || 0), 0);
  }

  // Get images for a specific section with priority
  getSectionImagesWithPriority(sectionName: string): ImageItem[] {
    const section = this.registry.find(s => s.name === sectionName);
    if (!section) return [];

    return section.images.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Get next section to preload based on current section
  getNextSection(currentSection: string): string | null {
    const currentIndex = this.registry.findIndex(s => s.name === currentSection);
    if (currentIndex === -1 || currentIndex === this.registry.length - 1) {
      return null;
    }
    return this.registry[currentIndex + 1].name;
  }

  // Get previous section
  getPreviousSection(currentSection: string): string | null {
    const currentIndex = this.registry.findIndex(s => s.name === currentSection);
    if (currentIndex <= 0) {
      return null;
    }
    return this.registry[currentIndex - 1].name;
  }

  // Get section info
  getSectionInfo(sectionName: string): ImageSection | null {
    return this.registry.find(s => s.name === sectionName) || null;
  }

  // Get all section names
  getAllSectionNames(): string[] {
    return this.registry.map(section => section.name);
  }

  // Get images that are not yet cached (placeholder for future implementation)
  getUncachedImages(cachedUrls: string[]): ImageItem[] {
    return this.registry
      .flatMap(section => section.images)
      .filter(img => !cachedUrls.includes(img.url));
  }
}

// Export singleton instance
export const imageRegistryManager = new ImageRegistryManager(); 