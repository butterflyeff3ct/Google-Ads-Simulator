// Configuration for user data storage in Google Sheets
// Modify this file to change what user information gets stored

export interface UserDataConfig {
  // Basic user fields from OAuth provider
  basicFields: string[];
  // Custom fields you want to track
  customFields: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    defaultValue?: any;
  }[];
  // Fields to exclude (for privacy)
  excludeFields: string[];
  // Sheet configuration
  sheetConfig: {
    name: string;
    autoCreate: boolean;
    formatHeaders: boolean;
  };
}

export const userDataConfig: UserDataConfig = {
  basicFields: [
    'id',
    'name', 
    'email',
    'image',
    'provider'
  ],
  
  customFields: [
    {
      name: 'signupDate',
      type: 'date',
      defaultValue: () => new Date().toISOString()
    },
    {
      name: 'lastLogin',
      type: 'date',
      defaultValue: () => new Date().toISOString()
    },
    {
      name: 'loginCount',
      type: 'number',
      defaultValue: 1
    },
    {
      name: 'userAgent',
      type: 'string'
    },
    {
      name: 'ipAddress',
      type: 'string'
    },
    {
      name: 'country',
      type: 'string'
    },
    {
      name: 'city',
      type: 'string'
    },
    {
      name: 'timezone',
      type: 'string'
    }
  ],
  
  excludeFields: [
    'accessToken',
    'refreshToken',
    'expires_at'
  ],
  
  sheetConfig: {
    name: 'Users',
    autoCreate: true,
    formatHeaders: true
  }
};

// Helper function to get all field names
export function getAllFieldNames(): string[] {
  return [
    ...userDataConfig.basicFields,
    ...userDataConfig.customFields.map(field => field.name)
  ].filter(field => !userDataConfig.excludeFields.includes(field));
}

// Helper function to get default values
export function getDefaultValues(): Record<string, any> {
  const defaults: Record<string, any> = {};
  
  userDataConfig.customFields.forEach(field => {
    if (field.defaultValue !== undefined) {
      defaults[field.name] = typeof field.defaultValue === 'function' 
        ? field.defaultValue() 
        : field.defaultValue;
    }
  });
  
  return defaults;
}
