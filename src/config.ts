export const config = {
  google: {
    loginURL:
      "https://accounts.google.com/v3/signin/identifier?authuser=0&continue=https%3A%2F%2Fmyaccount.google.com%2F%3Futm_source%3Dsign_in_no_continue%26pli%3D1&ec=GAlAwAE&hl=en_GB&service=accountsettings&flowName=GlifWebSignIn&flowEntry=AddSession&dsh=S1510445742%3A1720355343404055&ddm=0",
    loginRedirectURL: "^https://myaccount.google.com",
    accountsURL: "https://accounts.google.com",
  },

  authFile: ".playwright/auth/user.json",

  f4t: {
    url: "https://www.free4talk.com",
    email: process.env.F4T_EMAIL,
    password: process.env.F4T_PASSWORD,
    username: process.env.F4T_USERNAME,
  },

  env: process.env.ENV,

  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL,
  },
};
