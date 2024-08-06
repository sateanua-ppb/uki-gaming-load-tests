const autocannon = require('autocannon');
const { stdout } = require("node:process");

function print(result) {
    stdout.write(autocannon.printResult(result));
}

async function aggregationData (requests) {
    const SSOID_COOKIE = `ssoid=EXAMPLE`;
    const AGGREGATION_PATH = "/api/gfe/aggregation-data/v1/aggregation-data";
    // const AGGREGATION_PATH = "/api/aggregation-data";

    let serverOverloads = 0;

    const onResponseHandler = (status, body, typeOfPath) => {
        if (status === 503) {
            try {
                const parsedBody = JSON.parse(body);

                if (parsedBody.details && parsedBody.details.message.includes("The server is currently unavailable")) {
                    console.log(`SERVER OVERLOAD - ${typeOfPath}`, body);
                    serverOverloads++;
                }
            } catch(error) {
                console.log(error);
                console.log(body);
            }
        }

        if (status === 500) {
            console.log("STATUS 500", typeOfPath, body);
        }
    };

    const result = await autocannon({
        //url: 'http://gfe.local.paddypower.com.nxt.ppbdev.com:9161',
        url: 'http://ie1-gfepp01a-nxt.nxt.betfair:8080',
        connections: 50,
        duration: 240,
        overallRate: 50,
        timeout: 20,
        headers: {
            "Host": "gfe.paddypower.com.nxt.ppbdev.com",
            "x-application": "autocannon-local",
            "x-uuid": "autocannon-alex-s-test"
        },
        requests: requests.map(request => ({
            path: `${AGGREGATION_PATH}${request.path}`,
            onResponse: (status, body) => {
                onResponseHandler(status, body, request.typeOfPath);
            },
            headers: request.loggedIn ? { "Cookie": SSOID_COOKIE } : null
        }))
    });
    console.log(result);
    print(result);
    console.log("ServerOverloads: ", serverOverloads);
}

module.exports = { aggregationData };
