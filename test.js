async function test() {
    let rp = require('request-promise');

    let a  = await rp({
        uri: process.env.SUGARMATE_URL,
        json: true
    });

    console.log(a.value);
}

test();