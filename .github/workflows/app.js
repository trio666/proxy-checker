const axios = require('axios');
const fs = require('fs');
const path = require('path');
const url = require('url');

const urls = [
    'https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=json',
    'https://proxylist.geonode.com/api/proxy-list?filterUpTime=80&limit=500&page=1&sort_by=lastChecked&sort_type=desc',
    'https://www.911proxy.com/detection/proxyList?limit=500&page=1&sort_by=lastChecked&sort_type=desc&filterUpTime=80',
    'http://43.135.31.113:8777/proxyList?limit=500&page=1&uptime=80&language=en-us',
    'https://api.lumiproxy.com/web_v1/free-proxy/list?page_size=500&page=1&uptime=80&language=en-us'
];

// Plain-text proxy lists (one "IP:port" per line, protocol from the file).
// All URLs verified live 2026-11-27. Skipped: mmpx12 (serves a 502 error
// inside its file) and proxy-list.download (API returns 502).
// Note: the API sources above are already fully harvested on page 1
// (Geonode total 306, LumiProxy total 386 with uptime>=80), so pagination
// adds nothing — volume comes from these text lists instead.
const textLists = [
    { url: 'https://openproxylist.xyz/http.txt', protocol: 'http' },
    { url: 'https://openproxylist.xyz/https.txt', protocol: 'https' },
    { url: 'https://openproxylist.xyz/socks4.txt', protocol: 'socks4' },
    { url: 'https://openproxylist.xyz/socks5.txt', protocol: 'socks5' },
    { url: 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt', protocol: 'http' },
    { url: 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks4.txt', protocol: 'socks4' },
    { url: 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt', protocol: 'socks5' },
    { url: 'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt', protocol: 'http' },
    { url: 'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks4.txt', protocol: 'socks4' },
    { url: 'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks5.txt', protocol: 'socks5' },
    { url: 'https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt', protocol: 'socks5' }
];

const protocolMap = {
    1: 'http',
    2: 'https',
    4: 'socks4',
    8: 'socks5'
};

const fetchProxies = async () => {
    let allProxies = [];
    for (const urlString of urls) {
        try {
            const domain = new URL(urlString).origin;
            console.log(`Fetching proxies from ${domain}...`);
            const response = await axios.get(urlString);
            const data = response.data;
            if (urlString.includes('proxyscrape')) {
                allProxies = allProxies.concat(data.proxies.map(proxy => ({
                    protocol: proxy.protocol,
                    ip: proxy.ip,
                    port: proxy.port,
                    country: proxy.ip_data?.countryCode || 'Unknown'
                })));
            } else if (urlString.includes('geonode') || urlString.includes('911proxy') || urlString.includes('43.135.31.113')) {
                allProxies = allProxies.concat(data.data.map(proxy => ({
                    protocol: proxy.protocols[0],
                    ip: proxy.ip,
                    port: proxy.port,
                    country: proxy.country
                })));
            } else if (urlString.includes('lumiproxy')) {
                allProxies = allProxies.concat(data.data.list.map(proxy => ({
                    protocol: protocolMap[proxy.protocol],
                    ip: proxy.ip,
                    port: proxy.port,
                    country: proxy.country_code
                })));
            }
        } catch (error) {
            console.error(`Error fetching proxies from ${urlString}:`, error);
        }
    }
    for (const { url: listUrl, protocol } of textLists) {
        try {
            console.log(`Fetching proxies from ${listUrl}...`);
            const response = await axios.get(listUrl, { responseType: 'text' });
            const text = typeof response.data === 'string' ? response.data : '';
            for (const line of text.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                const match = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})$/);
                if (match) {
                    allProxies.push({ protocol, ip: match[1], port: match[2], country: 'Unknown' });
                }
            }
        } catch (error) {
            console.error(`Error fetching proxies from ${listUrl}:`, error);
        }
    }
    return allProxies;
};

const writeProxiesToFile = (proxies, filename) => {
    const uniqueProxies = [...new Set(proxies)].sort();
    fs.writeFileSync(filename, uniqueProxies.join('\n'), 'utf8');
};

const categorizeAndWriteProxies = (proxies) => {
    const categorizedProxies = {
        all: [],
        http: [],
        https: [],
        socks4: [],
        socks5: []
    };

    const countryProxies = {};

    proxies.forEach(proxy => {
        const proxyString = `${proxy.protocol}://${proxy.ip}:${proxy.port}`;
        categorizedProxies.all.push(proxyString);
        if (proxy.protocol === 'http') {
            categorizedProxies.http.push(proxyString);
        } else if (proxy.protocol === 'https') {
            categorizedProxies.https.push(proxyString);
        } else if (proxy.protocol === 'socks4') {
            categorizedProxies.socks4.push(proxyString);
        } else if (proxy.protocol === 'socks5') {
            categorizedProxies.socks5.push(proxyString);
        }

        if (!countryProxies[proxy.country]) {
            countryProxies[proxy.country] = {
                all: [],
                http: [],
                https: [],
                socks4: [],
                socks5: []
            };
        }
        countryProxies[proxy.country].all.push(proxyString);
        if (proxy.protocol === 'http') {
            countryProxies[proxy.country].http.push(proxyString);
        } else if (proxy.protocol === 'https') {
            countryProxies[proxy.country].https.push(proxyString);
        } else if (proxy.protocol === 'socks4') {
            countryProxies[proxy.country].socks4.push(proxyString);
        } else if (proxy.protocol === 'socks5') {
            countryProxies[proxy.country].socks5.push(proxyString);
        }
    });

    writeProxiesToFile(categorizedProxies.all, 'all.txt');
    writeProxiesToFile(categorizedProxies.http, 'http.txt');
    writeProxiesToFile(categorizedProxies.https, 'https.txt');
    writeProxiesToFile(categorizedProxies.socks4, 'socks4.txt');
    writeProxiesToFile(categorizedProxies.socks5, 'socks5.txt');

    for (const country in countryProxies) {
        const countryDir = path.join(__dirname, 'country', country);
        if (!fs.existsSync(countryDir)) {
            fs.mkdirSync(countryDir, { recursive: true });
        }
        writeProxiesToFile(countryProxies[country].all, path.join(countryDir, 'all.txt'));
        writeProxiesToFile(countryProxies[country].http, path.join(countryDir, 'http.txt'));
        writeProxiesToFile(countryProxies[country].https, path.join(countryDir, 'https.txt'));
        writeProxiesToFile(countryProxies[country].socks4, path.join(countryDir, 'socks4.txt'));
        writeProxiesToFile(countryProxies[country].socks5, path.join(countryDir, 'socks5.txt'));
    }
};

const main = async () => {
    const proxies = await fetchProxies();
    categorizeAndWriteProxies(proxies);
    console.log('Proxies have been written to files.');
};

main();
