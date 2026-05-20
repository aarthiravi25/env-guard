// Application configuration file
// WARNING: Hardcoded secrets ahead for demonstration purposes

export const config = {
  port: 3000,
  
  // Hardcoded MongoDB connection URI
  databaseUri: "mongodb+srv://developer:dev_password_123@sandbox.mongodb.net/test",

  // Hardcoded OpenAI Secret Key
  openaiApiKey: "sk-proj-superSecureOpenAIKeyThatIsWayTooLongAndExposedInCode",

  // Hardcoded Google API Key
  googleMapsApiKey: "AIzaSyDummyGoogleKeyThatShouldNotBeHere"
};
