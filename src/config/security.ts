export const securityPolicy = {
  api: {
    max: 120,
    timeWindow: "1 minute",
  },
  authentication: {
    max: 10,
    timeWindow: "15 minutes",
  },
  signUp: {
    max: 5,
    timeWindow: "1 hour",
  },
};
