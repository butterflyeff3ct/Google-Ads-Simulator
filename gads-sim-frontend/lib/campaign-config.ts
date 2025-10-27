/**
 * Campaign Configuration Management System
 * 
 * This module provides a comprehensive data structure and utilities
 * for managing campaign configurations across all steps of the
 * Google Ads Search Campaign Simulator.
 */

export interface CampaignGoal {
  type: 'sales' | 'leads' | 'website_traffic' | 'brand_awareness' | 'app_promotion';
  description?: string;
}

export interface CampaignType {
  type: 'search' | 'display' | 'video' | 'shopping' | 'app';
  subtype?: string;
}

export interface ReachMethod {
  method: 'website' | 'phone' | 'app' | 'store';
  value?: string; // URL, phone number, app ID, or address
}

export interface BiddingStrategy {
  type: 'manual_cpc' | 'maximize_clicks' | 'maximize_conversions' | 'target_cpa' | 'target_roas' | 'maximize_conversion_value';
  targetCpa?: number;
  targetRoas?: number;
  maxCpc?: number;
}

export interface Budget {
  dailyBudget: number;
  totalBudget?: number;
  deliveryMethod: 'standard' | 'accelerated';
}

export interface Location {
  country: string;
  regions?: string[];
  cities?: string[];
  radius?: {
    value: number;
    unit: 'km' | 'miles';
    center: string;
  };
}

export interface Language {
  code: string;
  name: string;
}

export interface Device {
  type: 'desktop' | 'mobile' | 'tablet';
  bidAdjustment?: number; // Percentage adjustment
}

export interface Schedule {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string; // HH:MM format
  endTime: string;
  bidAdjustment?: number;
}

export interface AdGroup {
  id: string;
  name: string;
  keywords: Keyword[];
  ads: Ad[];
  defaultBid?: number;
}

export interface Keyword {
  text: string;
  matchType: 'exact' | 'phrase' | 'broad';
  bid?: number;
  quality_score?: number;
  finalUrl?: string;
  negativeKeyword?: boolean;
}

export interface Ad {
  id: string;
  headlines: string[]; // Up to 15 headlines
  descriptions: string[]; // Up to 4 descriptions
  path1?: string; // Display URL path 1
  path2?: string; // Display URL path 2
  finalUrl: string;
  extensions?: AdExtension[];
}

export interface AdExtension {
  type: 'sitelink' | 'callout' | 'structured_snippet' | 'call' | 'location' | 'price' | 'app' | 'promotion';
  data: any; // Extension-specific data
}

export interface ConversionTracking {
  enabled: boolean;
  conversionAction: string;
  conversionValue?: number;
  countType: 'one' | 'every';
}

export interface CampaignConfig {
  // Step 1: Campaign Goal and Type
  campaignName: string;
  goal: CampaignGoal;
  campaignType: CampaignType;
  reachMethods: ReachMethod[];
  websiteUrl?: string;
  
  // Step 2: Bidding Strategy and Budget
  biddingStrategy: BiddingStrategy;
  budget: Budget;
  
  // Step 3: Locations and Languages
  locations: Location[];
  languages: Language[];
  locationOptions?: {
    targetType: 'presence' | 'interest';
    excludeLocations?: string[];
  };
  
  // Step 4: Audience and Demographics
  audiences?: {
    affinity?: string[];
    inMarket?: string[];
    demographics?: {
      age?: string[];
      gender?: string[];
      parentalStatus?: string[];
      householdIncome?: string[];
    };
  };
  
  // Step 5: Devices and Schedule
  devices: Device[];
  schedule?: Schedule[];
  startDate?: Date;
  endDate?: Date;
  
  // Step 6: Ad Groups and Keywords
  adGroups: AdGroup[];
  
  // Step 7: Ad Creation
  ads: Ad[];
  
  // Step 8: Conversion Tracking and Settings
  conversionTracking: ConversionTracking;
  
  // Advanced Settings
  advanced?: {
    adRotation?: 'optimize' | 'rotate_indefinitely';
    dynamicSearchAds?: boolean;
    contentExclusions?: string[];
    frequencyCap?: {
      impressions: number;
      timeUnit: 'day' | 'week' | 'month';
    };
  };
  
  // Simulation Settings
  simulation?: {
    numAuctions?: number;
    seed?: number;
    includeCacheResults?: boolean;
    includeConfidenceRanges?: boolean;
    includeMetricsBreakdown?: boolean;
  };
  
  // Metadata
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
    userId?: string;
  };
}

/**
 * Default campaign configuration
 */
export const DEFAULT_CAMPAIGN_CONFIG: CampaignConfig = {
  campaignName: 'New Search Campaign',
  goal: {
    type: 'sales',
    description: 'Drive online sales'
  },
  campaignType: {
    type: 'search'
  },
  reachMethods: [
    {
      method: 'website',
      value: ''
    }
  ],
  biddingStrategy: {
    type: 'manual_cpc',
    maxCpc: 5.0
  },
  budget: {
    dailyBudget: 100,
    deliveryMethod: 'standard'
  },
  locations: [
    {
      country: 'US'
    }
  ],
  languages: [
    {
      code: 'en',
      name: 'English'
    }
  ],
  devices: [
    { type: 'desktop', bidAdjustment: 0 },
    { type: 'mobile', bidAdjustment: 0 },
    { type: 'tablet', bidAdjustment: 0 }
  ],
  adGroups: [],
  ads: [],
  conversionTracking: {
    enabled: false,
    conversionAction: 'purchase',
    countType: 'one'
  },
  simulation: {
    numAuctions: 10000,
    seed: 12345,
    includeCacheResults: true,
    includeConfidenceRanges: true,
    includeMetricsBreakdown: true
  },
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0'
  }
};

/**
 * Campaign Configuration Manager
 */
export class CampaignConfigManager {
  private config: CampaignConfig;
  
  constructor(initialConfig?: Partial<CampaignConfig>) {
    this.config = {
      ...DEFAULT_CAMPAIGN_CONFIG,
      ...initialConfig,
      metadata: {
        ...DEFAULT_CAMPAIGN_CONFIG.metadata,
        ...initialConfig?.metadata,
        updatedAt: new Date()
      }
    };
  }
  
  /**
   * Get the current configuration
   */
  getConfig(): CampaignConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CampaignConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      metadata: {
        ...this.config.metadata,
        updatedAt: new Date()
      }
    };
  }
  
  /**
   * Update a specific step's data
   */
  updateStep(step: number, data: any): void {
    const updates: Partial<CampaignConfig> = {};
    
    switch (step) {
      case 1:
        updates.campaignName = data.campaignName;
        updates.goal = data.goal;
        updates.campaignType = data.campaignType;
        updates.reachMethods = data.reachMethods;
        updates.websiteUrl = data.websiteUrl;
        break;
      case 2:
        updates.biddingStrategy = data.biddingStrategy;
        updates.budget = data.budget;
        break;
      case 3:
        updates.locations = data.locations;
        updates.languages = data.languages;
        break;
      case 4:
        updates.audiences = data.audiences;
        break;
      case 5:
        updates.devices = data.devices;
        updates.schedule = data.schedule;
        updates.startDate = data.startDate;
        updates.endDate = data.endDate;
        break;
      case 6:
        updates.adGroups = data.adGroups;
        break;
      case 7:
        updates.ads = data.ads;
        break;
      case 8:
        updates.conversionTracking = data.conversionTracking;
        updates.advanced = data.advanced;
        break;
    }
    
    this.updateConfig(updates);
  }
  
  /**
   * Validate configuration
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields validation
    if (!this.config.campaignName || this.config.campaignName.trim() === '') {
      errors.push('Campaign name is required');
    }
    
    if (!this.config.goal || !this.config.goal.type) {
      errors.push('Campaign goal is required');
    }
    
    if (!this.config.budget || this.config.budget.dailyBudget <= 0) {
      errors.push('Daily budget must be greater than 0');
    }
    
    if (!this.config.locations || this.config.locations.length === 0) {
      errors.push('At least one location is required');
    }
    
    if (!this.config.adGroups || this.config.adGroups.length === 0) {
      errors.push('At least one ad group is required');
    }
    
    if (!this.config.ads || this.config.ads.length === 0) {
      errors.push('At least one ad is required');
    }
    
    // Validate each ad group has keywords
    this.config.adGroups?.forEach((group, index) => {
      if (!group.keywords || group.keywords.length === 0) {
        errors.push(`Ad group "${group.name}" must have at least one keyword`);
      }
    });
    
    // Validate each ad
    this.config.ads?.forEach((ad, index) => {
      if (!ad.headlines || ad.headlines.length === 0) {
        errors.push(`Ad ${index + 1} must have at least one headline`);
      }
      if (!ad.descriptions || ad.descriptions.length === 0) {
        errors.push(`Ad ${index + 1} must have at least one description`);
      }
      if (!ad.finalUrl || ad.finalUrl.trim() === '') {
        errors.push(`Ad ${index + 1} must have a final URL`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Export configuration to JSON
   */
  toJSON(): string {
    return JSON.stringify(this.config, null, 2);
  }
  
  /**
   * Import configuration from JSON
   */
  fromJSON(json: string): void {
    try {
      const parsed = JSON.parse(json);
      this.config = {
        ...DEFAULT_CAMPAIGN_CONFIG,
        ...parsed,
        metadata: {
          ...parsed.metadata,
          updatedAt: new Date()
        }
      };
    } catch (error) {
      throw new Error('Invalid JSON configuration');
    }
  }
  
  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = { ...DEFAULT_CAMPAIGN_CONFIG };
  }
}

/**
 * Local Storage utility for campaign configurations
 */
export class CampaignConfigStorage {
  private static STORAGE_KEY = 'google_ads_campaign_config';
  
  /**
   * Save configuration to localStorage
   */
  static save(config: CampaignConfig): void {
    try {
      const json = JSON.stringify(config);
      localStorage.setItem(this.STORAGE_KEY, json);
    } catch (error) {
      console.error('Failed to save campaign configuration:', error);
    }
  }
  
  /**
   * Load configuration from localStorage
   */
  static load(): CampaignConfig | null {
    try {
      const json = localStorage.getItem(this.STORAGE_KEY);
      if (!json) return null;
      
      const parsed = JSON.parse(json);
      return {
        ...DEFAULT_CAMPAIGN_CONFIG,
        ...parsed
      };
    } catch (error) {
      console.error('Failed to load campaign configuration:', error);
      return null;
    }
  }
  
  /**
   * Clear configuration from localStorage
   */
  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  /**
   * Check if configuration exists in localStorage
   */
  static exists(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }
  
  /**
   * Save multiple configurations (history)
   */
  static saveHistory(config: CampaignConfig): void {
    try {
      const historyKey = `${this.STORAGE_KEY}_history`;
      const historyJson = localStorage.getItem(historyKey);
      const history: CampaignConfig[] = historyJson ? JSON.parse(historyJson) : [];
      
      // Add new config with timestamp
      history.push({
        ...config,
        metadata: {
          ...config.metadata,
          createdAt: new Date()
        }
      });
      
      // Keep only last 10 configs
      const limitedHistory = history.slice(-10);
      
      localStorage.setItem(historyKey, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Failed to save campaign configuration history:', error);
    }
  }
  
  /**
   * Load configuration history
   */
  static loadHistory(): CampaignConfig[] {
    try {
      const historyKey = `${this.STORAGE_KEY}_history`;
      const historyJson = localStorage.getItem(historyKey);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Failed to load campaign configuration history:', error);
      return [];
    }
  }
}

/**
 * React Hook for campaign configuration management
 */
export function useCampaignConfig(initialConfig?: Partial<CampaignConfig>) {
  // Load from localStorage or use initial/default config
  const storedConfig = CampaignConfigStorage.load();
  const manager = new CampaignConfigManager(storedConfig || initialConfig);
  
  const updateConfig = (updates: Partial<CampaignConfig>) => {
    manager.updateConfig(updates);
    CampaignConfigStorage.save(manager.getConfig());
  };
  
  const updateStep = (step: number, data: any) => {
    manager.updateStep(step, data);
    CampaignConfigStorage.save(manager.getConfig());
  };
  
  const saveToHistory = () => {
    CampaignConfigStorage.saveHistory(manager.getConfig());
  };
  
  const clearConfig = () => {
    manager.reset();
    CampaignConfigStorage.clear();
  };
  
  return {
    config: manager.getConfig(),
    updateConfig,
    updateStep,
    validate: () => manager.validate(),
    saveToHistory,
    clearConfig,
    toJSON: () => manager.toJSON(),
    fromJSON: (json: string) => manager.fromJSON(json)
  };
}

export default CampaignConfigManager;
