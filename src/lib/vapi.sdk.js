import Vapi from '@vapi-ai/web'

// Initialize VAPI with error handling
let vapi;

try {
  if (!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN) {
    console.error('VAPI Web Token is not configured. Please set NEXT_PUBLIC_VAPI_WEB_TOKEN in your environment variables.');
    // Create a mock vapi object to prevent crashes
    vapi = {
      on: () => {},
      off: () => {},
      start: () => Promise.reject(new Error('VAPI not configured')),
      stop: () => Promise.resolve(),
    };
  } else {
    console.log('Initializing VAPI with token:', process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN.substring(0, 10) + '...');
    vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN);
    console.log('VAPI initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize VAPI:', error);
  console.error('VAPI initialization error details:', {
    message: error?.message,
    name: error?.name,
    stack: error?.stack,
    type: typeof error
  });
  // Create a mock vapi object to prevent crashes
  vapi = {
    on: () => {},
    off: () => {},
    start: () => Promise.reject(new Error('VAPI initialization failed')),
    stop: () => Promise.resolve(),
  };
}

export { vapi };