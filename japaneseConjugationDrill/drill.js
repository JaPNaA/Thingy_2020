// drill.js

/** @type {Transformation[]} */
var transformations = [];
var redoQuestionQue = [];

var questionData;

var log;

/**
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
function getRandomElementInArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function commaList(items, conjunction) {

  if (conjunction == undefined) {
    conjunction = "and";
  }

  var result = "";

  for (var i = 0; i < items.length; i++) {
    result = result + items[i];

    if (i < (items.length - 2)) {
      result += ", ";
    }

    if (i == (items.length - 2)) {
      result += " " + conjunction + " ";
    }
  }

  return result;
}

function resetLog() {
  log = { "history": [] };
}

function kanaForm(words) {

  if (words.constructor !== Array) {
    words = [words];
  }

  return words.map(function (word) { return word.split(/.\[([^\]]*)\]/).join(""); });
}

function kanjiForm(words) {

  if (words.constructor !== Array) {
    words = [words];
  }

  return words.map(function (word) { return word.split(/(.)\[[^\]]*\]/).join(""); });
}

function getVerbForms(entry) {

  var result = {
    "kanji": {},
    "hiragana": {},
    "furigana": {}
  };

  Object.keys(words[entry].conjugations).forEach(function (key) {
    result["kanji"][key] = kanjiForm(words[entry].conjugations[key]);
    result["hiragana"][key] = kanaForm(words[entry].conjugations[key]);
    result["furigana"][key] = words[entry].conjugations[key];
  });

  return result;
}

function wordWithFurigana(words) {

  if (words.constructor !== Array) {
    words = [words];
  }

  return words.map(function (word) {

    var bits = word.split(/(.)\[([^\]]*)\]/);

    while (bits.length > 1) {
      bits[0] = bits[0] + "<span class='tooltip-w" + bits[2].length + "' tooltip='" + bits[2] + "'>" + bits[1] + "</span>" + bits[3];
      bits.splice(1, 3);
    }

    return bits[0];
  });
}

function isValidQuestion(entry, forms, transformation, options) {

  var valid = true;

  transformation.tags.forEach(function (type) {
    if (options[type] == false) {
      valid = false;
    }
  });

  if (options[words[entry].group] == false) {
    valid = false;
  }

  if (!forms["furigana"][transformation.from])
    valid = false;

  if (!forms["furigana"][transformation.to])
    valid = false;

  return valid;
}

function generateQuestionData() {

  /** @type {String} */
  var entry;
  var transformation;
  var to_form;
  var from_form;
  var forms;
  var options = getOptions();

  var count = 0;

  while (true) {

    if (count++ == 10000) {
      showSplash();
      return;
    }

    entry = getRandomElementInArray(Object.keys(words));
    transformation = getRandomElementInArray(transformations);

    from_form = transformation.from;
    to_form = transformation.to;

    forms = getVerbForms(entry);

    var isValid = isValidQuestion(entry, forms, transformation, getOptions());

    // Modify the chance of trick questions so that they appear on average 25%
    // of the time. When trick questions are active then 50% of the
    // transformation structure are trick questions and so a 33% filter here
    // will achieve the 25% because this test is only performed when a trick
    // question has been selected.

    if (transformation.tags.indexOf('trick') != -1) {
      if (Math.random() > 0.333) {
        isValid = false;
      }
    }

    if (isValid) {
      break;
    }
  }

  return { entry, transformation, to_form, from_form, forms, options, isRedo: false };
}

function putQuestionData({ entry, transformation, to_form, from_form, forms, options, isRedo }) {

  var kanjiForms = forms["kanji"];
  var kanaForms = forms["hiragana"];
  var furiganaForms = forms["furigana"];

  var givenWord;

  if (options["kana"]) {
    givenWord = getRandomElementInArray(kanaForms[from_form]);
  } else {
    givenWord = getRandomElementInArray(wordWithFurigana(furiganaForms[from_form]));
  }

  var question = "What is the " + transformation.phrase + " version of " +
    givenWord;

  var answer = kanjiForms[to_form];
  var answer2 = kanaForms[to_form];
  var answerWithFurigana = wordWithFurigana(furiganaForms[to_form]);

  if (options["kana"]) {
    answer = answer2;
    answerWithFurigana = kanaForms[to_form];
  }

  $('#question').html(question);

  questionData = {
    entry: entry,
    transformation: transformation,
    question: question,
    answer: answer,
    answer2: answer2,
    answerWithFurigana: answerWithFurigana,
    givenWord: givenWord,

    isRedo: isRedo,

    _forms: forms,
    _to_form: to_form,
    _from_form: from_form
  };

  // Construct the explanation page.

  var groupLabels = {
    "godan": "godan verb",
    "ichidan": "ichidan verb",
    "iku": "godan verb",
    "suru": "suru verb",
    "kuru": "special verb",
    "i-adjective": "い adjective",
    "ii": "i-adjective",
    "na-adjective": "な adjective",
  };

  var dictionary = words[questionData.entry].conjugations["dictionary"]

  if (words[questionData.entry].group == "na-adjective") {
    dictionary = dictionary.replace(/だ$/, '')
  }

  if (!options["kana"]) {
    dictionary = wordWithFurigana(dictionary);
  } else {
    dictionary = kanaForm(dictionary);
  }

  $('#explain-given').html(givenWord);
  $('#explain-given-tags').html(questionData.transformation.from_tags.map(function (tag) { return "<span class='tag'>" + tag + "</span>"; }).join(" "));
  $('.explain-given-dictionary').html(dictionary);
  $('#explain-group').html(groupLabels[words[questionData.entry].group]);
  $('.explain-transform').html(questionData.transformation.phrase);
  $('.explain-answer-tags').html(questionData.transformation.to_tags.map(function (tag) { return "<span class='tag'>" + tag + "</span>"; }).join(" "));
  $('.explain-answer-tags2').html(questionData.transformation.to_tags.join(" "));
  $('.explain-answer').html(commaList(questionData.answerWithFurigana, "or"));

  $('.explain-answer-as-list').empty();

  questionData.answerWithFurigana.forEach(function (answer) {
    console.log("Doing answer");
    $('.explain-answer-as-list').append("<li>" + answer);
  });

  if (window.questionData.transformation.tags.indexOf("trick") != -1) {
    $('.explain-trick').show();
    $('.explain-no-trick').hide();
  } else {
    $('.explain-trick').hide();
    $('.explain-no-trick').show();
  }

  if (questionData.transformation.to == "dictionary") {
    $('.explain-hide-end').hide();
  } else {
    $('.explain-hide-end').show();
  }

  if (questionData.answer.length == 1) {
    $('.explain-answer-single').show();
    $('.explain-answer-multiple').hide();
  } else {
    $('.explain-answer-single').hide();
    $('.explain-answer-multiple').show();
  }

  $('#next').prop('disabled', true);
  $('#response').html("");
  $('#message').html("");

  $('#proceed').hide();
  $('#explanation').hide();
  $('#input').show();
  $('#answer').focus();
}

function generateQuestion() {
  putQuestionData(generateQuestionData());
}

function putQuedQuestion() {
  const quedRedoQuestion = redoQuestionQue.shift();
  if (!redoQuestionQue) { throw new Error("Called putQuedQuestion with no questions in que"); }

  putQuestionData({
    entry: quedRedoQuestion.entry,
    transformation: quedRedoQuestion.transformation,
    forms: quedRedoQuestion._forms,
    to_form: quedRedoQuestion._to_form,
    from_form: quedRedoQuestion._from_form,
    options: getOptions(),
    isRedo: true
  });
}

// called in HTML, form element submit
function processAnswer() {

  var response = wanakana.toHiragana(
    $('#answer').val().toString().trim()
  );

  if (response == "")
    return;

  var correct =
    questionData.answer.indexOf(response) != -1 ||
    questionData.answer2.indexOf(response) != -1;

  var cssClass = correct ? "correct" : "incorrect";

  log.history.push({
    question: questionData.question,
    response: response,
    answer: questionData.answerWithFurigana,
    kana: questionData.answer2,
    correct: correct,
    isRedo: questionData.isRedo
  });

  $('#answer').val("");
  $('#response').prop('class', cssClass).text(response);
  $('#next').prop('disabled', false);

  $('#message').html(
    "<div>The correct answer was " +
    commaList(questionData.answerWithFurigana, "or") +
    "</div>"
  );

  explain();

  if (!correct) {
    addQuestionToQue(questionData);
  }

  $('#input').hide();
  $('#proceed').show();
  $('#proceed button').focus();

  updateHistoryView(log);
}

function addQuestionToQue(question) {
  console.log(question);
  redoQuestionQue.push(question);
}

function updateHistoryView(log) {

  var review = $('<table>');

  var total = 0;
  var correct = 0;

  var header_tr = $('<tr>');

  header_tr.append($('<th>Question</th>'));
  header_tr.append($('<th>Answer</th>'));
  header_tr.append($('<th>Response</th>'));

  review.append(header_tr);

  log.history.forEach(function (entry) {

    total++;

    if (entry.correct) {
      correct++;
    }

    var tr = $('<tr>');

    var td1 = $('<td>');
    var td2 = $('<td>');
    var td3 = $('<td>');

    td1.html(entry.question);
    td2.html(commaList(entry.answer, "or"));
    td3.text(entry.response);

    tr.append(td1);
    tr.append(td2);
    tr.append(td3);

    if (entry.correct) {
      td3.append("<span class='answer-correct'> ○</span>");
      tr.addClass("correct");
    } else {
      td3.append("<span class='answer-wrong'> ×</span>");
      tr.addClass("incorrect");
    }

    if (entry.isRedo) {
      tr.addClass("redo");
    }

    review.append(tr);
  });

  $('#history').empty().append(review);

  var resultString;

  if (correct == total) {
    resultString = "All correct";
  } else {
    resultString = correct + " of " + total + " correct";
  }

  $('#scoreSectionTitle').html("<h1>Result: " + resultString + "</h1>");
}

// called by HTML Form submittion
function proceed() {
  if (log.history.length >= $('#numQuestions').val()) {
    if (redoQuestionQue.length > 0) {
      putQuedQuestion();
    } else {
      endQuiz();
    }
  } else {
    generateQuestion();
  }
}

function showSplash() {
  $('#splash').show();
  $('#quizSection').hide();
  $('#scoreSection').hide();

  $('#go').focus();
}

function startQuiz() {
  $('#splash').hide();
  $('#quizSection').show();
  $('#scoreSection').hide();

  var options = getOptions();

  if (options.furigana_always) {
    $('body').addClass("furiganaAlways");
  } else {
    $('body').removeClass("furiganaAlways");
  }

  resetLog();
  generateQuestion();
}

function endQuiz() {
  $('#splash').hide();
  $('#quizSection').hide();
  $('#scoreSection').show();

  $('#backToStart').focus();
}

function arrayDifference(a, b) {
  // From http://stackoverflow.com/a/1723220
  return a.filter(function (x) { return b.indexOf(x) < 0 });
}

function arrayUnique(arr) {
  return arr.filter(function (value, index, self) {
    return self.indexOf(value) === index;
  });
}

function calculateTransitions() {
  function getTags(str) {
    var tags = str.split(" ");

    if ((tags.length == 1) && (tags[0] == "plain")) {
      tags = [];
    }

    return tags;
  }

  function calculateTags(tags) {
    tags = tags.split(" ");

    if (tags.indexOf("polite") == -1) {
      tags.splice(0, 0, "plain");
    }

    if (tags.indexOf("dictionary") != -1) {
      tags.splice(tags.indexOf("dictionary"), 1);
    }

    return tags;
  }

  var allTags = {};

  Object.keys(words).forEach(function (word) {

    Object.keys(words[word].conjugations).forEach(function (conjugation) {

      if (conjugation == "dictionary") {
        conjugation = "";
      }

      allTags[conjugation] = conjugation.split(" ");
    });
  });

  Object.keys(allTags).forEach(function (srcTag) {

    if (srcTag == "") { return; }

    for (var i = 0; i < allTags[srcTag].length; i++) {

      var tagWithDrop = allTags[srcTag].slice();

      tagWithDrop.splice(i, 1);

      var dstTag = tagWithDrop.join(" ");

      if (allTags[dstTag]) {

        if (srcTag == "") {
          srcTag = "dictionary";
        }

        if (dstTag == "") {
          dstTag = "dictionary";
        }

        // @ts-ignore
        transformations.push({ from: srcTag, to: dstTag });
        // @ts-ignore
        transformations.push({ from: dstTag, to: srcTag });
      }
    }

  });

  transformations.forEach(function (transformation) {

    var from = getTags(transformation.from);
    var to = getTags(transformation.to);

    var from_extra = {
      "negative": "affirmative",
      "past": "present",
      "polite": "plain",
      "te-form": "non-て",
      "potential": "non-potential",
      "imperative": "non-imperative",
      "causative": "non-causative",
      "passive": "active",
      "progressive": "non-progressive",
      "desire": "&apos;non-desire&apos;",
      "volitional": "non-volitional",
    };

    var to_extra = {
      "negative": "negative",
      "past": "past",
      "polite": "polite",
      "te-form": "て",
      "potential": "potential",
      "imperative": "imperative",
      "causative": "causative",
      "passive": "passive",
      "progressive": "progressive",
      "desire": "&apos;desire&apos;",
      "volitional": "volitional",
    };

    var phrase;

    phrase = phrase || from_extra[arrayDifference(from, to)[0]];
    phrase = phrase || to_extra[arrayDifference(to, from)[0]];

    transformation.phrase = phrase;

    transformation.from_tags = calculateTags(transformation.from);
    transformation.to_tags = calculateTags(transformation.to);
    transformation.tags = arrayUnique(calculateTags(transformation.from).concat(calculateTags(transformation.to)));
  });

  // Add trick forms

  var trick_forms = [];

  transformations.forEach(function (transformation) {
    trick_forms.push({
      from: transformation.to,
      to: transformation.to,
      phrase: transformation.phrase,
      from_tags: transformation.to_tags,
      to_tags: transformation.to_tags,
      tags: transformation.tags.concat(["trick"])
    });
  });

  transformations = transformations.concat(trick_forms);
}

function updateOptionSummary() {

  // Calculate how many questions will apply

  var options = getOptions();
  var applicable = 0;

  Object.keys(words).forEach(function (word) {

    var forms = getVerbForms(word);

    transformations.forEach(function (transformation) {

      if (isValidQuestion(word, forms, transformation, options)) {
        applicable++;
      }
    });
  });

  $("#questionCount").text(applicable);
}

function explain() {
  $('#explanation').show();
  $('#explain-proceed-button').focus();
}

function getOptions() {

  var options = ["plain", "polite", "negative", "past", "te-form",
    "progressive", "potential", "imperative", "passive", "causative",
    "godan", "ichidan", "iku", "kuru", "suru", "i-adjective", "na-adjective",
    "ii", "desire", "volitional", "trick", "kana", "furigana_always"];

  var result = {};

  options.forEach(function (option) {
    result[option] = $('#' + option).is(':checked') != false;
  });

  return result;
}

$('window').ready(function () {

  calculateAllConjugations();
  calculateTransitions();

  $('#go').click(startQuiz);
  $('#backToStart').click(showSplash);

  $('div.options input').click(updateOptionSummary);
  $('input#trick').click(updateOptionSummary);

  wanakana.bind($('#answer')[0]);

  updateOptionSummary();

  showSplash();
});
