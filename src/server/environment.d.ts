declare global {
    namespace NodeJS {
      interface ProcessEnv {
        REGION: string;
        ENVIRONMENT: string;
        PROFILE: string;
        PROFILE_TYPE: string;
        VITE_PORT: number;
      }
    }
  }
  
  export {};