var express = require('express');
var router = express.Router();
let rp = require('request-promise');

function getRandomArrayElem(arr) {
  // pick random element from array - from https://css-tricks.com/snippets/javascript/select-random-item-array/
  return arr[Math.floor(Math.random()*arr.length)];
}

function GPExtra(phrase, punctuation) {
  return {
      phrase: phrase,
      punctuation: punctuation
  };
}

function calculateScore(percentError, correctPoints, bias) {
  if (percentError === 0) {
    return 100;
  }
  const randomBias = Math.floor(Math.random()*(5 + 5) - 5)
  return Math.min(100, Math.max(correctPoints/(Math.exp(bias*percentError)) + randomBias, 0));
}

/* GET home page. */
router.get('/', function(req, res, next) {
  const GUESS_PHRASE_EXTRA = [
    GPExtra("Why don't you", "?"),
    GPExtra("It's OK, just", "."),
    GPExtra("Please", "."),
    GPExtra("If you could,", "."),
    GPExtra("Would you be so bold as to", "?"),
    GPExtra("Can you", "?"),
    GPExtra("All you need to do is", "."),
    GPExtra("If you'd like to,", ".")
  ];

  const GUESS_PHRASE = [
      "take a guess",
      "take a gander",
      "make a conjecture",
      "provide your supposition"
  ];

  const COMMENT_PHRASE = [
      "Speculate to your heart's content.",
      "Conducting elaborate guesswork.",
      "Approximate approximations are the best approximations.",
      "No need to be exact.",
      "Who said this was an exact science?",
      "Approximate exactness is acceptable.",
      "Precision not required.",
      "Guesswork strongly encouraged.",
      "Dispel all logic now.",
      "Don't think too hard."
  ];
  const guessPhraseExtra = getRandomArrayElem(GUESS_PHRASE_EXTRA);

  res.render('index', { 
    title: "Guess Evan's Blood Sugar!",
    guessPhrase: `${guessPhraseExtra.phrase} ${getRandomArrayElem(GUESS_PHRASE)}${guessPhraseExtra.punctuation}`,
    commentPhrase: getRandomArrayElem(COMMENT_PHRASE)
  });
});

router.post('/api/v1/check', async function(req, res, next) {
  console.log("rp url", process.env.SUGARMATE_URL);
  let answer = await rp({
    uri: process.env.SUGARMATE_URL,
    json: true
  })

  if (answer.reading.indexOf("[OLD]") >= 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      noData: true
    }));
    return;
  }
  
  const userBg = Number.parseInt(req.body.userBg);
  answer = answer.value;
  const error = (answer - userBg)/answer;

  let result = "";
  const errorDirection = (error > 0) ? "higher" : "lower";
  let errorMagnitude;
  if (Math.abs(error) >= 1) {
    errorMagnitude = "way";
  } else if (Math.abs(error) >= .5) {
    errorMagnitude = "much";
  } else if (Math.abs(error) >= .2) {
    errorMagnitude = "somewhat";
  } else {
    errorMagnitude = "slightly";
  }

  let hint = `Hint: It's ${errorMagnitude} ${errorDirection} than what you put.`;

  const CORRECT_PHRASES = [
    "Rockin!  You got it!",
    "Nice!  That's right!", 
    "Ayyyyy.  You guessed correctly!",
    "Whoa, you got it!",
    "Wow, that's correct!",
    "Excellent guesswork - you got it!"
  ];

  const CLOSE_PHRASES = [
    "Not quite.",
    "You're close, but close is not right.",
    "Aaaaand you almost got it.",
    "Almost there!  Give it another shot.",
    "I'm sure you'll get it next time."
  ];

  const FAR_OFF_PHRASES = [
    "Nope.  Not even close.",
    "You took a little too much of a guess.",
    "Not even close.  Try again!",
    "Whoa there!  Try getting a little closer next time.",
    "You're guess was ... not right!",
    "Sad trombone.  Try again!"
  ]

  if (error == 0) {
    result = `${getRandomArrayElem(CORRECT_PHRASES)}`;
    hint = ""; // clear hint
  } else if (Math.abs(error) <= .2) {
    result = `${getRandomArrayElem(CLOSE_PHRASES)}`;
  } else {
    result = `${getRandomArrayElem(FAR_OFF_PHRASES)}`
  }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    noData: false,
    result: result,
    hint: hint,
    score: Math.round(calculateScore(Math.abs(error), 100, 6.7182))
  }));
})

module.exports = router;
