const {log} = require("./utils")
const {existsSync, unlinkSync} = require("fs")
const async = require("async")
const rp = require("request-promise")
const download = require("image-downloader")

const UNAUTHORISED_CODE = 401
const LIMIT = 100

async function parallelFetch(urls, cookie) {
    try {
        const requests = urls.map(url => {
            return async function () {
                return fetch(url, cookie)
            }
        })
        const res = await async.parallel(requests)
        return res
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}

async function fetch(url, cookie) {
    if (url === undefined || cookie === undefined) {
        console.error(`Some argument is missing. url: ${url}, cookie: ${cookie}`)
        process.exit(1)
    }
    try {
        const res = await req('GET', url, cookie, null)
        return res.body
    } catch (e) {
        if (e.statusCode === UNAUTHORISED_CODE) {
            const cookiesPath = __dirname + '/../' + 'session.json'
            if (existsSync(cookiesPath)) {
                unlinkSync(cookiesPath)
            }
            log(`...cookies expired, try again passing the -c <cookie> flag`)
            process.exit(1)
        }
        console.log(e)
        process.exit(1)
    }
}

async function req(method, url, cookie, body) {
    if (method === undefined || url === undefined || cookie === undefined) {
        console.error(`Some argument is missing. method: ${method}, url: ${url}, cookie: ${cookie}`)
        process.exit(1)
    }
    const options = {
        uri: url,
        method: method,
        followAllRedirects: true,
        resolveWithFullResponse: true,
        headers: {
            'Accept': '*/*',
            'Cache-Control': 'no-cache',
            'Cookie': cookie,
            'Connection': 'keep-alive'
        },
        body: body,
        json: true
    }

    return rp(options)
}

const downloadIMG = async (options) => {
    try {2
        return download.image(options)
    } catch (e) {
        log(`[Obook::downloadIMG] there was an error downloading the image ${options.url} e: ${e}`)
    }
}

async function fetchV2(url, cookie) {
    if (url === undefined || cookie === undefined) {
        console.error(`Some argument is missing. url: ${url}, cookie: ${cookie}`)
        process.exit(1)
    }

    try {
        const results = [];
        let pageUrl = `${url}&limit=${LIMIT}`;

        while(pageUrl) {
            const res = await req('GET', pageUrl, cookie, null);
            results.push(...res.body.results);

            pageUrl = res.body?.next;
        }

        return { results };
    } catch (e) {
        if (e.statusCode === UNAUTHORISED_CODE) {
            const cookiesPath = __dirname + '/../' + 'session.json'
            if (existsSync(cookiesPath)) {
                unlinkSync(cookiesPath)
            }
            log(`...cookies expired, try again passing the -c <cookie> flag`)
            process.exit(1)
        }
        console.log(e)
        process.exit(1)
    }
}

module.exports = {
    parallelFetch,
    downloadIMG,
    fetch,
    fetchV2,
}
