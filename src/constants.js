// Exports global constants
export const BASEURL = "https://api.binance.com/api/v1/klines"
export const ML_API_URL = process.env.NODE_ENV === 'production' ? "/api/v1/cryptoforecast" : "http://127.0.0.1:8000/api/v1/cryptoforecast"
