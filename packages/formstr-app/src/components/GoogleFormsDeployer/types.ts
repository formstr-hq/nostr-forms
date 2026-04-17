export interface FetchResult {
    success: boolean;
    data?: {
      title?: string;
      description?: string;
      id?: string;
      questions?: GoogleFormQuestion[];
    };
    error?: string;
  }
  
  export interface GoogleFormQuestion {
    id: number;
    title: string;
    type: string;
    helpText?: string;
    isRequired?: boolean;
    options?: string[];
    hasOtherOption?: boolean;
    rows?: string[];
    columns?: string[];
    allowedFileTypes?: string[];
    maxFiles?: number;
    maxFileSizeBytes?: number;
  }