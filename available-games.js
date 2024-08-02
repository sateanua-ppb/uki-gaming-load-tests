const autocannon = require('autocannon');
const { stdout } = require("node:process");
const {aggregationData} = require("./aggregation-factory");

function print(result) {
    stdout.write(autocannon.printResult(result));
}

async function availableGames (requests) {
    const SSOID_COOKIE = `ssoid=TKe4EFLA80Qm5ikt2NXW9zif3dkUVejeGZeL+jwhbFY=`;
    const AVAILABLE_GAMES_PATH = "/api/gfe/available-games/v1/available-games";
    // const AVAILABLE_GAMES_PATH = "/api/available-games";

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
            "x-uuid": "autocannon-test"
        },
        requests: requests.map(request => ({
            path: `${AVAILABLE_GAMES_PATH}${request.path}`,
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

availableGames([
    {
        path: "?product=pokersg&format=poker-lite&platform=desktop",
        typeOfPath: "pokersg desktop",
        loggedIn: false
    }
]);
