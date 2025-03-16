## 🌐 Free Proxy List  

This repository provides an updated list of free proxies collected from various sources. The proxies are categorized by protocol and country:

### 📌 Proxy Categories  

- **HTTP Proxies** → `http.txt`  
- **HTTPS Proxies** → `https.txt`  
- **SOCKS4 Proxies** → `socks4.txt`  
- **SOCKS5 Proxies** → `socks5.txt`  
- **All Proxies (Combined List)** → `all.txt`  

### 🌍 Country-Specific Proxies  

Proxies are also categorized by country. You can find country-specific proxy lists in the `country` directory. For example:
- **United States** → `country/US/all.txt`, `country/US/http.txt`, `country/US/https.txt`, `country/US/socks4.txt`, `country/US/socks5.txt`
- **Germany** → `country/DE/all.txt`, `country/DE/http.txt`, `country/DE/https.txt`, `country/DE/socks4.txt`, `country/DE/socks5.txt`

### 🔄 Update Frequency  

The proxy list is updated every **10 minutes** to ensure fresh and active proxies.  

### ✅ Proxy Status & Checking  

Collected proxies may vary in availability. It is recommended to verify them before use. You can use tools such as:  

- `curl` (for HTTP/S)  
- `proxychains` (for SOCKS4/SOCKS5)  
- Python scripts using `requests` or `aiohttp`  

Example check using `curl`:  

```sh
curl -x http://IP:PORT -I https://www.google.com
```

### ⚠️ Responsible Use  

🛑 **Please follow** [GitHub Acceptable Use Policy](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies). Use these proxies **responsibly**, without abuse, and without intent to engage in illegal activities.
