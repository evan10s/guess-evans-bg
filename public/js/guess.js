// from StackOverflow with slight modifications: https://stackoverflow.com/a/29325222/5434744
function getRndBias(min, max, bias, influence) {
    var rnd = Math.random() * (max - min) + min, // random in range
        mix = Math.random() * influence; // random mixer
    return Math.floor(rnd * (1 - mix) + bias * mix); // mix full range and bias
}

function getUniqueRndBias(min, max, bias, influence, prev) {
    result = getRndBias(min, max, bias, influence);
    if (result !== prev) {
        return result;
    }
    return result + Math.floor(Math.random() * (25 - 10 + 1) + 10);
}

function getRandomArrayElem(arr) {
    // pick random element from array - from https://css-tricks.com/snippets/javascript/select-random-item-array/
    return arr[Math.floor(Math.random() * arr.length)];
}

function ready() {
    document.getElementById("bg").placeholder = getRndBias(40, 226, 100, 1) + "?";

    setInterval(function () {
        $("#bg").addClass("fade");
        const prevStringVal = $("#bg").attr("placeholder");
        const prev = Number.parseInt(
            $("#bg")
                .attr("placeholder")
                .substring(0, prevStringVal.length)
        );
        setTimeout(function () {
            $("#bg")
                .attr("placeholder", getUniqueRndBias(40, 225, 100, 1, prev) + "?")
                .removeClass("fade");
        }, 400);
    }, 1750);
}

async function check() {
    const CORRECT_SYMBOLS = [
        "magic",
        "gem",
        "thumbs up",
        "check",
        "heart",
        "star",
        "rocket"
    ];

    const INCORRECT_SYMBOLS = [
        "x",
        "thumbs down",
        "ban",
        "exclamation triangle",
        "minus circle",
        "frown",
        "meh"
    ];

    $('#rate-limit-container, #no-data-container').addClass("hidden");
    $(`#high-info, #normal-info, #low-info, #info-disclaimer`).addClass("hidden");

    const bg = document.getElementById("bg").value;
    if (!bg.length) {
        $('#bg-container').addClass("error");
        $('#enter-a-bg').removeClass("hidden");
        return;
    } else {
        $('#bg-container').removeClass("error");
        $('#enter-a-bg').addClass("hidden");
    }

    $("#submit-btn").addClass("loading");
    $("#result-container, #correct-notice").addClass("hidden")
    $("#result-icon").removeClass(CORRECT_SYMBOLS.join(" ")).removeClass(INCORRECT_SYMBOLS.join(" ")); 

    const asyncResult = await fetch("/api/v1/check", {
        method: "POST",
        body: JSON.stringify({
            userBg: bg
        }),
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!asyncResult.ok) {
        $("#submit-btn").removeClass("loading");
        $('#rate-limit-container').removeClass("hidden");
        return;
    }

    const result = await asyncResult.json();

    if (result.noData) {
        $("#submit-btn").removeClass("loading");
        $("#no-data-container").removeClass("hidden");
        return;
    }

    $("#submit-btn").removeClass("loading");
    $('#guess-accuracy').removeClass("red orange green");
    $('#result-container').removeClass("negative orange positive");

    $("#result").text(result.result);
    $("#score").text(result.score);
    $("#hint").text(result.hint)

    let newScoreClass,
        newProgressBarClass;
    if (result.score < 75) {
        newScoreClass = "negative";
        newProgressBarClass = "red";
        $('#result-icon').addClass(getRandomArrayElem(INCORRECT_SYMBOLS));

    } else if (result.score < 100) {
        newScoreClass = "orange";
        newProgressBarClass = "orange"
        $('#result-icon').addClass(getRandomArrayElem(INCORRECT_SYMBOLS));

    } else {
        newScoreClass = "positive";
        newProgressBarClass = "green";
        $('#result-icon').addClass(getRandomArrayElem(CORRECT_SYMBOLS));
        let bgInfo;

        if (bg >= 130) {
            bgInfo = "high";
        } else if (bg >= 70) {
            bgInfo = "normal";
        } else {
            bgInfo = "low";
        }

        $(`#${bgInfo}-info > #bg`).text(bg);
        $(`#${bgInfo}-info`).removeClass("hidden");
        $("#info-disclaimer, #correct-notice").removeClass("hidden");

    }
    $('#guess-accuracy').addClass(newProgressBarClass);
    $('#guess-accuracy').progress({
        percent: result.score,
    });

    $("#result-container").removeClass("hidden").addClass(newScoreClass);
}
