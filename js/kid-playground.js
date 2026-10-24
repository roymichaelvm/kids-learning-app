/**
 * Lumina Learning Hub — 6+ Little Explorer Playground
 * Covers kid category navigation, flashcards, sub-modes (letters, words, sentences),
 * picture match quiz, 4-choice cloud quizzes, and daily stickers.
 */
(function (window) {
  'use strict';

  const escapeHtml = window.escapeHtml || function (str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };
  const showToast = function (msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
  };

  let kidSubMode = 'words';
  let kidCardIdx = 0;
  let kidQuizIdx = 0;
  let currentKidQuizAnswer = null;
  let currentKidCloudQuestion = null;
  let hasFailedFirstAttempt = false;
  let kidHintRevealed = false;
  let currentKidClueText = '';
  let mathOpFilter = 'all';
  let kidViewTab = 'practice'; // 'practice' | 'flashcards'

  const ALL_KID_CATEGORIES = [
    { key: 'spelling', emoji: '🐝', name: 'Spelling Bee' },
    { key: 'comprehension', emoji: '📖', name: 'Story Reading' },
    { key: 'grammar', emoji: '✏️', name: 'Grammar' },
    { key: 'numbers', emoji: '🔢', name: 'Numbers & Math' },
    { key: 'phonics', emoji: '🔤', name: 'Sight Words' },
    { key: 'animals', emoji: '🦁', name: 'Animals' },
    { key: 'ai', emoji: '🤖', name: 'AI Basics' },
    { key: 'malayalam', emoji: '🌴', name: 'Malayalam' },
    { key: 'hindi', emoji: '🪔', name: 'Hindi' },
    { key: 'spanish', emoji: '🇪🇸', name: 'Spanish' },
    { key: 'french', emoji: '🇫🇷', name: 'French' },
    { key: 'italian', emoji: '🇮🇹', name: 'Italian' }
  ];

  // All world-language pack categories — the single source of truth for
  // "is this a language pack?" checks (options show English meanings,
  // hints speak the word, etc.). Add new languages HERE only.
  const LANG_PACK_CATEGORIES = ['malayalam', 'hindi', 'spanish', 'french', 'italian'];
  function isLangPackCategory(cat) { return LANG_PACK_CATEGORIES.indexOf(cat) !== -1; }

  // 500 Kid-Friendly Math Items across Addition (125), Subtraction (125), Multiplication (125), and Division (125)
  // (100 originals per operation + 100 generated 2026-10-24, answers computed arithmetically and validated)
  // Format: [op, emoji, cardEq, cardMeaning, speech, questionPrompt, ans, d1, d2, d3, explanation]
  const EXTRA_MATH_BANK = [
    // ➕ ADDITION (25 items)
    ['addition', '🍎', '3 + 4 = 7', '3 Apples + 4 Apples = 7 Apples!', 'Three plus four equals seven!', 'What is 3 + 4?', '7', '6', '8', '9', 'Count up 4 from 3: 4, 5, 6, 7!'],
    ['addition', '🌟', '5 + 6 = 11', 'Near Double: 5 + 5 is 10, plus 1 more is 11!', 'Five plus six equals eleven!', 'What is 5 + 6?', '11', '10', '12', '13', '5 + 5 = 10, so 5 + 6 is 1 more than 10, which is 11!'],
    ['addition', '🎈', '8 + 5 = 13', 'Make 10 First: 8 + 2 = 10, plus 3 = 13!', 'Eight plus five equals thirteen!', 'What is 8 + 5?', '13', '12', '14', '15', '8 + 2 makes 10, and 3 more makes 13!'],
    ['addition', '🐶', '6 + 6 = 12', 'Double Six is Twelve! (A Dozen)', 'Six plus six equals twelve!', 'What is 6 + 6?', '12', '10', '11', '14', 'Double 6 is 12!'],
    ['addition', '🦋', '7 + 7 = 14', 'Double Seven is Fourteen! (Two Weeks)', 'Seven plus seven equals fourteen!', 'What is 7 + 7?', '14', '12', '13', '15', 'Double 7 equals 14!'],
    ['addition', '🖍️', '8 + 8 = 16', 'Double Eight is Sixteen Crayons!', 'Eight plus eight equals sixteen!', 'What is 8 + 8?', '16', '14', '15', '18', 'Double 8 equals 16!'],
    ['addition', '🍓', '9 + 9 = 18', 'Double Nine is Eighteen Berries!', 'Nine plus nine equals eighteen!', 'What is 9 + 9?', '18', '16', '17', '19', 'Double 9 equals 18!'],
    ['addition', '🚀', '9 + 4 = 13', 'Add with 9: 9 + 1 = 10, plus 3 = 13!', 'Nine plus four equals thirteen!', 'What is 9 + 4?', '13', '11', '12', '14', 'Give 1 from 4 to 9 to make 10, then 10 + 3 = 13!'],
    ['addition', '🐢', '9 + 6 = 15', 'Add with 9: 10 + 5 = 15!', 'Nine plus six equals fifteen!', 'What is 9 + 6?', '15', '14', '16', '17', '9 + 1 = 10, and 10 + 5 = 15!'],
    ['addition', '🌻', '7 + 8 = 15', 'Near Double: 7 + 7 = 14, plus 1 = 15!', 'Seven plus eight equals fifteen!', 'What is 7 + 8?', '15', '13', '14', '16', '7 + 7 is 14, plus 1 more is 15!'],
    ['addition', '🍪', '12 + 5 = 17', 'Add the Ones: 2 + 5 = 7, so 12 + 5 = 17!', 'Twelve plus five equals seventeen!', 'Mia has 12 cookies and bakes 5 more. How many cookies does she have in all?', '17', '15', '16', '18', 'Add the ones: 2 + 5 = 7, plus 1 ten makes 17!'],
    ['addition', '🚗', '14 + 6 = 20', 'Number Bond: 4 + 6 = 10, so 14 + 6 = 20!', 'Fourteen plus six equals twenty!', 'What is 14 + 6?', '20', '18', '19', '21', '4 + 6 = 10, plus 10 = 20!'],
    ['addition', '📚', '15 + 5 = 20', '15 Books + 5 Books = 20 Books!', 'Fifteen plus five equals twenty!', 'Leo read 15 pages on Monday and 5 pages on Tuesday. How many pages did he read?', '20', '18', '19', '25', '15 + 5 = 20 pages in total!'],
    ['addition', '🏀', '11 + 8 = 19', '1 + 8 = 9 in the ones place -> 19!', 'Eleven plus eight equals nineteen!', 'What is 11 + 8?', '19', '17', '18', '20', '10 + (1 + 8) = 19!'],
    ['addition', '🐠', '20 + 30 = 50', '2 Tens + 3 Tens = 5 Tens (50)!', 'Twenty plus thirty equals fifty!', 'What is 20 + 30?', '50', '40', '60', '70', '2 tens + 3 tens = 5 tens, which is 50!'],
    ['addition', '🪙', '25 + 10 = 35', 'Add 1 Ten to 25 to get 35!', 'Twenty-five plus ten equals thirty-five!', 'What is 25 + 10?', '35', '26', '30', '45', 'Adding 10 increases the tens digit by 1: 25 -> 35!'],
    ['addition', '🎨', '16 + 7 = 23', '16 + 4 = 20, plus 3 more = 23!', 'Sixteen plus seven equals twenty-three!', 'What is 16 + 7?', '23', '21', '22', '24', '16 + 4 makes 20, and 3 more makes 23!'],
    ['addition', '🐝', '18 + 6 = 24', '18 + 2 = 20, plus 4 more = 24!', 'Eighteen plus six equals twenty-four!', 'There are 18 bees in a hive and 6 more fly in. How many bees are there now?', '24', '22', '23', '26', '18 + 2 = 20, and 20 + 4 = 24!'],
    ['addition', '🦕', '24 + 12 = 36', '20 + 10 = 30 and 4 + 2 = 6 -> 36!', 'Twenty-four plus twelve equals thirty-six!', 'What is 24 + 12?', '36', '32', '34', '38', 'Add tens (20 + 10 = 30) and ones (4 + 2 = 6) to get 36!'],
    ['addition', '🧁', '32 + 15 = 47', '30 + 10 = 40 and 2 + 5 = 7 -> 47!', 'Thirty-two plus fifteen equals forty-seven!', 'What is 32 + 15?', '47', '45', '46', '48', '30 + 10 = 40 and 2 + 5 = 7, making 47!'],
    ['addition', '⚽', '40 + 40 = 80', '4 Tens + 4 Tens = 8 Tens (80)!', 'Forty plus forty equals eighty!', 'What is 40 + 40?', '80', '60', '70', '90', '4 tens + 4 tens = 8 tens (80)!'],
    ['addition', '🌈', '3 + 5 + 2 = 10', 'Add 3 + 2 = 5 first, then 5 + 5 = 10!', 'Three plus five plus two equals ten!', 'What is 3 + 5 + 2?', '10', '8', '9', '11', '3 + 5 = 8, and 8 + 2 = 10!'],
    ['addition', '🎁', '4 + 6 + 5 = 15', '4 + 6 = 10, then 10 + 5 = 15!', 'Four plus six plus five equals fifteen!', 'What is 4 + 6 + 5?', '15', '13', '14', '16', 'First pair 4 + 6 = 10, then add 5 to get 15!'],
    ['addition', '🎪', '50 + 25 = 75', '50 + 20 = 70, plus 5 = 75!', 'Fifty plus twenty-five equals seventy-five!', 'What is 50 + 25?', '75', '65', '70', '85', '50 + 25 equals 75!'],
    ['addition', '🏆', '45 + 5 = 50', '5 + 5 = 10, so 45 + 5 jumps to 50!', 'Forty-five plus five equals fifty!', 'What is 45 + 5?', '50', '40', '48', '55', '45 plus 5 completes the next ten: 50!'],

    // ➖ SUBTRACTION (25 items)
    ['subtraction', '🍎', '8 - 3 = 5', 'Start with 8, take away 3 -> 5 left!', 'Eight minus three equals five!', 'What is 8 - 3?', '5', '4', '6', '7', 'Count back 3 from 8: 7, 6, 5!'],
    ['subtraction', '🎈', '10 - 4 = 6', 'Number Bond to 10: 10 minus 4 is 6!', 'Ten minus four equals six!', 'What is 10 - 4?', '6', '4', '5', '7', 'Because 4 + 6 = 10, 10 - 4 = 6!'],
    ['subtraction', '🍪', '12 - 5 = 7', '12 - 2 = 10, then 10 - 3 = 7!', 'Twelve minus five equals seven!', 'Sam had 12 cookies and ate 5. How many cookies are left?', '7', '5', '6', '8', '5 + 7 = 12, so 12 - 5 = 7!'],
    ['subtraction', '🐸', '11 - 3 = 8', 'Count back 3 from 11: 10, 9, 8!', 'Eleven minus three equals eight!', 'What is 11 - 3?', '8', '7', '9', '6', '11 minus 3 equals 8!'],
    ['subtraction', '🌟', '14 - 7 = 7', 'Half of 14 is 7 (Because 7 + 7 = 14)!', 'Fourteen minus seven equals seven!', 'What is 14 - 7?', '7', '6', '8', '9', '7 + 7 = 14, so 14 - 7 = 7!'],
    ['subtraction', '🦋', '15 - 6 = 9', '15 - 5 = 10, minus 1 more = 9!', 'Fifteen minus six equals nine!', 'What is 15 - 6?', '9', '7', '8', '10', 'Because 9 + 6 = 15, 15 - 6 = 9!'],
    ['subtraction', '🐦', '13 - 4 = 9', '13 birds on a branch, 4 fly away -> 9 left!', 'Thirteen minus four equals nine!', 'There were 13 birds in a tree. 4 flew away. How many birds stayed?', '9', '7', '8', '10', '13 - 3 = 10, and 10 - 1 = 9!'],
    ['subtraction', '🍓', '16 - 8 = 8', 'Half of 16 is 8 (8 + 8 = 16)!', 'Sixteen minus eight equals eight!', 'What is 16 - 8?', '8', '6', '7', '9', 'Double 8 is 16, so 16 - 8 = 8!'],
    ['subtraction', '🖍️', '17 - 9 = 8', 'Because 9 + 8 = 17, 17 - 9 = 8!', 'Seventeen minus nine equals eight!', 'What is 17 - 9?', '8', '7', '9', '10', 'Count up from 9 to 17: 9 + 8 = 17!'],
    ['subtraction', '🚗', '18 - 9 = 9', 'Half of 18 is 9 (9 + 9 = 18)!', 'Eighteen minus nine equals nine!', 'What is 18 - 9?', '9', '7', '8', '10', 'Double 9 is 18, so 18 - 9 = 9!'],
    ['subtraction', '🍕', '20 - 5 = 15', 'Count back 5 from 20 -> 15!', 'Twenty minus five equals fifteen!', 'What is 20 - 5?', '15', '14', '16', '10', '15 + 5 = 20, so 20 - 5 = 15!'],
    ['subtraction', '🎈', '20 - 8 = 12', '10 - 8 = 2, plus 10 = 12!', 'Twenty minus eight equals twelve!', 'A clown had 20 balloons and gave 8 to kids. How many balloons are left?', '12', '10', '11', '14', '20 minus 8 leaves 12 balloons!'],
    ['subtraction', '📚', '19 - 6 = 13', 'Subtract the ones: 9 - 6 = 3 -> 13!', 'Nineteen minus six equals thirteen!', 'What is 19 - 6?', '13', '12', '14', '15', 'In the ones place 9 - 6 = 3, so 19 - 6 = 13!'],
    ['subtraction', '🐠', '25 - 5 = 20', 'Take away the 5 ones -> 20 left!', 'Twenty-five minus five equals twenty!', 'What is 25 - 5?', '20', '15', '21', '30', '25 minus 5 ones leaves 2 tens (20)!'],
    ['subtraction', '🪙', '30 - 10 = 20', '3 Tens minus 1 Ten = 2 Tens (20)!', 'Thirty minus ten equals twenty!', 'What is 30 - 10?', '20', '10', '15', '25', '3 tens - 1 ten = 2 tens (20)!'],
    ['subtraction', '🧁', '24 - 10 = 14', 'Take 1 Ten away from 24 -> 14!', 'Twenty-four minus ten equals fourteen!', 'What is 24 - 10?', '14', '12', '15', '20', 'Subtracting 10 reduces the tens digit by 1: 24 -> 14!'],
    ['subtraction', '🏀', '28 - 6 = 22', 'Subtract ones: 8 - 6 = 2, so 28 - 6 = 22!', 'Twenty-eight minus six equals twenty-two!', 'What is 28 - 6?', '22', '20', '21', '24', '8 ones minus 6 ones is 2 ones, so 28 - 6 = 22!'],
    ['subtraction', '🌻', '35 - 15 = 20', '35 minus 5 is 30, minus 10 is 20!', 'Thirty-five minus fifteen equals twenty!', 'What is 35 - 15?', '20', '15', '25', '30', '30 - 10 = 20 and 5 - 5 = 0!'],
    ['subtraction', '🦕', '40 - 20 = 20', 'Half of 40 is 20!', 'Forty minus twenty equals twenty!', 'What is 40 - 20?', '20', '10', '25', '30', '4 tens minus 2 tens equals 2 tens (20)!'],
    ['subtraction', '🎨', '50 - 10 = 40', '5 Tens minus 1 Ten = 4 Tens (40)!', 'Fifty minus ten equals forty!', 'What is 50 - 10?', '40', '30', '35', '45', '50 take away 10 is 40!'],
    ['subtraction', '🐝', '22 - 7 = 15', '22 - 2 = 20, then 20 - 5 = 15!', 'Twenty-two minus seven equals fifteen!', 'What is 22 - 7?', '15', '13', '14', '16', 'Because 15 + 7 = 22, 22 - 7 = 15!'],
    ['subtraction', '🎁', '36 - 12 = 24', '30 - 10 = 20 and 6 - 2 = 4 -> 24!', 'Thirty-six minus twelve equals twenty-four!', 'What is 36 - 12?', '24', '22', '26', '28', 'Subtract tens (30 - 10 = 20) and ones (6 - 2 = 4) -> 24!'],
    ['subtraction', '🚀', '60 - 30 = 30', '6 Tens minus 3 Tens = 3 Tens (30)!', 'Sixty minus thirty equals thirty!', 'What is 60 - 30?', '30', '20', '35', '40', 'Half of 60 is 30!'],
    ['subtraction', '🌈', '48 - 18 = 30', '8 - 8 = 0 ones, and 40 - 10 = 30!', 'Forty-eight minus eighteen equals thirty!', 'What is 48 - 18?', '30', '20', '28', '38', '48 minus 8 is 40, and 40 minus 10 is 30!'],
    ['subtraction', '🏆', '100 - 50 = 50', 'Half of 100 is 50!', 'One hundred minus fifty equals fifty!', 'What is 100 - 50?', '50', '40', '60', '75', '50 + 50 = 100, so 100 - 50 = 50!'],

    // ✖️ MULTIPLICATION (25 items)
    ['multiplication', '👟', '2 × 3 = 6', '3 Pairs of Shoes: 2 + 2 + 2 = 6!', 'Two times three equals six!', 'What is 2 × 3?', '6', '5', '8', '9', '3 groups of 2: 2 + 2 + 2 = 6!'],
    ['multiplication', '🕷️', '2 × 4 = 8', '2 Groups of 4 = 8!', 'Two times four equals eight!', 'What is 2 × 4?', '8', '6', '10', '12', 'Double 4 is 8!'],
    ['multiplication', '🖐️', '2 × 5 = 10', '2 Hands with 5 Fingers = 10 Fingers!', 'Two times five equals ten!', 'Each hand has 5 fingers. How many fingers are on 2 hands (2 × 5)?', '10', '7', '12', '15', '2 groups of 5 equals 10!'],
    ['multiplication', '🥚', '2 × 6 = 12', '2 Rows of 6 Eggs = 12 Eggs (1 Dozen)!', 'Two times six equals twelve!', 'What is 2 × 6?', '12', '8', '10', '14', 'Double 6 is 12!'],
    ['multiplication', '📅', '2 × 7 = 14', '2 Weeks × 7 Days = 14 Days!', 'Two times seven equals fourteen!', 'There are 7 days in 1 week. How many days are in 2 weeks (2 × 7)?', '14', '12', '15', '16', '7 + 7 = 14 days!'],
    ['multiplication', '🐙', '2 × 8 = 16', '2 Octopuses × 8 Legs = 16 Legs!', 'Two times eight equals sixteen!', 'What is 2 × 8?', '16', '14', '18', '20', 'Double 8 is 16!'],
    ['multiplication', '🚲', '2 × 9 = 18', '9 Bicycles × 2 Wheels = 18 Wheels!', 'Two times nine equals eighteen!', 'What is 2 × 9?', '18', '16', '19', '20', 'Double 9 is 18!'],
    ['multiplication', '☘️', '3 × 3 = 9', '3 Clovers with 3 Leaves = 9 Leaves!', 'Three times three equals nine!', 'What is 3 × 3?', '9', '6', '8', '12', '3 + 3 + 3 = 9!'],
    ['multiplication', '📐', '3 × 4 = 12', '3 Squares × 4 Sides = 12 Sides!', 'Three times four equals twelve!', 'What is 3 × 4?', '12', '7', '9', '15', '3 groups of 4: 4 + 4 + 4 = 12!'],
    ['multiplication', '⭐', '3 × 5 = 15', '3 Stars × 5 Points = 15 Points!', 'Three times five equals fifteen!', 'What is 3 × 5?', '15', '10', '12', '20', 'Skip count by 5 three times: 5, 10, 15!'],
    ['multiplication', '🐞', '3 × 6 = 18', '3 Ladybugs × 6 Legs = 18 Legs!', 'Three times six equals eighteen!', 'What is 3 × 6?', '18', '12', '15', '21', '6 + 6 + 6 = 18!'],
    ['multiplication', '🌈', '3 × 7 = 21', '3 Groups of 7 = 21!', 'Three times seven equals twenty-one!', 'What is 3 × 7?', '21', '18', '20', '24', '7 + 7 + 7 = 21!'],
    ['multiplication', '🐶', '4 × 4 = 16', '4 Dogs × 4 Paws = 16 Paws!', 'Four times four equals sixteen!', '4 puppies each have 4 paws. How many paws do they have altogether (4 × 4)?', '16', '8', '12', '20', '4 + 4 + 4 + 4 = 16 paws!'],
    ['multiplication', '🪙', '4 × 5 = 20', '4 Nickels × 5 Cents = 20 Cents!', 'Four times five equals twenty!', 'What is 4 × 5?', '20', '15', '24', '25', 'Skip count by 5 four times: 5, 10, 15, 20!'],
    ['multiplication', '🧁', '4 × 6 = 24', '4 Boxes × 6 Cupcakes = 24 Cupcakes!', 'Four times six equals twenty-four!', 'What is 4 × 6?', '24', '18', '20', '28', '4 groups of 6 equals 24!'],
    ['multiplication', '🚗', '4 × 7 = 28', '4 Weeks × 7 Days = 28 Days!', 'Four times seven equals twenty-eight!', 'What is 4 × 7?', '28', '21', '24', '32', '4 × 7 = 28!'],
    ['multiplication', '📦', '4 × 8 = 32', '4 Packs × 8 Crayons = 32 Crayons!', 'Four times eight equals thirty-two!', 'What is 4 × 8?', '32', '24', '28', '36', 'Double 8 is 16, and double 16 is 32!'],
    ['multiplication', '🖐️', '5 × 5 = 25', '5 Groups of 5 = 25!', 'Five times five equals twenty-five!', 'What is 5 × 5?', '25', '20', '30', '35', '5, 10, 15, 20, 25!'],
    ['multiplication', '🕒', '5 × 6 = 30', '6 Jumps of 5 Minutes = 30 Minutes!', 'Five times six equals thirty!', 'What is 5 × 6?', '30', '25', '35', '36', '5 × 6 equals 30!'],
    ['multiplication', '🌻', '5 × 7 = 35', '7 Groups of 5 = 35!', 'Five times seven equals thirty-five!', 'What is 5 × 7?', '35', '25', '30', '40', 'Skip count by 5 seven times to get 35!'],
    ['multiplication', '🦋', '5 × 8 = 40', '8 Groups of 5 = 40!', 'Five times eight equals forty!', 'What is 5 × 8?', '40', '35', '45', '48', '5 × 8 = 40!'],
    ['multiplication', '🎲', '6 × 6 = 36', '6 Dice × 6 Dots = 36 Dots!', 'Six times six equals thirty-six!', 'What is 6 × 6?', '36', '30', '32', '42', '6 groups of 6 equals 36!'],
    ['multiplication', '🌟', '7 × 7 = 49', '7 Rows of 7 Stars = 49 Stars!', 'Seven times seven equals forty-nine!', 'What is 7 × 7?', '49', '42', '47', '56', '7 × 7 = 49!'],
    ['multiplication', '🔟', '10 × 4 = 40', '4 Tens = 40!', 'Ten times four equals forty!', 'What is 10 × 4?', '40', '14', '30', '50', '10, 20, 30, 40!'],
    ['multiplication', '💯', '10 × 10 = 100', '10 Tens Make 100!', 'Ten times ten equals one hundred!', 'What is 10 × 10?', '100', '20', '90', '110', '10 groups of 10 make 100!'],

    // ➗ DIVISION (25 items)
    ['division', '🍪', '6 ÷ 2 = 3', 'Share 6 Cookies Equally Between 2 Kids = 3 Each!', 'Six divided by two equals three!', 'Share 6 cookies equally between 2 friends (6 ÷ 2). How many cookies does each friend get?', '3', '2', '4', '5', 'Because 2 × 3 = 6, 6 ÷ 2 = 3!'],
    ['division', '🍎', '8 ÷ 2 = 4', 'Half of 8 Apples is 4 Apples!', 'Eight divided by two equals four!', 'What is 8 ÷ 2?', '4', '2', '5', '6', '2 × 4 = 8, so 8 ÷ 2 = 4!'],
    ['division', '🎈', '10 ÷ 2 = 5', 'Split 10 Balloons into 2 Equal Groups = 5!', 'Ten divided by two equals five!', 'What is 10 ÷ 2?', '5', '4', '6', '8', 'Half of 10 is 5!'],
    ['division', '🧁', '12 ÷ 2 = 6', 'Half of 12 Cupcakes is 6 Cupcakes!', 'Twelve divided by two equals six!', 'What is 12 ÷ 2?', '6', '4', '5', '8', '2 × 6 = 12, so 12 ÷ 2 = 6!'],
    ['division', '🍓', '14 ÷ 2 = 7', '14 Berries Shared by 2 = 7 Each!', 'Fourteen divided by two equals seven!', 'What is 14 ÷ 2?', '7', '6', '8', '9', 'Because 2 × 7 = 14, 14 ÷ 2 = 7!'],
    ['division', '🖍️', '16 ÷ 2 = 8', 'Half of 16 Crayons is 8 Crayons!', 'Sixteen divided by two equals eight!', 'What is 16 ÷ 2?', '8', '6', '7', '9', '2 × 8 = 16, so 16 ÷ 2 = 8!'],
    ['division', '🌟', '9 ÷ 3 = 3', '9 Stars in 3 Equal Rows = 3 per Row!', 'Nine divided by three equals three!', 'What is 9 ÷ 3?', '3', '2', '4', '6', '3 × 3 = 9, so 9 ÷ 3 = 3!'],
    ['division', '🍕', '12 ÷ 3 = 4', '12 Pizza Slices Shared by 3 Kids = 4 Each!', 'Twelve divided by three equals four!', '3 kids share 12 pizza slices equally (12 ÷ 3). How many slices does each kid get?', '4', '3', '5', '6', '3 × 4 = 12, so 12 ÷ 3 = 4!'],
    ['division', '🐠', '15 ÷ 3 = 5', '15 Fish in 3 Bowls = 5 Fish per Bowl!', 'Fifteen divided by three equals five!', 'What is 15 ÷ 3?', '5', '3', '4', '6', 'Because 3 × 5 = 15, 15 ÷ 3 = 5!'],
    ['division', '🌺', '18 ÷ 3 = 6', '18 Flowers in 3 Vases = 6 per Vase!', 'Eighteen divided by three equals six!', 'What is 18 ÷ 3?', '6', '5', '7', '9', '3 × 6 = 18, so 18 ÷ 3 = 6!'],
    ['division', '📚', '21 ÷ 3 = 7', '21 Books on 3 Shelves = 7 per Shelf!', 'Twenty-one divided by three equals seven!', 'What is 21 ÷ 3?', '7', '6', '8', '9', '3 × 7 = 21, so 21 ÷ 3 = 7!'],
    ['division', '🚗', '12 ÷ 4 = 3', '12 Wheels on 4-Wheel Cars = 3 Cars!', 'Twelve divided by four equals three!', 'What is 12 ÷ 4?', '3', '2', '4', '6', '4 × 3 = 12, so 12 ÷ 4 = 3!'],
    ['division', '🐶', '16 ÷ 4 = 4', '16 Bones Shared Among 4 Dogs = 4 Each!', 'Sixteen divided by four equals four!', '4 dogs share 16 bones equally (16 ÷ 4). How many bones does each dog get?', '4', '3', '5', '6', '4 × 4 = 16, so 16 ÷ 4 = 4!'],
    ['division', '🎁', '20 ÷ 4 = 5', '20 Gifts in 4 Equal Stacks = 5 per Stack!', 'Twenty divided by four equals five!', 'What is 20 ÷ 4?', '5', '4', '6', '8', '4 × 5 = 20, so 20 ÷ 4 = 5!'],
    ['division', '🍬', '24 ÷ 4 = 6', '24 Candies Shared by 4 = 6 Each!', 'Twenty-four divided by four equals six!', 'What is 24 ÷ 4?', '6', '4', '5', '8', '4 × 6 = 24, so 24 ÷ 4 = 6!'],
    ['division', '📅', '28 ÷ 7 = 4', '28 Days ÷ 7 Days per Week = 4 Weeks!', 'Twenty-eight divided by seven equals four!', 'There are 7 days in a week. How many weeks is 28 days (28 ÷ 7)?', '4', '3', '5', '6', '7 × 4 = 28, so 28 ÷ 7 = 4 weeks!'],
    ['division', '🖐️', '15 ÷ 5 = 3', '15 Pennies in Stacks of 5 = 3 Stacks!', 'Fifteen divided by five equals three!', 'What is 15 ÷ 5?', '3', '2', '4', '5', '5 × 3 = 15, so 15 ÷ 5 = 3!'],
    ['division', '🪙', '20 ÷ 5 = 4', '20 Cents in Nickels (5¢) = 4 Nickels!', 'Twenty divided by five equals four!', 'What is 20 ÷ 5?', '4', '3', '5', '6', '5 × 4 = 20, so 20 ÷ 5 = 4!'],
    ['division', '⭐', '25 ÷ 5 = 5', '25 Stars in 5 Equal Groups = 5 per Group!', 'Twenty-five divided by five equals five!', 'What is 25 ÷ 5?', '5', '4', '6', '7', '5 × 5 = 25, so 25 ÷ 5 = 5!'],
    ['division', '🐝', '30 ÷ 5 = 6', '30 Bees in 5 Hives = 6 Bees per Hive!', 'Thirty divided by five equals six!', 'What is 30 ÷ 5?', '6', '5', '7', '8', '5 × 6 = 30, so 30 ÷ 5 = 6!'],
    ['division', '🌻', '35 ÷ 5 = 7', '35 Seeds in 5 Pots = 7 Seeds per Pot!', 'Thirty-five divided by five equals seven!', 'What is 35 ÷ 5?', '7', '5', '6', '8', '5 × 7 = 35, so 35 ÷ 5 = 7!'],
    ['division', '🥚', '24 ÷ 6 = 4', '24 Eggs in Cartons of 6 = 4 Cartons!', 'Twenty-four divided by six equals four!', 'What is 24 ÷ 6?', '4', '3', '5', '6', '6 × 4 = 24, so 24 ÷ 6 = 4!'],
    ['division', '🎲', '36 ÷ 6 = 6', '36 Dots Across 6 Equal Dice = 6 per Die!', 'Thirty-six divided by six equals six!', 'What is 36 ÷ 6?', '6', '5', '7', '8', '6 × 6 = 36, so 36 ÷ 6 = 6!'],
    ['division', '🔟', '40 ÷ 10 = 4', '40 Grouped by Tens = 4 Groups of 10!', 'Forty divided by ten equals four!', 'What is 40 ÷ 10?', '4', '3', '5', '10', '10 × 4 = 40, so 40 ÷ 10 = 4!'],
    ['division', '💯', '50 ÷ 10 = 5', '50 Grouped by Tens = 5 Groups of 10!', 'Fifty divided by ten equals five!', 'What is 50 ÷ 10?', '5', '4', '6', '10', '10 × 5 = 50, so 50 ÷ 10 = 5!'],
    // ➕ ADDITION — batch 2 (100 new, 2026-10-24)
    ['addition', '🦋', '89 + 4 = 93', 'Add the ones: 9 + 4 = 13, carry the ten!', 'Eighty-nine plus four equals ninety-three!', 'What is 89 + 4?', '93', '94', '92', '103', '9 + 4 = 13, plus 80 makes 93!'],
    ['addition', '🚀', '53 + 8 = 61', 'Add the ones: 3 + 8 = 11, carry the ten!', 'Fifty-three plus eight equals sixty-one!', 'What is 53 + 8?', '61', '62', '60', '71', '3 + 8 = 11, plus 50 makes 61!'],
    ['addition', '🐶', '38 + 7 = 45', 'Add the ones: 8 + 7 = 15, carry the ten!', 'Thirty-eight plus seven equals forty-five!', 'What is 38 + 7?', '45', '46', '44', '55', '8 + 7 = 15, plus 30 makes 45!'],
    ['addition', '🖍️', '97 + 7 = 104', 'Add the ones: 7 + 7 = 14, carry the ten!', 'Ninety-seven plus seven equals one hundred four!', 'What is 97 + 7?', '104', '105', '103', '114', '7 + 7 = 14, plus 90 makes 104!'],
    ['addition', '🎁', '57 + 7 = 64', 'Add the ones: 7 + 7 = 14, carry the ten!', 'Fifty-seven plus seven equals sixty-four!', 'What is 57 + 7?', '64', '65', '63', '74', '7 + 7 = 14, plus 50 makes 64!'],
    ['addition', '🚗', '65 + 7 = 72', 'Add the ones: 5 + 7 = 12, carry the ten!', 'Sixty-five plus seven equals seventy-two!', 'What is 65 + 7?', '72', '73', '71', '82', '5 + 7 = 12, plus 60 makes 72!'],
    ['addition', '🦁', '36 + 6 = 42', 'Add the ones: 6 + 6 = 12, carry the ten!', 'Thirty-six plus six equals forty-two!', 'What is 36 + 6?', '42', '43', '41', '52', '6 + 6 = 12, plus 30 makes 42!'],
    ['addition', '🦕', '76 + 7 = 83', 'Add the ones: 6 + 7 = 13, carry the ten!', 'Seventy-six plus seven equals eighty-three!', 'What is 76 + 7?', '83', '84', '82', '93', '6 + 7 = 13, plus 70 makes 83!'],
    ['addition', '🎯', '46 + 5 = 51', 'Add the ones: 6 + 5 = 11, carry the ten!', 'Forty-six plus five equals fifty-one!', 'What is 46 + 5?', '51', '52', '50', '61', '6 + 5 = 11, plus 40 makes 51!'],
    ['addition', '☀️', '19 + 9 = 28', 'Add the ones: 9 + 9 = 18, carry the ten!', 'Nineteen plus nine equals twenty-eight!', 'What is 19 + 9?', '28', '29', '27', '38', '9 + 9 = 18, plus 10 makes 28!'],
    ['addition', '⚽', '48 + 3 = 51', 'Add the ones: 8 + 3 = 11, carry the ten!', 'Forty-eight plus three equals fifty-one!', 'What is 48 + 3?', '51', '52', '50', '61', '8 + 3 = 11, plus 40 makes 51!'],
    ['addition', '🎈', '44 + 8 = 52', 'Add the ones: 4 + 8 = 12, carry the ten!', 'Forty-four plus eight equals fifty-two!', 'What is 44 + 8?', '52', '53', '51', '62', '4 + 8 = 12, plus 40 makes 52!'],
    ['addition', '🧩', '85 + 5 = 90', 'Add the ones: 5 + 5 = 10, carry the ten!', 'Eighty-five plus five equals ninety!', 'What is 85 + 5?', '90', '91', '89', '100', '5 + 5 = 10, plus 80 makes 90!'],
    ['addition', '🍇', '24 + 6 = 30', 'Add the ones: 4 + 6 = 10, carry the ten!', 'Twenty-four plus six equals thirty!', 'What is 24 + 6?', '30', '31', '29', '40', '4 + 6 = 10, plus 20 makes 30!'],
    ['addition', '🐢', '94 + 9 = 103', 'Add the ones: 4 + 9 = 13, carry the ten!', 'Ninety-four plus nine equals one hundred three!', 'What is 94 + 9?', '103', '104', '102', '113', '4 + 9 = 13, plus 90 makes 103!'],
    ['addition', '📚', '98 + 6 = 104', 'Add the ones: 8 + 6 = 14, carry the ten!', 'Ninety-eight plus six equals one hundred four!', 'What is 98 + 6?', '104', '105', '103', '114', '8 + 6 = 14, plus 90 makes 104!'],
    ['addition', '🎨', '59 + 8 = 67', 'Add the ones: 9 + 8 = 17, carry the ten!', 'Fifty-nine plus eight equals sixty-seven!', 'What is 59 + 8?', '67', '68', '66', '77', '9 + 8 = 17, plus 50 makes 67!'],
    ['addition', '📚', '73 + 8 = 81', 'Add the ones: 3 + 8 = 11, carry the ten!', 'Seventy-three plus eight equals eighty-one!', 'What is 73 + 8?', '81', '82', '80', '91', '3 + 8 = 11, plus 70 makes 81!'],
    ['addition', '🍓', '66 + 7 = 73', 'Add the ones: 6 + 7 = 13, carry the ten!', 'Sixty-six plus seven equals seventy-three!', 'What is 66 + 7?', '73', '74', '72', '83', '6 + 7 = 13, plus 60 makes 73!'],
    ['addition', '🐶', '98 + 4 = 102', 'Add the ones: 8 + 4 = 12, carry the ten!', 'Ninety-eight plus four equals one hundred two!', 'What is 98 + 4?', '102', '103', '101', '112', '8 + 4 = 12, plus 90 makes 102!'],
    ['addition', '🍪', '84 + 7 = 91', 'Add the ones: 4 + 7 = 11, carry the ten!', 'Eighty-four plus seven equals ninety-one!', 'What is 84 + 7?', '91', '92', '90', '101', '4 + 7 = 11, plus 80 makes 91!'],
    ['addition', '🦋', '85 + 6 = 91', 'Add the ones: 5 + 6 = 11, carry the ten!', 'Eighty-five plus six equals ninety-one!', 'What is 85 + 6?', '91', '92', '90', '101', '5 + 6 = 11, plus 80 makes 91!'],
    ['addition', '🍉', '36 + 7 = 43', 'Add the ones: 6 + 7 = 13, carry the ten!', 'Thirty-six plus seven equals forty-three!', 'What is 36 + 7?', '43', '44', '42', '53', '6 + 7 = 13, plus 30 makes 43!'],
    ['addition', '🧩', '44 + 6 = 50', 'Add the ones: 4 + 6 = 10, carry the ten!', 'Forty-four plus six equals fifty!', 'What is 44 + 6?', '50', '51', '49', '60', '4 + 6 = 10, plus 40 makes 50!'],
    ['addition', '🐘', '81 + 9 = 90', 'Add the ones: 1 + 9 = 10, carry the ten!', 'Eighty-one plus nine equals ninety!', 'What is 81 + 9?', '90', '91', '89', '100', '1 + 9 = 10, plus 80 makes 90!'],
    ['addition', '⚽', '36 + 20 = 56', 'Add the tens, then add the ones!', 'Thirty-six plus twenty equals fifty-six!', 'What is 36 + 20?', '56', '57', '55', '66', '30 + 20 = 50 tens, 6 + 0 = 6 ones, so 50 + 6 = 56!'],
    ['addition', '⚽', '28 + 36 = 64', 'Add the tens, then add the ones!', 'Twenty-eight plus thirty-six equals sixty-four!', 'What is 28 + 36?', '64', '65', '63', '74', '20 + 30 = 50 tens, 8 + 6 = 14 ones, so 50 + 14 = 64!'],
    ['addition', '🦕', '35 + 66 = 101', 'Add the tens, then add the ones!', 'Thirty-five plus sixty-six equals one hundred one!', 'What is 35 + 66?', '101', '102', '100', '111', '30 + 60 = 90 tens, 5 + 6 = 11 ones, so 90 + 11 = 101!'],
    ['addition', '⭐', '46 + 33 = 79', 'Add the tens, then add the ones!', 'Forty-six plus thirty-three equals seventy-nine!', 'What is 46 + 33?', '79', '80', '78', '89', '40 + 30 = 70 tens, 6 + 3 = 9 ones, so 70 + 9 = 79!'],
    ['addition', '🎨', '18 + 24 = 42', 'Add the tens, then add the ones!', 'Eighteen plus twenty-four equals forty-two!', 'What is 18 + 24?', '42', '43', '41', '52', '10 + 20 = 30 tens, 8 + 4 = 12 ones, so 30 + 12 = 42!'],
    ['addition', '🚀', '44 + 58 = 102', 'Add the tens, then add the ones!', 'Forty-four plus fifty-eight equals one hundred two!', 'What is 44 + 58?', '102', '103', '101', '112', '40 + 50 = 90 tens, 4 + 8 = 12 ones, so 90 + 12 = 102!'],
    ['addition', '🏀', '59 + 16 = 75', 'Add the tens, then add the ones!', 'Fifty-nine plus sixteen equals seventy-five!', 'What is 59 + 16?', '75', '76', '74', '85', '50 + 10 = 60 tens, 9 + 6 = 15 ones, so 60 + 15 = 75!'],
    ['addition', '🌙', '67 + 43 = 110', 'Add the tens, then add the ones!', 'Sixty-seven plus forty-three equals one hundred ten!', 'What is 67 + 43?', '110', '111', '109', '120', '60 + 40 = 100 tens, 7 + 3 = 10 ones, so 100 + 10 = 110!'],
    ['addition', '🌟', '63 + 12 = 75', 'Add the tens, then add the ones!', 'Sixty-three plus twelve equals seventy-five!', 'What is 63 + 12?', '75', '76', '74', '85', '60 + 10 = 70 tens, 3 + 2 = 5 ones, so 70 + 5 = 75!'],
    ['addition', '🐘', '63 + 44 = 107', 'Add the tens, then add the ones!', 'Sixty-three plus forty-four equals one hundred seven!', 'What is 63 + 44?', '107', '108', '106', '117', '60 + 40 = 100 tens, 3 + 4 = 7 ones, so 100 + 7 = 107!'],
    ['addition', '🐘', '17 + 27 = 44', 'Add the tens, then add the ones!', 'Seventeen plus twenty-seven equals forty-four!', 'What is 17 + 27?', '44', '45', '43', '54', '10 + 20 = 30 tens, 7 + 7 = 14 ones, so 30 + 14 = 44!'],
    ['addition', '☀️', '12 + 31 = 43', 'Add the tens, then add the ones!', 'Twelve plus thirty-one equals forty-three!', 'What is 12 + 31?', '43', '44', '42', '53', '10 + 30 = 40 tens, 2 + 1 = 3 ones, so 40 + 3 = 43!'],
    ['addition', '🐝', '18 + 34 = 52', 'Add the tens, then add the ones!', 'Eighteen plus thirty-four equals fifty-two!', 'What is 18 + 34?', '52', '53', '51', '62', '10 + 30 = 40 tens, 8 + 4 = 12 ones, so 40 + 12 = 52!'],
    ['addition', '🍓', '13 + 57 = 70', 'Add the tens, then add the ones!', 'Thirteen plus fifty-seven equals seventy!', 'What is 13 + 57?', '70', '71', '69', '80', '10 + 50 = 60 tens, 3 + 7 = 10 ones, so 60 + 10 = 70!'],
    ['addition', '🐘', '57 + 26 = 83', 'Add the tens, then add the ones!', 'Fifty-seven plus twenty-six equals eighty-three!', 'What is 57 + 26?', '83', '84', '82', '93', '50 + 20 = 70 tens, 7 + 6 = 13 ones, so 70 + 13 = 83!'],
    ['addition', '🎈', '18 + 21 = 39', 'Add the tens, then add the ones!', 'Eighteen plus twenty-one equals thirty-nine!', 'What is 18 + 21?', '39', '40', '38', '49', '10 + 20 = 30 tens, 8 + 1 = 9 ones, so 30 + 9 = 39!'],
    ['addition', '🎈', '47 + 15 = 62', 'Add the tens, then add the ones!', 'Forty-seven plus fifteen equals sixty-two!', 'What is 47 + 15?', '62', '63', '61', '72', '40 + 10 = 50 tens, 7 + 5 = 12 ones, so 50 + 12 = 62!'],
    ['addition', '🌙', '38 + 43 = 81', 'Add the tens, then add the ones!', 'Thirty-eight plus forty-three equals eighty-one!', 'What is 38 + 43?', '81', '82', '80', '91', '30 + 40 = 70 tens, 8 + 3 = 11 ones, so 70 + 11 = 81!'],
    ['addition', '🐘', '55 + 57 = 112', 'Add the tens, then add the ones!', 'Fifty-five plus fifty-seven equals one hundred twelve!', 'What is 55 + 57?', '112', '113', '111', '122', '50 + 50 = 100 tens, 5 + 7 = 12 ones, so 100 + 12 = 112!'],
    ['addition', '🦁', '47 + 35 = 82', 'Add the tens, then add the ones!', 'Forty-seven plus thirty-five equals eighty-two!', 'What is 47 + 35?', '82', '83', '81', '92', '40 + 30 = 70 tens, 7 + 5 = 12 ones, so 70 + 12 = 82!'],
    ['addition', '🦁', '34 + 45 = 79', 'Add the tens, then add the ones!', 'Thirty-four plus forty-five equals seventy-nine!', 'What is 34 + 45?', '79', '80', '78', '89', '30 + 40 = 70 tens, 4 + 5 = 9 ones, so 70 + 9 = 79!'],
    ['addition', '🌈', '27 + 34 = 61', 'Add the tens, then add the ones!', 'Twenty-seven plus thirty-four equals sixty-one!', 'What is 27 + 34?', '61', '62', '60', '71', '20 + 30 = 50 tens, 7 + 4 = 11 ones, so 50 + 11 = 61!'],
    ['addition', '🧩', '27 + 65 = 92', 'Add the tens, then add the ones!', 'Twenty-seven plus sixty-five equals ninety-two!', 'What is 27 + 65?', '92', '93', '91', '102', '20 + 60 = 80 tens, 7 + 5 = 12 ones, so 80 + 12 = 92!'],
    ['addition', '☀️', '19 + 48 = 67', 'Add the tens, then add the ones!', 'Nineteen plus forty-eight equals sixty-seven!', 'What is 19 + 48?', '67', '68', '66', '77', '10 + 40 = 50 tens, 9 + 8 = 17 ones, so 50 + 17 = 67!'],
    ['addition', '🍪', '35 + 41 = 76', 'Add the tens, then add the ones!', 'Thirty-five plus forty-one equals seventy-six!', 'What is 35 + 41?', '76', '77', '75', '86', '30 + 40 = 70 tens, 5 + 1 = 6 ones, so 70 + 6 = 76!'],
    ['addition', '🌟', '246 + 72 = 318', 'Add the hundreds, tens and ones!', 'Two hundred forty-six plus seventy-two equals three hundred eighteen!', 'What is 246 + 72?', '318', '319', '317', '328', '246 + 72: 2 hundred plus 72 is 318!'],
    ['addition', '🎵', '451 + 89 = 540', 'Add the hundreds, tens and ones!', 'Four hundred fifty-one plus eighty-nine equals five hundred forty!', 'What is 451 + 89?', '540', '541', '539', '550', '451 + 89: 4 hundred plus 89 is 540!'],
    ['addition', '🎵', '252 + 34 = 286', 'Add the hundreds, tens and ones!', 'Two hundred fifty-two plus thirty-four equals two hundred eighty-six!', 'What is 252 + 34?', '286', '287', '285', '296', '252 + 34: 2 hundred plus 34 is 286!'],
    ['addition', '🌟', '228 + 23 = 251', 'Add the hundreds, tens and ones!', 'Two hundred twenty-eight plus twenty-three equals two hundred fifty-one!', 'What is 228 + 23?', '251', '252', '250', '261', '228 + 23: 2 hundred plus 23 is 251!'],
    ['addition', '🍓', '187 + 27 = 214', 'Add the hundreds, tens and ones!', 'One hundred eighty-seven plus twenty-seven equals two hundred fourteen!', 'What is 187 + 27?', '214', '215', '213', '224', '187 + 27: 1 hundred plus 27 is 214!'],
    ['addition', '🪙', '122 + 53 = 175', 'Add the hundreds, tens and ones!', 'One hundred twenty-two plus fifty-three equals one hundred seventy-five!', 'What is 122 + 53?', '175', '176', '174', '185', '122 + 53: 1 hundred plus 53 is 175!'],
    ['addition', '🐠', '451 + 45 = 496', 'Add the hundreds, tens and ones!', 'Four hundred fifty-one plus forty-five equals four hundred ninety-six!', 'What is 451 + 45?', '496', '497', '495', '506', '451 + 45: 4 hundred plus 45 is 496!'],
    ['addition', '🎨', '279 + 13 = 292', 'Add the hundreds, tens and ones!', 'Two hundred seventy-nine plus thirteen equals two hundred ninety-two!', 'What is 279 + 13?', '292', '293', '291', '302', '279 + 13: 2 hundred plus 13 is 292!'],
    ['addition', '⭐', '363 + 67 = 430', 'Add the hundreds, tens and ones!', 'Three hundred sixty-three plus sixty-seven equals four hundred thirty!', 'What is 363 + 67?', '430', '431', '429', '440', '363 + 67: 3 hundred plus 67 is 430!'],
    ['addition', '🧩', '261 + 41 = 302', 'Add the hundreds, tens and ones!', 'Two hundred sixty-one plus forty-one equals three hundred two!', 'What is 261 + 41?', '302', '303', '301', '312', '261 + 41: 2 hundred plus 41 is 302!'],
    ['addition', '⚽', '223 + 15 = 238', 'Add the hundreds, tens and ones!', 'Two hundred twenty-three plus fifteen equals two hundred thirty-eight!', 'What is 223 + 15?', '238', '239', '237', '248', '223 + 15: 2 hundred plus 15 is 238!'],
    ['addition', '🐶', '282 + 85 = 367', 'Add the hundreds, tens and ones!', 'Two hundred eighty-two plus eighty-five equals three hundred sixty-seven!', 'What is 282 + 85?', '367', '368', '366', '377', '282 + 85: 2 hundred plus 85 is 367!'],
    ['addition', '🍪', '442 + 93 = 535', 'Add the hundreds, tens and ones!', 'Four hundred forty-two plus ninety-three equals five hundred thirty-five!', 'What is 442 + 93?', '535', '536', '534', '545', '442 + 93: 4 hundred plus 93 is 535!'],
    ['addition', '🎈', '248 + 70 = 318', 'Add the hundreds, tens and ones!', 'Two hundred forty-eight plus seventy equals three hundred eighteen!', 'What is 248 + 70?', '318', '319', '317', '328', '248 + 70: 2 hundred plus 70 is 318!'],
    ['addition', '🐢', '369 + 21 = 390', 'Add the hundreds, tens and ones!', 'Three hundred sixty-nine plus twenty-one equals three hundred ninety!', 'What is 369 + 21?', '390', '391', '389', '400', '369 + 21: 3 hundred plus 21 is 390!'],
    ['addition', '🐠', '25 + 24 = 49', 'Near Double: double 25 is 50!', 'Twenty-five plus twenty-four equals forty-nine!', 'What is 25 + 24?', '49', '50', '48', '51', 'Double 25 is 50, so 25 + 24 is 49!'],
    ['addition', '🎲', '18 + 17 = 35', 'Near Double: double 18 is 36!', 'Eighteen plus seventeen equals thirty-five!', 'What is 18 + 17?', '35', '36', '34', '37', 'Double 18 is 36, so 18 + 17 is 35!'],
    ['addition', '🍪', '26 + 27 = 53', 'Near Double: double 26 is 52!', 'Twenty-six plus twenty-seven equals fifty-three!', 'What is 26 + 27?', '53', '52', '54', '55', 'Double 26 is 52, so 26 + 27 is 53!'],
    ['addition', '🎲', '33 + 34 = 67', 'Near Double: double 33 is 66!', 'Thirty-three plus thirty-four equals sixty-seven!', 'What is 33 + 34?', '67', '66', '68', '69', 'Double 33 is 66, so 33 + 34 is 67!'],
    ['addition', '🖍️', '35 + 34 = 69', 'Near Double: double 35 is 70!', 'Thirty-five plus thirty-four equals sixty-nine!', 'What is 35 + 34?', '69', '70', '68', '71', 'Double 35 is 70, so 35 + 34 is 69!'],
    ['addition', '⭐', '16 + 15 = 31', 'Near Double: double 16 is 32!', 'Sixteen plus fifteen equals thirty-one!', 'What is 16 + 15?', '31', '32', '30', '33', 'Double 16 is 32, so 16 + 15 is 31!'],
    ['addition', '🐝', '45 + 45 = 90', 'Near Double: double 45 is 90!', 'Forty-five plus forty-five equals ninety!', 'What is 45 + 45?', '90', '91', '89', '92', 'Double 45 is 90, so 45 + 45 is 90!'],
    ['addition', '🐝', '24 + 23 = 47', 'Near Double: double 24 is 48!', 'Twenty-four plus twenty-three equals forty-seven!', 'What is 24 + 23?', '47', '48', '46', '49', 'Double 24 is 48, so 24 + 23 is 47!'],
    ['addition', '🍇', '25 + 26 = 51', 'Near Double: double 25 is 50!', 'Twenty-five plus twenty-six equals fifty-one!', 'What is 25 + 26?', '51', '50', '52', '53', 'Double 25 is 50, so 25 + 26 is 51!'],
    ['addition', '🦋', '44 + 44 = 88', 'Near Double: double 44 is 88!', 'Forty-four plus forty-four equals eighty-eight!', 'What is 44 + 44?', '88', '89', '87', '90', 'Double 44 is 88, so 44 + 44 is 88!'],
    ['addition', '🪙', '20¢ + 30¢ = 50¢', '20 Cents + 30 Cents = 50 Cents!', 'Twenty cents plus thirty cents equals fifty cents!', 'What is 20¢ + 30¢?', '50', '55', '45', '60', '20 + 30 = 50 cents!'],
    ['addition', '🪙', '30¢ + 35¢ = 65¢', '30 Cents + 35 Cents = 65 Cents!', 'Thirty cents plus thirty-five cents equals sixty-five cents!', 'What is 30¢ + 35¢?', '65', '70', '60', '75', '30 + 35 = 65 cents!'],
    ['addition', '🪙', '95¢ + 50¢ = 145¢', '95 Cents + 50 Cents = 145 Cents!', 'Ninety-five cents plus fifty cents equals one hundred forty-five cents!', 'What is 95¢ + 50¢?', '145', '150', '140', '155', '95 + 50 = 145 cents!'],
    ['addition', '🪙', '65¢ + 60¢ = 125¢', '65 Cents + 60 Cents = 125 Cents!', 'Sixty-five cents plus sixty cents equals one hundred twenty-five cents!', 'What is 65¢ + 60¢?', '125', '130', '120', '135', '65 + 60 = 125 cents!'],
    ['addition', '🪙', '65¢ + 45¢ = 110¢', '65 Cents + 45 Cents = 110 Cents!', 'Sixty-five cents plus forty-five cents equals one hundred ten cents!', 'What is 65¢ + 45¢?', '110', '115', '105', '120', '65 + 45 = 110 cents!'],
    ['addition', '📚', '46 + 51 = 97', '46 Pages + 51 Pages = 97 Pages!', 'Noah read 46 pages on Monday and 51 pages on Tuesday. How many pages did Noah read?', 'Noah read 46 pages on Monday and 51 pages on Tuesday. How many pages did Noah read?', '97', '98', '96', '107', 'Add them together: 46 + 51 = 97!'],
    ['addition', '⭐', '29 + 44 = 73', '29 Points + 44 Points = 73 Points!', 'Ivy scores 29 points in the first game and 44 points in the second game. How many points in all?', 'Ivy scores 29 points in the first game and 44 points in the second game. How many points in all?', '73', '74', '72', '83', 'Add them together: 29 + 44 = 73!'],
    ['addition', '🐚', '15 + 50 = 65', '15 Shells + 50 Shells = 65 Shells!', 'Ruby finds 15 shells on the beach and 50 more by the rocks. How many shells in all?', 'Ruby finds 15 shells on the beach and 50 more by the rocks. How many shells in all?', '65', '66', '64', '75', 'Add them together: 15 + 50 = 65!'],
    ['addition', '📚', '30 + 15 = 45', '30 Pages + 15 Pages = 45 Pages!', 'Zoe read 30 pages on Monday and 15 pages on Tuesday. How many pages did Zoe read?', 'Zoe read 30 pages on Monday and 15 pages on Tuesday. How many pages did Zoe read?', '45', '46', '44', '55', 'Add them together: 30 + 15 = 45!'],
    ['addition', '🍎', '57 + 41 = 98', '57 Apples + 41 Apples = 98 Apples!', 'Max picks 57 apples in the morning and 41 apples in the afternoon. How many apples in all?', 'Max picks 57 apples in the morning and 41 apples in the afternoon. How many apples in all?', '98', '99', '97', '108', 'Add them together: 57 + 41 = 98!'],
    ['addition', '🍎', '59 + 18 = 77', '59 Apples + 18 Apples = 77 Apples!', 'Noah picks 59 apples in the morning and 18 apples in the afternoon. How many apples in all?', 'Noah picks 59 apples in the morning and 18 apples in the afternoon. How many apples in all?', '77', '78', '76', '87', 'Add them together: 59 + 18 = 77!'],
    ['addition', '🍎', '60 + 45 = 105', '60 Apples + 45 Apples = 105 Apples!', 'Owen picks 60 apples in the morning and 45 apples in the afternoon. How many apples in all?', 'Owen picks 60 apples in the morning and 45 apples in the afternoon. How many apples in all?', '105', '106', '104', '115', 'Add them together: 60 + 45 = 105!'],
    ['addition', '🍎', '44 + 26 = 70', '44 Apples + 26 Apples = 70 Apples!', 'Zoe picks 44 apples in the morning and 26 apples in the afternoon. How many apples in all?', 'Zoe picks 44 apples in the morning and 26 apples in the afternoon. How many apples in all?', '70', '71', '69', '80', 'Add them together: 44 + 26 = 70!'],
    ['addition', '🍎', '51 + 37 = 88', '51 Apples + 37 Apples = 88 Apples!', 'Owen picks 51 apples in the morning and 37 apples in the afternoon. How many apples in all?', 'Owen picks 51 apples in the morning and 37 apples in the afternoon. How many apples in all?', '88', '89', '87', '98', 'Add them together: 51 + 37 = 88!'],
    ['addition', '🐚', '47 + 11 = 58', '47 Shells + 11 Shells = 58 Shells!', 'Zoe finds 47 shells on the beach and 11 more by the rocks. How many shells in all?', 'Zoe finds 47 shells on the beach and 11 more by the rocks. How many shells in all?', '58', '59', '57', '68', 'Add them together: 47 + 11 = 58!'],
    ['addition', '🍎', '65 + 21 = 86', '65 Apples + 21 Apples = 86 Apples!', 'Nora picks 65 apples in the morning and 21 apples in the afternoon. How many apples in all?', 'Nora picks 65 apples in the morning and 21 apples in the afternoon. How many apples in all?', '86', '87', '85', '96', 'Add them together: 65 + 21 = 86!'],
    ['addition', '🔵', '52 + 20 = 72', '52 Marbles + 20 Marbles = 72 Marbles!', 'Ava has 52 marbles and wins 20 more in a game. How many marbles does Ava have?', 'Ava has 52 marbles and wins 20 more in a game. How many marbles does Ava have?', '72', '73', '71', '82', 'Add them together: 52 + 20 = 72!'],
    ['addition', '🐚', '40 + 35 = 75', '40 Shells + 35 Shells = 75 Shells!', 'Eli finds 40 shells on the beach and 35 more by the rocks. How many shells in all?', 'Eli finds 40 shells on the beach and 35 more by the rocks. How many shells in all?', '75', '76', '74', '85', 'Add them together: 40 + 35 = 75!'],
    ['addition', '🎈', '35 + 52 = 87', '35 Balloons + 52 Balloons = 87 Balloons!', 'There are 35 red balloons and 52 blue balloons at the party. How many balloons in all?', 'There are 35 red balloons and 52 blue balloons at the party. How many balloons in all?', '87', '88', '86', '97', 'Add them together: 35 + 52 = 87!'],
    ['addition', '🎈', '49 + 52 = 101', '49 Balloons + 52 Balloons = 101 Balloons!', 'There are 49 red balloons and 52 blue balloons at the party. How many balloons in all?', 'There are 49 red balloons and 52 blue balloons at the party. How many balloons in all?', '101', '102', '100', '111', 'Add them together: 49 + 52 = 101!'],
    ['addition', '📚', '65 + 43 = 108', '65 Pages + 43 Pages = 108 Pages!', 'Ruby read 65 pages on Monday and 43 pages on Tuesday. How many pages did Ruby read?', 'Ruby read 65 pages on Monday and 43 pages on Tuesday. How many pages did Ruby read?', '108', '109', '107', '118', 'Add them together: 65 + 43 = 108!'],
    ['addition', '🐚', '24 + 22 = 46', '24 Shells + 22 Shells = 46 Shells!', 'Sam finds 24 shells on the beach and 22 more by the rocks. How many shells in all?', 'Sam finds 24 shells on the beach and 22 more by the rocks. How many shells in all?', '46', '47', '45', '56', 'Add them together: 24 + 22 = 46!'],
    ['addition', '🖍️', '27 + 9 = 36', '27 Crayons + 9 Crayons = 36 Crayons!', 'Mia has 27 crayons and gets a pack of 9 more. How many crayons now?', 'Mia has 27 crayons and gets a pack of 9 more. How many crayons now?', '36', '37', '35', '46', 'Add them together: 27 + 9 = 36!'],
    ['addition', '📖', '47 + 31 = 78', '47 Books + 31 Books = 78 Books!', 'The shelf has 47 books and Ivy adds 31 more books. How many books are on the shelf?', 'The shelf has 47 books and Ivy adds 31 more books. How many books are on the shelf?', '78', '79', '77', '88', 'Add them together: 47 + 31 = 78!'],
    ['addition', '🖍️', '61 + 56 = 117', '61 Crayons + 56 Crayons = 117 Crayons!', 'Ella has 61 crayons and gets a pack of 56 more. How many crayons now?', 'Ella has 61 crayons and gets a pack of 56 more. How many crayons now?', '117', '118', '116', '127', 'Add them together: 61 + 56 = 117!'],
    // ➖ SUBTRACTION — batch 2 (100 new, 2026-10-24)
    ['subtraction', '🎯', '83 - 9 = 74', 'Borrow a ten: 83 becomes 73 and 13 - 9!', 'Eighty-three minus nine equals seventy-four!', 'What is 83 - 9?', '74', '75', '73', '84', 'Borrow 1 ten: 13 - 9 = 4, so the answer is 74!'],
    ['subtraction', '🚗', '25 - 6 = 19', 'Borrow a ten: 25 becomes 15 and 15 - 6!', 'Twenty-five minus six equals nineteen!', 'What is 25 - 6?', '19', '20', '18', '29', 'Borrow 1 ten: 15 - 6 = 9, so the answer is 19!'],
    ['subtraction', '🚗', '52 - 9 = 43', 'Borrow a ten: 52 becomes 42 and 12 - 9!', 'Fifty-two minus nine equals forty-three!', 'What is 52 - 9?', '43', '44', '42', '53', 'Borrow 1 ten: 12 - 9 = 3, so the answer is 43!'],
    ['subtraction', '⚽', '54 - 8 = 46', 'Borrow a ten: 54 becomes 44 and 14 - 8!', 'Fifty-four minus eight equals forty-six!', 'What is 54 - 8?', '46', '47', '45', '56', 'Borrow 1 ten: 14 - 8 = 6, so the answer is 46!'],
    ['subtraction', '🚗', '44 - 5 = 39', 'Borrow a ten: 44 becomes 34 and 14 - 5!', 'Forty-four minus five equals thirty-nine!', 'What is 44 - 5?', '39', '40', '38', '49', 'Borrow 1 ten: 14 - 5 = 9, so the answer is 39!'],
    ['subtraction', '⚽', '41 - 4 = 37', 'Borrow a ten: 41 becomes 31 and 11 - 4!', 'Forty-one minus four equals thirty-seven!', 'What is 41 - 4?', '37', '38', '36', '47', 'Borrow 1 ten: 11 - 4 = 7, so the answer is 37!'],
    ['subtraction', '🎈', '83 - 7 = 76', 'Borrow a ten: 83 becomes 73 and 13 - 7!', 'Eighty-three minus seven equals seventy-six!', 'What is 83 - 7?', '76', '77', '75', '86', 'Borrow 1 ten: 13 - 7 = 6, so the answer is 76!'],
    ['subtraction', '🍉', '92 - 7 = 85', 'Borrow a ten: 92 becomes 82 and 12 - 7!', 'Ninety-two minus seven equals eighty-five!', 'What is 92 - 7?', '85', '86', '84', '95', 'Borrow 1 ten: 12 - 7 = 5, so the answer is 85!'],
    ['subtraction', '🚀', '50 - 6 = 44', 'Borrow a ten: 50 becomes 40 and 10 - 6!', 'Fifty minus six equals forty-four!', 'What is 50 - 6?', '44', '45', '43', '54', 'Borrow 1 ten: 10 - 6 = 4, so the answer is 44!'],
    ['subtraction', '⚽', '43 - 4 = 39', 'Borrow a ten: 43 becomes 33 and 13 - 4!', 'Forty-three minus four equals thirty-nine!', 'What is 43 - 4?', '39', '40', '38', '49', 'Borrow 1 ten: 13 - 4 = 9, so the answer is 39!'],
    ['subtraction', '🦕', '42 - 7 = 35', 'Borrow a ten: 42 becomes 32 and 12 - 7!', 'Forty-two minus seven equals thirty-five!', 'What is 42 - 7?', '35', '36', '34', '45', 'Borrow 1 ten: 12 - 7 = 5, so the answer is 35!'],
    ['subtraction', '🦋', '73 - 5 = 68', 'Borrow a ten: 73 becomes 63 and 13 - 5!', 'Seventy-three minus five equals sixty-eight!', 'What is 73 - 5?', '68', '69', '67', '78', 'Borrow 1 ten: 13 - 5 = 8, so the answer is 68!'],
    ['subtraction', '🐶', '55 - 9 = 46', 'Borrow a ten: 55 becomes 45 and 15 - 9!', 'Fifty-five minus nine equals forty-six!', 'What is 55 - 9?', '46', '47', '45', '56', 'Borrow 1 ten: 15 - 9 = 6, so the answer is 46!'],
    ['subtraction', '🚗', '52 - 3 = 49', 'Borrow a ten: 52 becomes 42 and 12 - 3!', 'Fifty-two minus three equals forty-nine!', 'What is 52 - 3?', '49', '50', '48', '59', 'Borrow 1 ten: 12 - 3 = 9, so the answer is 49!'],
    ['subtraction', '🍉', '51 - 8 = 43', 'Borrow a ten: 51 becomes 41 and 11 - 8!', 'Fifty-one minus eight equals forty-three!', 'What is 51 - 8?', '43', '44', '42', '53', 'Borrow 1 ten: 11 - 8 = 3, so the answer is 43!'],
    ['subtraction', '🖍️', '42 - 5 = 37', 'Borrow a ten: 42 becomes 32 and 12 - 5!', 'Forty-two minus five equals thirty-seven!', 'What is 42 - 5?', '37', '38', '36', '47', 'Borrow 1 ten: 12 - 5 = 7, so the answer is 37!'],
    ['subtraction', '🎨', '73 - 4 = 69', 'Borrow a ten: 73 becomes 63 and 13 - 4!', 'Seventy-three minus four equals sixty-nine!', 'What is 73 - 4?', '69', '70', '68', '79', 'Borrow 1 ten: 13 - 4 = 9, so the answer is 69!'],
    ['subtraction', '🖍️', '21 - 6 = 15', 'Borrow a ten: 21 becomes 11 and 11 - 6!', 'Twenty-one minus six equals fifteen!', 'What is 21 - 6?', '15', '16', '14', '25', 'Borrow 1 ten: 11 - 6 = 5, so the answer is 15!'],
    ['subtraction', '🌟', '62 - 3 = 59', 'Borrow a ten: 62 becomes 52 and 12 - 3!', 'Sixty-two minus three equals fifty-nine!', 'What is 62 - 3?', '59', '60', '58', '69', 'Borrow 1 ten: 12 - 3 = 9, so the answer is 59!'],
    ['subtraction', '🍓', '43 - 6 = 37', 'Borrow a ten: 43 becomes 33 and 13 - 6!', 'Forty-three minus six equals thirty-seven!', 'What is 43 - 6?', '37', '38', '36', '47', 'Borrow 1 ten: 13 - 6 = 7, so the answer is 37!'],
    ['subtraction', '☀️', '75 - 7 = 68', 'Borrow a ten: 75 becomes 65 and 15 - 7!', 'Seventy-five minus seven equals sixty-eight!', 'What is 75 - 7?', '68', '69', '67', '78', 'Borrow 1 ten: 15 - 7 = 8, so the answer is 68!'],
    ['subtraction', '☀️', '50 - 8 = 42', 'Borrow a ten: 50 becomes 40 and 10 - 8!', 'Fifty minus eight equals forty-two!', 'What is 50 - 8?', '42', '43', '41', '52', 'Borrow 1 ten: 10 - 8 = 2, so the answer is 42!'],
    ['subtraction', '📚', '31 - 5 = 26', 'Borrow a ten: 31 becomes 21 and 11 - 5!', 'Thirty-one minus five equals twenty-six!', 'What is 31 - 5?', '26', '27', '25', '36', 'Borrow 1 ten: 11 - 5 = 6, so the answer is 26!'],
    ['subtraction', '🎈', '96 - 8 = 88', 'Borrow a ten: 96 becomes 86 and 16 - 8!', 'Ninety-six minus eight equals eighty-eight!', 'What is 96 - 8?', '88', '89', '87', '98', 'Borrow 1 ten: 16 - 8 = 8, so the answer is 88!'],
    ['subtraction', '🦕', '93 - 8 = 85', 'Borrow a ten: 93 becomes 83 and 13 - 8!', 'Ninety-three minus eight equals eighty-five!', 'What is 93 - 8?', '85', '86', '84', '95', 'Borrow 1 ten: 13 - 8 = 5, so the answer is 85!'],
    ['subtraction', '🌟', '65 - 54 = 11', 'Subtract the tens, then subtract the ones!', 'Sixty-five minus fifty-four equals eleven!', 'What is 65 - 54?', '11', '12', '10', '21', '65 - 54: take away 50 tens and 4 ones to get 11!'],
    ['subtraction', '🦒', '79 - 39 = 40', 'Subtract the tens, then subtract the ones!', 'Seventy-nine minus thirty-nine equals forty!', 'What is 79 - 39?', '40', '41', '39', '50', '79 - 39: take away 30 tens and 9 ones to get 40!'],
    ['subtraction', '🐝', '91 - 43 = 48', 'Subtract the tens, then subtract the ones!', 'Ninety-one minus forty-three equals forty-eight!', 'What is 91 - 43?', '48', '49', '47', '58', '91 - 43: take away 40 tens and 3 ones to get 48!'],
    ['subtraction', '🐘', '98 - 79 = 19', 'Subtract the tens, then subtract the ones!', 'Ninety-eight minus seventy-nine equals nineteen!', 'What is 98 - 79?', '19', '20', '18', '29', '98 - 79: take away 70 tens and 9 ones to get 19!'],
    ['subtraction', '⭐', '68 - 43 = 25', 'Subtract the tens, then subtract the ones!', 'Sixty-eight minus forty-three equals twenty-five!', 'What is 68 - 43?', '25', '26', '24', '35', '68 - 43: take away 40 tens and 3 ones to get 25!'],
    ['subtraction', '☀️', '76 - 17 = 59', 'Subtract the tens, then subtract the ones!', 'Seventy-six minus seventeen equals fifty-nine!', 'What is 76 - 17?', '59', '60', '58', '69', '76 - 17: take away 10 tens and 7 ones to get 59!'],
    ['subtraction', '🍪', '68 - 50 = 18', 'Subtract the tens, then subtract the ones!', 'Sixty-eight minus fifty equals eighteen!', 'What is 68 - 50?', '18', '19', '17', '28', '68 - 50: take away 50 tens and 0 ones to get 18!'],
    ['subtraction', '🍇', '92 - 41 = 51', 'Subtract the tens, then subtract the ones!', 'Ninety-two minus forty-one equals fifty-one!', 'What is 92 - 41?', '51', '52', '50', '61', '92 - 41: take away 40 tens and 1 ones to get 51!'],
    ['subtraction', '🎲', '78 - 60 = 18', 'Subtract the tens, then subtract the ones!', 'Seventy-eight minus sixty equals eighteen!', 'What is 78 - 60?', '18', '19', '17', '28', '78 - 60: take away 60 tens and 0 ones to get 18!'],
    ['subtraction', '🍪', '58 - 27 = 31', 'Subtract the tens, then subtract the ones!', 'Fifty-eight minus twenty-seven equals thirty-one!', 'What is 58 - 27?', '31', '32', '30', '41', '58 - 27: take away 20 tens and 7 ones to get 31!'],
    ['subtraction', '📚', '85 - 47 = 38', 'Subtract the tens, then subtract the ones!', 'Eighty-five minus forty-seven equals thirty-eight!', 'What is 85 - 47?', '38', '39', '37', '48', '85 - 47: take away 40 tens and 7 ones to get 38!'],
    ['subtraction', '🧩', '77 - 63 = 14', 'Subtract the tens, then subtract the ones!', 'Seventy-seven minus sixty-three equals fourteen!', 'What is 77 - 63?', '14', '15', '13', '24', '77 - 63: take away 60 tens and 3 ones to get 14!'],
    ['subtraction', '🍪', '76 - 37 = 39', 'Subtract the tens, then subtract the ones!', 'Seventy-six minus thirty-seven equals thirty-nine!', 'What is 76 - 37?', '39', '40', '38', '49', '76 - 37: take away 30 tens and 7 ones to get 39!'],
    ['subtraction', '🎈', '90 - 61 = 29', 'Subtract the tens, then subtract the ones!', 'Ninety minus sixty-one equals twenty-nine!', 'What is 90 - 61?', '29', '30', '28', '39', '90 - 61: take away 60 tens and 1 ones to get 29!'],
    ['subtraction', '🌻', '93 - 68 = 25', 'Subtract the tens, then subtract the ones!', 'Ninety-three minus sixty-eight equals twenty-five!', 'What is 93 - 68?', '25', '26', '24', '35', '93 - 68: take away 60 tens and 8 ones to get 25!'],
    ['subtraction', '🦕', '70 - 20 = 50', 'Subtract the tens, then subtract the ones!', 'Seventy minus twenty equals fifty!', 'What is 70 - 20?', '50', '51', '49', '60', '70 - 20: take away 20 tens and 0 ones to get 50!'],
    ['subtraction', '🖍️', '37 - 28 = 9', 'Subtract the tens, then subtract the ones!', 'Thirty-seven minus twenty-eight equals nine!', 'What is 37 - 28?', '9', '10', '8', '19', '37 - 28: take away 20 tens and 8 ones to get 9!'],
    ['subtraction', '🚗', '82 - 49 = 33', 'Subtract the tens, then subtract the ones!', 'Eighty-two minus forty-nine equals thirty-three!', 'What is 82 - 49?', '33', '34', '32', '43', '82 - 49: take away 40 tens and 9 ones to get 33!'],
    ['subtraction', '🎵', '66 - 26 = 40', 'Subtract the tens, then subtract the ones!', 'Sixty-six minus twenty-six equals forty!', 'What is 66 - 26?', '40', '41', '39', '50', '66 - 26: take away 20 tens and 6 ones to get 40!'],
    ['subtraction', '🐠', '89 - 68 = 21', 'Subtract the tens, then subtract the ones!', 'Eighty-nine minus sixty-eight equals twenty-one!', 'What is 89 - 68?', '21', '22', '20', '31', '89 - 68: take away 60 tens and 8 ones to get 21!'],
    ['subtraction', '🎁', '94 - 36 = 58', 'Subtract the tens, then subtract the ones!', 'Ninety-four minus thirty-six equals fifty-eight!', 'What is 94 - 36?', '58', '59', '57', '68', '94 - 36: take away 30 tens and 6 ones to get 58!'],
    ['subtraction', '🐢', '85 - 45 = 40', 'Subtract the tens, then subtract the ones!', 'Eighty-five minus forty-five equals forty!', 'What is 85 - 45?', '40', '41', '39', '50', '85 - 45: take away 40 tens and 5 ones to get 40!'],
    ['subtraction', '🍓', '67 - 53 = 14', 'Subtract the tens, then subtract the ones!', 'Sixty-seven minus fifty-three equals fourteen!', 'What is 67 - 53?', '14', '15', '13', '24', '67 - 53: take away 50 tens and 3 ones to get 14!'],
    ['subtraction', '🍉', '52 - 35 = 17', 'Subtract the tens, then subtract the ones!', 'Fifty-two minus thirty-five equals seventeen!', 'What is 52 - 35?', '17', '18', '16', '27', '52 - 35: take away 30 tens and 5 ones to get 17!'],
    ['subtraction', '🌻', '36 - 19 = 17', 'Subtract the tens, then subtract the ones!', 'Thirty-six minus nineteen equals seventeen!', 'What is 36 - 19?', '17', '18', '16', '27', '36 - 19: take away 10 tens and 9 ones to get 17!'],
    ['subtraction', '🐠', '333 - 54 = 279', 'Take away the tens and ones from the hundreds!', 'Three hundred thirty-three minus fifty-four equals two hundred seventy-nine!', 'What is 333 - 54?', '279', '280', '278', '289', '333 - 54 = 279!'],
    ['subtraction', '🦒', '358 - 57 = 301', 'Take away the tens and ones from the hundreds!', 'Three hundred fifty-eight minus fifty-seven equals three hundred one!', 'What is 358 - 57?', '301', '302', '300', '311', '358 - 57 = 301!'],
    ['subtraction', '🌈', '426 - 43 = 383', 'Take away the tens and ones from the hundreds!', 'Four hundred twenty-six minus forty-three equals three hundred eighty-three!', 'What is 426 - 43?', '383', '384', '382', '393', '426 - 43 = 383!'],
    ['subtraction', '🧩', '334 - 87 = 247', 'Take away the tens and ones from the hundreds!', 'Three hundred thirty-four minus eighty-seven equals two hundred forty-seven!', 'What is 334 - 87?', '247', '248', '246', '257', '334 - 87 = 247!'],
    ['subtraction', '🦋', '330 - 85 = 245', 'Take away the tens and ones from the hundreds!', 'Three hundred thirty minus eighty-five equals two hundred forty-five!', 'What is 330 - 85?', '245', '246', '244', '255', '330 - 85 = 245!'],
    ['subtraction', '🖍️', '304 - 94 = 210', 'Take away the tens and ones from the hundreds!', 'Three hundred four minus ninety-four equals two hundred ten!', 'What is 304 - 94?', '210', '211', '209', '220', '304 - 94 = 210!'],
    ['subtraction', '🎨', '452 - 25 = 427', 'Take away the tens and ones from the hundreds!', 'Four hundred fifty-two minus twenty-five equals four hundred twenty-seven!', 'What is 452 - 25?', '427', '428', '426', '437', '452 - 25 = 427!'],
    ['subtraction', '🚗', '130 - 70 = 60', 'Take away the tens and ones from the hundreds!', 'One hundred thirty minus seventy equals sixty!', 'What is 130 - 70?', '60', '61', '59', '70', '130 - 70 = 60!'],
    ['subtraction', '🎲', '403 - 60 = 343', 'Take away the tens and ones from the hundreds!', 'Four hundred three minus sixty equals three hundred forty-three!', 'What is 403 - 60?', '343', '344', '342', '353', '403 - 60 = 343!'],
    ['subtraction', '🍉', '462 - 71 = 391', 'Take away the tens and ones from the hundreds!', 'Four hundred sixty-two minus seventy-one equals three hundred ninety-one!', 'What is 462 - 71?', '391', '392', '390', '401', '462 - 71 = 391!'],
    ['subtraction', '🪙', '386 - 34 = 352', 'Take away the tens and ones from the hundreds!', 'Three hundred eighty-six minus thirty-four equals three hundred fifty-two!', 'What is 386 - 34?', '352', '353', '351', '362', '386 - 34 = 352!'],
    ['subtraction', '⭐', '357 - 22 = 335', 'Take away the tens and ones from the hundreds!', 'Three hundred fifty-seven minus twenty-two equals three hundred thirty-five!', 'What is 357 - 22?', '335', '336', '334', '345', '357 - 22 = 335!'],
    ['subtraction', '🐘', '337 - 44 = 293', 'Take away the tens and ones from the hundreds!', 'Three hundred thirty-seven minus forty-four equals two hundred ninety-three!', 'What is 337 - 44?', '293', '294', '292', '303', '337 - 44 = 293!'],
    ['subtraction', '🍉', '277 - 31 = 246', 'Take away the tens and ones from the hundreds!', 'Two hundred seventy-seven minus thirty-one equals two hundred forty-six!', 'What is 277 - 31?', '246', '247', '245', '256', '277 - 31 = 246!'],
    ['subtraction', '☀️', '288 - 87 = 201', 'Take away the tens and ones from the hundreds!', 'Two hundred eighty-eight minus eighty-seven equals two hundred one!', 'What is 288 - 87?', '201', '202', '200', '211', '288 - 87 = 201!'],
    ['subtraction', '🎈', '61 - 46 = 15', '61 Balloons minus 46 Balloons = 15 Balloons left!', 'There were 61 balloons. 46 balloons flew away. How many balloons are left?', 'There were 61 balloons. 46 balloons flew away. How many balloons are left?', '15', '16', '14', '25', '46 + 15 = 61, so 61 - 46 = 15!'],
    ['subtraction', '🪑', '61 - 12 = 49', '61 Seats minus 12 Seats = 49 Seats left!', 'A bus has 61 seats. 12 seats are taken. How many seats are free?', 'A bus has 61 seats. 12 seats are taken. How many seats are free?', '49', '50', '48', '59', '12 + 49 = 61, so 61 - 12 = 49!'],
    ['subtraction', '🪑', '28 - 14 = 14', '28 Seats minus 14 Seats = 14 Seats left!', 'A bus has 28 seats. 14 seats are taken. How many seats are free?', 'A bus has 28 seats. 14 seats are taken. How many seats are free?', '14', '15', '13', '24', '14 + 14 = 28, so 28 - 14 = 14!'],
    ['subtraction', '🌻', '79 - 22 = 57', '79 Flowers minus 22 Flowers = 57 Flowers left!', 'Jack picked 79 flowers and gave 22 to grandma. How many flowers are left?', 'Jack picked 79 flowers and gave 22 to grandma. How many flowers are left?', '57', '58', '56', '67', '22 + 57 = 79, so 79 - 22 = 57!'],
    ['subtraction', '🍪', '31 - 6 = 25', '31 Cookies minus 6 Cookies = 25 Cookies left!', 'Mia had 31 cookies and ate 6. How many cookies are left?', 'Mia had 31 cookies and ate 6. How many cookies are left?', '25', '26', '24', '35', '6 + 25 = 31, so 31 - 6 = 25!'],
    ['subtraction', '📚', '86 - 37 = 49', '86 Pages minus 37 Pages = 49 Pages left!', 'A book has 86 pages. Ava has read 37 pages. How many pages are left to read?', 'A book has 86 pages. Ava has read 37 pages. How many pages are left to read?', '49', '50', '48', '59', '37 + 49 = 86, so 86 - 37 = 49!'],
    ['subtraction', '🍪', '46 - 34 = 12', '46 Cookies minus 34 Cookies = 12 Cookies left!', 'Ben had 46 cookies and ate 34. How many cookies are left?', 'Ben had 46 cookies and ate 34. How many cookies are left?', '12', '13', '11', '22', '34 + 12 = 46, so 46 - 34 = 12!'],
    ['subtraction', '🔵', '49 - 38 = 11', '49 Marbles minus 38 Marbles = 11 Marbles left!', 'Leo had 49 marbles and lost 38 at school. How many marbles are left?', 'Leo had 49 marbles and lost 38 at school. How many marbles are left?', '11', '12', '10', '21', '38 + 11 = 49, so 49 - 38 = 11!'],
    ['subtraction', '🎈', '89 - 56 = 33', '89 Balloons minus 56 Balloons = 33 Balloons left!', 'There were 89 balloons. 56 balloons flew away. How many balloons are left?', 'There were 89 balloons. 56 balloons flew away. How many balloons are left?', '33', '34', '32', '43', '56 + 33 = 89, so 89 - 56 = 33!'],
    ['subtraction', '🪑', '59 - 21 = 38', '59 Seats minus 21 Seats = 38 Seats left!', 'A bus has 59 seats. 21 seats are taken. How many seats are free?', 'A bus has 59 seats. 21 seats are taken. How many seats are free?', '38', '39', '37', '48', '21 + 38 = 59, so 59 - 21 = 38!'],
    ['subtraction', '🌻', '74 - 39 = 35', '74 Flowers minus 39 Flowers = 35 Flowers left!', 'Ruby picked 74 flowers and gave 39 to grandma. How many flowers are left?', 'Ruby picked 74 flowers and gave 39 to grandma. How many flowers are left?', '35', '36', '34', '45', '39 + 35 = 74, so 74 - 39 = 35!'],
    ['subtraction', '🍎', '95 - 28 = 67', '95 Apples minus 28 Apples = 67 Apples left!', 'There were 95 apples in the basket. Eli took 28 apples. How many are left?', 'There were 95 apples in the basket. Eli took 28 apples. How many are left?', '67', '68', '66', '77', '28 + 67 = 95, so 95 - 28 = 67!'],
    ['subtraction', '🌻', '85 - 54 = 31', '85 Flowers minus 54 Flowers = 31 Flowers left!', 'Mia picked 85 flowers and gave 54 to grandma. How many flowers are left?', 'Mia picked 85 flowers and gave 54 to grandma. How many flowers are left?', '31', '32', '30', '41', '54 + 31 = 85, so 85 - 54 = 31!'],
    ['subtraction', '🪑', '64 - 43 = 21', '64 Seats minus 43 Seats = 21 Seats left!', 'A bus has 64 seats. 43 seats are taken. How many seats are free?', 'A bus has 64 seats. 43 seats are taken. How many seats are free?', '21', '22', '20', '31', '43 + 21 = 64, so 64 - 43 = 21!'],
    ['subtraction', '🍎', '58 - 33 = 25', '58 Apples minus 33 Apples = 25 Apples left!', 'There were 58 apples in the basket. Zoe took 33 apples. How many are left?', 'There were 58 apples in the basket. Zoe took 33 apples. How many are left?', '25', '26', '24', '35', '33 + 25 = 58, so 58 - 33 = 25!'],
    ['subtraction', '🔵', '72 - 48 = 24', '72 Marbles minus 48 Marbles = 24 Marbles left!', 'Lily had 72 marbles and lost 48 at school. How many marbles are left?', 'Lily had 72 marbles and lost 48 at school. How many marbles are left?', '24', '25', '23', '34', '48 + 24 = 72, so 72 - 48 = 24!'],
    ['subtraction', '🍪', '74 - 10 = 64', '74 Cookies minus 10 Cookies = 64 Cookies left!', 'Leo had 74 cookies and ate 10. How many cookies are left?', 'Leo had 74 cookies and ate 10. How many cookies are left?', '64', '65', '63', '74', '10 + 64 = 74, so 74 - 10 = 64!'],
    ['subtraction', '🔵', '62 - 16 = 46', '62 Marbles minus 16 Marbles = 46 Marbles left!', 'Ruby had 62 marbles and lost 16 at school. How many marbles are left?', 'Ruby had 62 marbles and lost 16 at school. How many marbles are left?', '46', '47', '45', '56', '16 + 46 = 62, so 62 - 16 = 46!'],
    ['subtraction', '🪑', '54 - 28 = 26', '54 Seats minus 28 Seats = 26 Seats left!', 'A bus has 54 seats. 28 seats are taken. How many seats are free?', 'A bus has 54 seats. 28 seats are taken. How many seats are free?', '26', '27', '25', '36', '28 + 26 = 54, so 54 - 28 = 26!'],
    ['subtraction', '🖍️', '94 - 51 = 43', '94 Crayons minus 51 Crayons = 43 Crayons left!', 'Ava had 94 crayons and 51 crayons broke. How many crayons are left?', 'Ava had 94 crayons and 51 crayons broke. How many crayons are left?', '43', '44', '42', '53', '51 + 43 = 94, so 94 - 51 = 43!'],
    ['subtraction', '🖍️', '85 - 39 = 46', '85 Crayons minus 39 Crayons = 46 Crayons left!', 'Ben had 85 crayons and 39 crayons broke. How many crayons are left?', 'Ben had 85 crayons and 39 crayons broke. How many crayons are left?', '46', '47', '45', '56', '39 + 46 = 85, so 85 - 39 = 46!'],
    ['subtraction', '🔵', '47 - 20 = 27', '47 Marbles minus 20 Marbles = 27 Marbles left!', 'Ruby had 47 marbles and lost 20 at school. How many marbles are left?', 'Ruby had 47 marbles and lost 20 at school. How many marbles are left?', '27', '28', '26', '37', '20 + 27 = 47, so 47 - 20 = 27!'],
    ['subtraction', '⭐', '24 - 12 = 12', '24 Stickers minus 12 Stickers = 12 Stickers left!', 'Ava had 24 stickers and gave 12 to a friend. How many stickers are left?', 'Ava had 24 stickers and gave 12 to a friend. How many stickers are left?', '12', '13', '11', '22', '12 + 12 = 24, so 24 - 12 = 12!'],
    ['subtraction', '⭐', '80 - 33 = 47', '80 Stickers minus 33 Stickers = 47 Stickers left!', 'Sam had 80 stickers and gave 33 to a friend. How many stickers are left?', 'Sam had 80 stickers and gave 33 to a friend. How many stickers are left?', '47', '48', '46', '57', '33 + 47 = 80, so 80 - 33 = 47!'],
    ['subtraction', '🔵', '59 - 30 = 29', '59 Marbles minus 30 Marbles = 29 Marbles left!', 'Max had 59 marbles and lost 30 at school. How many marbles are left?', 'Max had 59 marbles and lost 30 at school. How many marbles are left?', '29', '30', '28', '39', '30 + 29 = 59, so 59 - 30 = 29!'],
    ['subtraction', '⚽', '150 - 80 = 70', 'Round numbers: 150 minus 80 is 70!', 'One hundred fifty minus eighty equals seventy!', 'What is 150 - 80?', '70', '75', '65', '80', 'Count back 80 from 150 to get 70!'],
    ['subtraction', '🪙', '190 - 70 = 120', 'Round numbers: 190 minus 70 is 120!', 'One hundred ninety minus seventy equals one hundred twenty!', 'What is 190 - 70?', '120', '125', '115', '130', 'Count back 70 from 190 to get 120!'],
    ['subtraction', '🦒', '150 - 60 = 90', 'Round numbers: 150 minus 60 is 90!', 'One hundred fifty minus sixty equals ninety!', 'What is 150 - 60?', '90', '95', '85', '100', 'Count back 60 from 150 to get 90!'],
    ['subtraction', '☀️', '150 - 10 = 140', 'Round numbers: 150 minus 10 is 140!', 'One hundred fifty minus ten equals one hundred forty!', 'What is 150 - 10?', '140', '145', '135', '150', 'Count back 10 from 150 to get 140!'],
    ['subtraction', '🍉', '140 - 80 = 60', 'Round numbers: 140 minus 80 is 60!', 'One hundred forty minus eighty equals sixty!', 'What is 140 - 80?', '60', '65', '55', '70', 'Count back 80 from 140 to get 60!'],
    ['subtraction', '🪙', '160 - 20 = 140', 'Round numbers: 160 minus 20 is 140!', 'One hundred sixty minus twenty equals one hundred forty!', 'What is 160 - 20?', '140', '145', '135', '150', 'Count back 20 from 160 to get 140!'],
    ['subtraction', '🎁', '170 - 20 = 150', 'Round numbers: 170 minus 20 is 150!', 'One hundred seventy minus twenty equals one hundred fifty!', 'What is 170 - 20?', '150', '155', '145', '160', 'Count back 20 from 170 to get 150!'],
    ['subtraction', '🎯', '110 - 85 = 25', 'Round numbers: 110 minus 85 is 25!', 'One hundred ten minus eighty-five equals twenty-five!', 'What is 110 - 85?', '25', '30', '20', '35', 'Count back 85 from 110 to get 25!'],
    ['subtraction', '🎵', '80 - 40 = 40', 'Round numbers: 80 minus 40 is 40!', 'Eighty minus forty equals forty!', 'What is 80 - 40?', '40', '45', '35', '50', 'Count back 40 from 80 to get 40!'],
    ['subtraction', '🐠', '100 - 45 = 55', 'Round numbers: 100 minus 45 is 55!', 'One hundred minus forty-five equals fifty-five!', 'What is 100 - 45?', '55', '60', '50', '65', 'Count back 45 from 100 to get 55!'],
    // ✖️ MULTIPLICATION — batch 2 (100 new, 2026-10-24)
    ['multiplication', '🎯', '4 × 9 = 36', '4 Groups of 9 = 36!', 'Four times nine equals thirty-six!', 'What is 4 × 9?', '36', '45', '40', '32', '4 groups of 9: skip count by 9 4 times to get 36!'],
    ['multiplication', '🌻', '6 × 3 = 18', '6 Groups of 3 = 18!', 'Six times three equals eighteen!', 'What is 6 × 3?', '18', '21', '24', '12', '6 groups of 3: skip count by 3 6 times to get 18!'],
    ['multiplication', '🌙', '4 × 2 = 8', '4 Groups of 2 = 8!', 'Four times two equals eight!', 'What is 4 × 2?', '8', '10', '12', '4', '4 groups of 2: skip count by 2 4 times to get 8!'],
    ['multiplication', '🦁', '10 × 7 = 70', '10 Groups of 7 = 70!', 'Ten times seven equals seventy!', 'What is 10 × 7?', '70', '77', '80', '60', '10 groups of 7: skip count by 7 10 times to get 70!'],
    ['multiplication', '☀️', '11 × 9 = 99', '11 Groups of 9 = 99!', 'Eleven times nine equals ninety-nine!', 'What is 11 × 9?', '99', '108', '110', '88', '11 groups of 9: skip count by 9 11 times to get 99!'],
    ['multiplication', '🚗', '6 × 11 = 66', '6 Groups of 11 = 66!', 'Six times eleven equals sixty-six!', 'What is 6 × 11?', '66', '77', '72', '60', '6 groups of 11: skip count by 11 6 times to get 66!'],
    ['multiplication', '🎨', '12 × 11 = 132', '12 Groups of 11 = 132!', 'Twelve times eleven equals one hundred thirty-two!', 'What is 12 × 11?', '132', '143', '144', '120', '12 groups of 11: skip count by 11 12 times to get 132!'],
    ['multiplication', '🐘', '11 × 10 = 110', '11 Groups of 10 = 110!', 'Eleven times ten equals one hundred ten!', 'What is 11 × 10?', '110', '120', '121', '99', '11 groups of 10: skip count by 10 11 times to get 110!'],
    ['multiplication', '🎨', '9 × 9 = 81', '9 Groups of 9 = 81!', 'Nine times nine equals eighty-one!', 'What is 9 × 9?', '81', '90', '72', '91', '9 groups of 9: skip count by 9 9 times to get 81!'],
    ['multiplication', '🏀', '9 × 11 = 99', '9 Groups of 11 = 99!', 'Nine times eleven equals ninety-nine!', 'What is 9 × 11?', '99', '110', '108', '90', '9 groups of 11: skip count by 11 9 times to get 99!'],
    ['multiplication', '🎯', '5 × 9 = 45', '5 Groups of 9 = 45!', 'Five times nine equals forty-five!', 'What is 5 × 9?', '45', '54', '50', '40', '5 groups of 9: skip count by 9 5 times to get 45!'],
    ['multiplication', '⭐', '9 × 10 = 90', '9 Groups of 10 = 90!', 'Nine times ten equals ninety!', 'What is 9 × 10?', '90', '100', '99', '81', '9 groups of 10: skip count by 10 9 times to get 90!'],
    ['multiplication', '🪙', '9 × 12 = 108', '9 Groups of 12 = 108!', 'Nine times twelve equals one hundred eight!', 'What is 9 × 12?', '108', '120', '117', '99', '9 groups of 12: skip count by 12 9 times to get 108!'],
    ['multiplication', '🎲', '8 × 3 = 24', '8 Groups of 3 = 24!', 'Eight times three equals twenty-four!', 'What is 8 × 3?', '24', '27', '32', '16', '8 groups of 3: skip count by 3 8 times to get 24!'],
    ['multiplication', '📚', '9 × 4 = 36', '9 Groups of 4 = 36!', 'Nine times four equals thirty-six!', 'What is 9 × 4?', '36', '40', '45', '27', '9 groups of 4: skip count by 4 9 times to get 36!'],
    ['multiplication', '☀️', '8 × 9 = 72', '8 Groups of 9 = 72!', 'Eight times nine equals seventy-two!', 'What is 8 × 9?', '72', '81', '80', '64', '8 groups of 9: skip count by 9 8 times to get 72!'],
    ['multiplication', '🚗', '11 × 11 = 121', '11 Groups of 11 = 121!', 'Eleven times eleven equals one hundred twenty-one!', 'What is 11 × 11?', '121', '132', '110', '131', '11 groups of 11: skip count by 11 11 times to get 121!'],
    ['multiplication', '🦒', '4 × 3 = 12', '4 Groups of 3 = 12!', 'Four times three equals twelve!', 'What is 4 × 3?', '12', '15', '16', '8', '4 groups of 3: skip count by 3 4 times to get 12!'],
    ['multiplication', '🐝', '12 × 10 = 120', '12 Groups of 10 = 120!', 'Twelve times ten equals one hundred twenty!', 'What is 12 × 10?', '120', '130', '132', '108', '12 groups of 10: skip count by 10 12 times to get 120!'],
    ['multiplication', '⭐', '5 × 10 = 50', '5 Groups of 10 = 50!', 'Five times ten equals fifty!', 'What is 5 × 10?', '50', '60', '55', '45', '5 groups of 10: skip count by 10 5 times to get 50!'],
    ['multiplication', '🎈', '3 × 11 = 33', '3 Groups of 11 = 33!', 'Three times eleven equals thirty-three!', 'What is 3 × 11?', '33', '44', '36', '30', '3 groups of 11: skip count by 11 3 times to get 33!'],
    ['multiplication', '🦒', '7 × 11 = 77', '7 Groups of 11 = 77!', 'Seven times eleven equals seventy-seven!', 'What is 7 × 11?', '77', '88', '84', '70', '7 groups of 11: skip count by 11 7 times to get 77!'],
    ['multiplication', '⚽', '6 × 4 = 24', '6 Groups of 4 = 24!', 'Six times four equals twenty-four!', 'What is 6 × 4?', '24', '28', '30', '18', '6 groups of 4: skip count by 4 6 times to get 24!'],
    ['multiplication', '⭐', '7 × 10 = 70', '7 Groups of 10 = 70!', 'Seven times ten equals seventy!', 'What is 7 × 10?', '70', '80', '77', '63', '7 groups of 10: skip count by 10 7 times to get 70!'],
    ['multiplication', '☀️', '10 × 2 = 20', '10 Groups of 2 = 20!', 'Ten times two equals twenty!', 'What is 10 × 2?', '20', '22', '30', '10', '10 groups of 2: skip count by 2 10 times to get 20!'],
    ['multiplication', '☀️', '9 × 2 = 18', '9 Groups of 2 = 18!', 'Nine times two equals eighteen!', 'What is 9 × 2?', '18', '20', '27', '9', '9 groups of 2: skip count by 2 9 times to get 18!'],
    ['multiplication', '🌙', '12 × 2 = 24', '12 Groups of 2 = 24!', 'Twelve times two equals twenty-four!', 'What is 12 × 2?', '24', '26', '36', '12', '12 groups of 2: skip count by 2 12 times to get 24!'],
    ['multiplication', '🍪', '8 × 12 = 96', '8 Groups of 12 = 96!', 'Eight times twelve equals ninety-six!', 'What is 8 × 12?', '96', '108', '104', '88', '8 groups of 12: skip count by 12 8 times to get 96!'],
    ['multiplication', '📚', '5 × 4 = 20', '5 Groups of 4 = 20!', 'Five times four equals twenty!', 'What is 5 × 4?', '20', '24', '25', '15', '5 groups of 4: skip count by 4 5 times to get 20!'],
    ['multiplication', '🪙', '4 × 11 = 44', '4 Groups of 11 = 44!', 'Four times eleven equals forty-four!', 'What is 4 × 11?', '44', '55', '48', '40', '4 groups of 11: skip count by 11 4 times to get 44!'],
    ['multiplication', '🍉', '16 × 6 = 96', 'Break it apart: 10 × 6 and 6 × 6!', 'Sixteen times six equals ninety-six!', 'What is 16 × 6?', '96', '102', '90', '106', '10 × 6 = 60 and 6 × 6 = 36, together 96!'],
    ['multiplication', '🌙', '21 × 5 = 105', 'Break it apart: 20 × 5 and 1 × 5!', 'Twenty-one times five equals one hundred five!', 'What is 21 × 5?', '105', '110', '100', '115', '20 × 5 = 100 and 1 × 5 = 5, together 105!'],
    ['multiplication', '🍉', '22 × 8 = 176', 'Break it apart: 20 × 8 and 2 × 8!', 'Twenty-two times eight equals one hundred seventy-six!', 'What is 22 × 8?', '176', '184', '168', '186', '20 × 8 = 160 and 2 × 8 = 16, together 176!'],
    ['multiplication', '🦕', '22 × 5 = 110', 'Break it apart: 20 × 5 and 2 × 5!', 'Twenty-two times five equals one hundred ten!', 'What is 22 × 5?', '110', '115', '105', '120', '20 × 5 = 100 and 2 × 5 = 10, together 110!'],
    ['multiplication', '🐘', '12 × 3 = 36', 'Break it apart: 10 × 3 and 2 × 3!', 'Twelve times three equals thirty-six!', 'What is 12 × 3?', '36', '39', '33', '46', '10 × 3 = 30 and 2 × 3 = 6, together 36!'],
    ['multiplication', '🦁', '22 × 7 = 154', 'Break it apart: 20 × 7 and 2 × 7!', 'Twenty-two times seven equals one hundred fifty-four!', 'What is 22 × 7?', '154', '161', '147', '164', '20 × 7 = 140 and 2 × 7 = 14, together 154!'],
    ['multiplication', '⭐', '23 × 3 = 69', 'Break it apart: 20 × 3 and 3 × 3!', 'Twenty-three times three equals sixty-nine!', 'What is 23 × 3?', '69', '72', '66', '79', '20 × 3 = 60 and 3 × 3 = 9, together 69!'],
    ['multiplication', '🌻', '25 × 2 = 50', 'Break it apart: 20 × 2 and 5 × 2!', 'Twenty-five times two equals fifty!', 'What is 25 × 2?', '50', '52', '48', '60', '20 × 2 = 40 and 5 × 2 = 10, together 50!'],
    ['multiplication', '🦒', '22 × 9 = 198', 'Break it apart: 20 × 9 and 2 × 9!', 'Twenty-two times nine equals one hundred ninety-eight!', 'What is 22 × 9?', '198', '207', '189', '208', '20 × 9 = 180 and 2 × 9 = 18, together 198!'],
    ['multiplication', '🐠', '16 × 2 = 32', 'Break it apart: 10 × 2 and 6 × 2!', 'Sixteen times two equals thirty-two!', 'What is 16 × 2?', '32', '34', '30', '42', '10 × 2 = 20 and 6 × 2 = 12, together 32!'],
    ['multiplication', '🍪', '23 × 5 = 115', 'Break it apart: 20 × 5 and 3 × 5!', 'Twenty-three times five equals one hundred fifteen!', 'What is 23 × 5?', '115', '120', '110', '125', '20 × 5 = 100 and 3 × 5 = 15, together 115!'],
    ['multiplication', '🪙', '25 × 7 = 175', 'Break it apart: 20 × 7 and 5 × 7!', 'Twenty-five times seven equals one hundred seventy-five!', 'What is 25 × 7?', '175', '182', '168', '185', '20 × 7 = 140 and 5 × 7 = 35, together 175!'],
    ['multiplication', '🍓', '27 × 2 = 54', 'Break it apart: 20 × 2 and 7 × 2!', 'Twenty-seven times two equals fifty-four!', 'What is 27 × 2?', '54', '56', '52', '64', '20 × 2 = 40 and 7 × 2 = 14, together 54!'],
    ['multiplication', '🎁', '24 × 3 = 72', 'Break it apart: 20 × 3 and 4 × 3!', 'Twenty-four times three equals seventy-two!', 'What is 24 × 3?', '72', '75', '69', '82', '20 × 3 = 60 and 4 × 3 = 12, together 72!'],
    ['multiplication', '🍓', '18 × 7 = 126', 'Break it apart: 10 × 7 and 8 × 7!', 'Eighteen times seven equals one hundred twenty-six!', 'What is 18 × 7?', '126', '133', '119', '136', '10 × 7 = 70 and 8 × 7 = 56, together 126!'],
    ['multiplication', '🍇', '16 × 4 = 64', 'Break it apart: 10 × 4 and 6 × 4!', 'Sixteen times four equals sixty-four!', 'What is 16 × 4?', '64', '68', '60', '74', '10 × 4 = 40 and 6 × 4 = 24, together 64!'],
    ['multiplication', '🐝', '12 × 8 = 96', 'Break it apart: 10 × 8 and 2 × 8!', 'Twelve times eight equals ninety-six!', 'What is 12 × 8?', '96', '104', '88', '106', '10 × 8 = 80 and 2 × 8 = 16, together 96!'],
    ['multiplication', '🚀', '19 × 6 = 114', 'Break it apart: 10 × 6 and 9 × 6!', 'Nineteen times six equals one hundred fourteen!', 'What is 19 × 6?', '114', '120', '108', '124', '10 × 6 = 60 and 9 × 6 = 54, together 114!'],
    ['multiplication', '🍓', '14 × 9 = 126', 'Break it apart: 10 × 9 and 4 × 9!', 'Fourteen times nine equals one hundred twenty-six!', 'What is 14 × 9?', '126', '135', '117', '136', '10 × 9 = 90 and 4 × 9 = 36, together 126!'],
    ['multiplication', '🦋', '28 × 5 = 140', 'Break it apart: 20 × 5 and 8 × 5!', 'Twenty-eight times five equals one hundred forty!', 'What is 28 × 5?', '140', '145', '135', '150', '20 × 5 = 100 and 8 × 5 = 40, together 140!'],
    ['multiplication', '🖍️', '13 × 7 = 91', 'Break it apart: 10 × 7 and 3 × 7!', 'Thirteen times seven equals ninety-one!', 'What is 13 × 7?', '91', '98', '84', '101', '10 × 7 = 70 and 3 × 7 = 21, together 91!'],
    ['multiplication', '🚗', '15 × 4 = 60', 'Break it apart: 10 × 4 and 5 × 4!', 'Fifteen times four equals sixty!', 'What is 15 × 4?', '60', '64', '56', '70', '10 × 4 = 40 and 5 × 4 = 20, together 60!'],
    ['multiplication', '🍇', '18 × 8 = 144', 'Break it apart: 10 × 8 and 8 × 8!', 'Eighteen times eight equals one hundred forty-four!', 'What is 18 × 8?', '144', '152', '136', '154', '10 × 8 = 80 and 8 × 8 = 64, together 144!'],
    ['multiplication', '🎨', '13 × 6 = 78', 'Break it apart: 10 × 6 and 3 × 6!', 'Thirteen times six equals seventy-eight!', 'What is 13 × 6?', '78', '84', '72', '88', '10 × 6 = 60 and 3 × 6 = 18, together 78!'],
    ['multiplication', '🎨', '16 × 5 = 80', 'Break it apart: 10 × 5 and 6 × 5!', 'Sixteen times five equals eighty!', 'What is 16 × 5?', '80', '85', '75', '90', '10 × 5 = 50 and 6 × 5 = 30, together 80!'],
    ['multiplication', '🎈', '6 × 100 = 600', 'Multiply by 100: just add two zeros!', 'Six times one hundred equals six hundred!', 'What is 6 × 100?', '600', '610', '590', '60', '6 × 100 = 600!'],
    ['multiplication', '🎨', '29 × 100 = 2900', 'Multiply by 100: just add two zeros!', 'Twenty-nine times one hundred equals 2900!', 'What is 29 × 100?', '2900', '2910', '2890', '290', '29 × 100 = 2900!'],
    ['multiplication', '🌙', '21 × 10 = 210', 'Multiply by 10: just add a zero!', 'Twenty-one times ten equals two hundred ten!', 'What is 21 × 10?', '210', '220', '200', '2100', '21 × 10 = 210!'],
    ['multiplication', '⭐', '8 × 10 = 80', 'Multiply by 10: just add a zero!', 'Eight times ten equals eighty!', 'What is 8 × 10?', '80', '90', '70', '800', '8 × 10 = 80!'],
    ['multiplication', '🚀', '18 × 10 = 180', 'Multiply by 10: just add a zero!', 'Eighteen times ten equals one hundred eighty!', 'What is 18 × 10?', '180', '190', '170', '1800', '18 × 10 = 180!'],
    ['multiplication', '🌈', '23 × 100 = 2300', 'Multiply by 100: just add two zeros!', 'Twenty-three times one hundred equals 2300!', 'What is 23 × 100?', '2300', '2310', '2290', '230', '23 × 100 = 2300!'],
    ['multiplication', '🐝', '31 × 100 = 3100', 'Multiply by 100: just add two zeros!', 'Thirty-one times one hundred equals 3100!', 'What is 31 × 100?', '3100', '3110', '3090', '310', '31 × 100 = 3100!'],
    ['multiplication', '🪙', '24 × 100 = 2400', 'Multiply by 100: just add two zeros!', 'Twenty-four times one hundred equals 2400!', 'What is 24 × 100?', '2400', '2410', '2390', '240', '24 × 100 = 2400!'],
    ['multiplication', '🐶', '19 × 10 = 190', 'Multiply by 10: just add a zero!', 'Nineteen times ten equals one hundred ninety!', 'What is 19 × 10?', '190', '200', '180', '1900', '19 × 10 = 190!'],
    ['multiplication', '📚', '38 × 10 = 380', 'Multiply by 10: just add a zero!', 'Thirty-eight times ten equals three hundred eighty!', 'What is 38 × 10?', '380', '390', '370', '3800', '38 × 10 = 380!'],
    ['multiplication', '🐝', '32 × 10 = 320', 'Multiply by 10: just add a zero!', 'Thirty-two times ten equals three hundred twenty!', 'What is 32 × 10?', '320', '330', '310', '3200', '32 × 10 = 320!'],
    ['multiplication', '🎨', '32 × 100 = 3200', 'Multiply by 100: just add two zeros!', 'Thirty-two times one hundred equals 3200!', 'What is 32 × 100?', '3200', '3210', '3190', '320', '32 × 100 = 3200!'],
    ['multiplication', '🌟', '40 × 10 = 400', 'Multiply by 10: just add a zero!', 'Forty times ten equals four hundred!', 'What is 40 × 10?', '400', '410', '390', '4000', '40 × 10 = 400!'],
    ['multiplication', '🌈', '3 × 100 = 300', 'Multiply by 100: just add two zeros!', 'Three times one hundred equals three hundred!', 'What is 3 × 100?', '300', '310', '290', '30', '3 × 100 = 300!'],
    ['multiplication', '⭐', '3 × 10 = 30', 'Multiply by 10: just add a zero!', 'Three times ten equals thirty!', 'What is 3 × 10?', '30', '40', '20', '300', '3 × 10 = 30!'],
    ['multiplication', '🔵', '11 × 2 = 22', '11 Groups of 2 = 22!', 'There are 11 bags with 2 marbles in each bag. How many marbles are there in all?', 'There are 11 bags with 2 marbles in each bag. How many marbles are there in all?', '22', '24', '20', '33', '11 × 2 means 11 groups of 2, which is 22!'],
    ['multiplication', '🔵', '12 × 6 = 72', '12 Groups of 6 = 72!', 'There are 12 bags with 6 marbles in each bag. How many marbles are there in all?', 'There are 12 bags with 6 marbles in each bag. How many marbles are there in all?', '72', '78', '66', '84', '12 × 6 means 12 groups of 6, which is 72!'],
    ['multiplication', '🔵', '7 × 4 = 28', '7 Groups of 4 = 28!', 'There are 7 bags with 4 marbles in each bag. How many marbles are there in all?', 'There are 7 bags with 4 marbles in each bag. How many marbles are there in all?', '28', '32', '24', '35', '7 × 4 means 7 groups of 4, which is 28!'],
    ['multiplication', '🍎', '10 × 6 = 60', '10 Groups of 6 = 60!', 'Each box holds 6 apples. How many apples are in 10 boxes?', 'Each box holds 6 apples. How many apples are in 10 boxes?', '60', '66', '54', '70', '10 × 6 means 10 groups of 6, which is 60!'],
    ['multiplication', '🍪', '7 × 3 = 21', '7 Groups of 3 = 21!', 'Noah bakes 7 trays with 3 cookies on each tray. How many cookies in all?', 'Noah bakes 7 trays with 3 cookies on each tray. How many cookies in all?', '21', '24', '18', '28', '7 × 3 means 7 groups of 3, which is 21!'],
    ['multiplication', '⭐', '6 × 5 = 30', '6 Groups of 5 = 30!', 'Jack buys 6 sheets with 5 stickers on each sheet. How many stickers in all?', 'Jack buys 6 sheets with 5 stickers on each sheet. How many stickers in all?', '30', '35', '25', '36', '6 × 5 means 6 groups of 5, which is 30!'],
    ['multiplication', '🖍️', '8 × 4 = 32', '8 Groups of 4 = 32!', 'Each pack has 4 crayons. How many crayons are in 8 packs?', 'Each pack has 4 crayons. How many crayons are in 8 packs?', '32', '36', '28', '40', '8 × 4 means 8 groups of 4, which is 32!'],
    ['multiplication', '🍎', '9 × 3 = 27', '9 Groups of 3 = 27!', 'Each box holds 3 apples. How many apples are in 9 boxes?', 'Each box holds 3 apples. How many apples are in 9 boxes?', '27', '30', '24', '36', '9 × 3 means 9 groups of 3, which is 27!'],
    ['multiplication', '🍪', '11 × 8 = 88', '11 Groups of 8 = 88!', 'Jack bakes 11 trays with 8 cookies on each tray. How many cookies in all?', 'Jack bakes 11 trays with 8 cookies on each tray. How many cookies in all?', '88', '96', '80', '99', '11 × 8 means 11 groups of 8, which is 88!'],
    ['multiplication', '🍎', '10 × 9 = 90', '10 Groups of 9 = 90!', 'Each box holds 9 apples. How many apples are in 10 boxes?', 'Each box holds 9 apples. How many apples are in 10 boxes?', '90', '99', '81', '100', '10 × 9 means 10 groups of 9, which is 90!'],
    ['multiplication', '🍪', '6 × 9 = 54', '6 Groups of 9 = 54!', 'Max bakes 6 trays with 9 cookies on each tray. How many cookies in all?', 'Max bakes 6 trays with 9 cookies on each tray. How many cookies in all?', '54', '63', '45', '60', '6 × 9 means 6 groups of 9, which is 54!'],
    ['multiplication', '🖍️', '11 × 6 = 66', '11 Groups of 6 = 66!', 'Each pack has 6 crayons. How many crayons are in 11 packs?', 'Each pack has 6 crayons. How many crayons are in 11 packs?', '66', '72', '60', '77', '11 × 6 means 11 groups of 6, which is 66!'],
    ['multiplication', '🪑', '12 × 5 = 60', '12 Groups of 5 = 60!', 'There are 12 rows of chairs with 5 chairs in each row. How many chairs in all?', 'There are 12 rows of chairs with 5 chairs in each row. How many chairs in all?', '60', '65', '55', '72', '12 × 5 means 12 groups of 5, which is 60!'],
    ['multiplication', '🥚', '5 × 3 = 15', '5 Groups of 3 = 15!', 'Each carton holds 3 eggs. How many eggs are in 5 cartons?', 'Each carton holds 3 eggs. How many eggs are in 5 cartons?', '15', '18', '12', '20', '5 × 3 means 5 groups of 3, which is 15!'],
    ['multiplication', '🍎', '7 × 9 = 63', '7 Groups of 9 = 63!', 'Each box holds 9 apples. How many apples are in 7 boxes?', 'Each box holds 9 apples. How many apples are in 7 boxes?', '63', '72', '54', '70', '7 × 9 means 7 groups of 9, which is 63!'],
    ['multiplication', '🥚', '9 × 7 = 63', '9 Groups of 7 = 63!', 'Each carton holds 7 eggs. How many eggs are in 9 cartons?', 'Each carton holds 7 eggs. How many eggs are in 9 cartons?', '63', '70', '56', '72', '9 × 7 means 9 groups of 7, which is 63!'],
    ['multiplication', '🪑', '8 × 8 = 64', '8 Groups of 8 = 64!', 'There are 8 rows of chairs with 8 chairs in each row. How many chairs in all?', 'There are 8 rows of chairs with 8 chairs in each row. How many chairs in all?', '64', '72', '56', '74', '8 × 8 means 8 groups of 8, which is 64!'],
    ['multiplication', '🌱', '3 × 9 = 27', '3 Groups of 9 = 27!', 'A garden has 3 rows with 9 plants in each row. How many plants are there?', 'A garden has 3 rows with 9 plants in each row. How many plants are there?', '27', '36', '18', '30', '3 × 9 means 3 groups of 9, which is 27!'],
    ['multiplication', '🍪', '3 × 8 = 24', '3 Groups of 8 = 24!', 'Ella bakes 3 trays with 8 cookies on each tray. How many cookies in all?', 'Ella bakes 3 trays with 8 cookies on each tray. How many cookies in all?', '24', '32', '16', '27', '3 × 8 means 3 groups of 8, which is 24!'],
    ['multiplication', '🖍️', '5 × 2 = 10', '5 Groups of 2 = 10!', 'Each pack has 2 crayons. How many crayons are in 5 packs?', 'Each pack has 2 crayons. How many crayons are in 5 packs?', '10', '12', '8', '15', '5 × 2 means 5 groups of 2, which is 10!'],
    ['multiplication', '🖍️', '8 × 6 = 48', '8 Groups of 6 = 48!', 'Each pack has 6 crayons. How many crayons are in 8 packs?', 'Each pack has 6 crayons. How many crayons are in 8 packs?', '48', '54', '42', '56', '8 × 6 means 8 groups of 6, which is 48!'],
    ['multiplication', '🔵', '12 × 4 = 48', '12 Groups of 4 = 48!', 'There are 12 bags with 4 marbles in each bag. How many marbles are there in all?', 'There are 12 bags with 4 marbles in each bag. How many marbles are there in all?', '48', '52', '44', '60', '12 × 4 means 12 groups of 4, which is 48!'],
    ['multiplication', '🥚', '8 × 7 = 56', '8 Groups of 7 = 56!', 'Each carton holds 7 eggs. How many eggs are in 8 cartons?', 'Each carton holds 7 eggs. How many eggs are in 8 cartons?', '56', '63', '49', '64', '8 × 7 means 8 groups of 7, which is 56!'],
    ['multiplication', '🥚', '6 × 8 = 48', '6 Groups of 8 = 48!', 'Each carton holds 8 eggs. How many eggs are in 6 cartons?', 'Each carton holds 8 eggs. How many eggs are in 6 cartons?', '48', '56', '40', '54', '6 × 8 means 6 groups of 8, which is 48!'],
    ['multiplication', '🖍️', '9 × 8 = 72', '9 Groups of 8 = 72!', 'Each pack has 8 crayons. How many crayons are in 9 packs?', 'Each pack has 8 crayons. How many crayons are in 9 packs?', '72', '80', '64', '81', '9 × 8 means 9 groups of 8, which is 72!'],
    ['multiplication', '🎟️', '$8 × 5 = $40', '5 Tickets at $8 Each = $40!', 'Each ticket costs $8. How much do 5 tickets cost?', 'Each ticket costs $8. How much do 5 tickets cost?', '40', '48', '32', '41', '$8 × 5 = $40!'],
    ['multiplication', '🎟️', '$3 × 9 = $27', '9 Tickets at $3 Each = $27!', 'Each ticket costs $3. How much do 9 tickets cost?', 'Each ticket costs $3. How much do 9 tickets cost?', '27', '30', '24', '28', '$3 × 9 = $27!'],
    ['multiplication', '🎟️', '$8 × 2 = $16', '2 Tickets at $8 Each = $16!', 'Each ticket costs $8. How much do 2 tickets cost?', 'Each ticket costs $8. How much do 2 tickets cost?', '16', '24', '8', '17', '$8 × 2 = $16!'],
    ['multiplication', '🎟️', '$9 × 8 = $72', '8 Tickets at $9 Each = $72!', 'Each ticket costs $9. How much do 8 tickets cost?', 'Each ticket costs $9. How much do 8 tickets cost?', '72', '81', '63', '73', '$9 × 8 = $72!'],
    ['multiplication', '🎟️', '$7 × 9 = $63', '9 Tickets at $7 Each = $63!', 'Each ticket costs $7. How much do 9 tickets cost?', 'Each ticket costs $7. How much do 9 tickets cost?', '63', '70', '56', '64', '$7 × 9 = $63!'],
    // ➗ DIVISION — batch 2 (100 new, 2026-10-24)
    ['division', '🐢', '42 ÷ 6 = 7', '42 Shared into 6 Equal Groups = 7 in Each!', 'Forty-two divided by six equals seven!', 'What is 42 ÷ 6?', '7', '8', '6', '9', '7 × 6 = 42, so 42 ÷ 6 = 7!'],
    ['division', '🖍️', '35 ÷ 7 = 5', '35 Shared into 7 Equal Groups = 5 in Each!', 'Thirty-five divided by seven equals five!', 'What is 35 ÷ 7?', '5', '6', '4', '7', '5 × 7 = 35, so 35 ÷ 7 = 5!'],
    ['division', '🖍️', '72 ÷ 9 = 8', '72 Shared into 9 Equal Groups = 8 in Each!', 'Seventy-two divided by nine equals eight!', 'What is 72 ÷ 9?', '8', '9', '7', '10', '8 × 9 = 72, so 72 ÷ 9 = 8!'],
    ['division', '🌟', '64 ÷ 8 = 8', '64 Shared into 8 Equal Groups = 8 in Each!', 'Sixty-four divided by eight equals eight!', 'What is 64 ÷ 8?', '8', '9', '7', '10', '8 × 8 = 64, so 64 ÷ 8 = 8!'],
    ['division', '🌈', '30 ÷ 3 = 10', '30 Shared into 3 Equal Groups = 10 in Each!', 'Thirty divided by three equals ten!', 'What is 30 ÷ 3?', '10', '11', '9', '12', '10 × 3 = 30, so 30 ÷ 3 = 10!'],
    ['division', '🦁', '21 ÷ 7 = 3', '21 Shared into 7 Equal Groups = 3 in Each!', 'Twenty-one divided by seven equals three!', 'What is 21 ÷ 7?', '3', '4', '2', '5', '3 × 7 = 21, so 21 ÷ 7 = 3!'],
    ['division', '🏀', '56 ÷ 7 = 8', '56 Shared into 7 Equal Groups = 8 in Each!', 'Fifty-six divided by seven equals eight!', 'What is 56 ÷ 7?', '8', '9', '7', '10', '8 × 7 = 56, so 56 ÷ 7 = 8!'],
    ['division', '🎲', '90 ÷ 9 = 10', '90 Shared into 9 Equal Groups = 10 in Each!', 'Ninety divided by nine equals ten!', 'What is 90 ÷ 9?', '10', '11', '9', '12', '10 × 9 = 90, so 90 ÷ 9 = 10!'],
    ['division', '📚', '24 ÷ 3 = 8', '24 Shared into 3 Equal Groups = 8 in Each!', 'Twenty-four divided by three equals eight!', 'What is 24 ÷ 3?', '8', '9', '7', '10', '8 × 3 = 24, so 24 ÷ 3 = 8!'],
    ['division', '🍉', '60 ÷ 10 = 6', '60 Shared into 10 Equal Groups = 6 in Each!', 'Sixty divided by ten equals six!', 'What is 60 ÷ 10?', '6', '7', '5', '8', '6 × 10 = 60, so 60 ÷ 10 = 6!'],
    ['division', '📚', '24 ÷ 2 = 12', '24 Shared into 2 Equal Groups = 12 in Each!', 'Twenty-four divided by two equals twelve!', 'What is 24 ÷ 2?', '12', '13', '11', '14', '12 × 2 = 24, so 24 ÷ 2 = 12!'],
    ['division', '☀️', '20 ÷ 2 = 10', '20 Shared into 2 Equal Groups = 10 in Each!', 'Twenty divided by two equals ten!', 'What is 20 ÷ 2?', '10', '11', '9', '12', '10 × 2 = 20, so 20 ÷ 2 = 10!'],
    ['division', '🍉', '22 ÷ 11 = 2', '22 Shared into 11 Equal Groups = 2 in Each!', 'Twenty-two divided by eleven equals two!', 'What is 22 ÷ 11?', '2', '3', '1', '4', '2 × 11 = 22, so 22 ÷ 11 = 2!'],
    ['division', '🍇', '99 ÷ 9 = 11', '99 Shared into 9 Equal Groups = 11 in Each!', 'Ninety-nine divided by nine equals eleven!', 'What is 99 ÷ 9?', '11', '12', '10', '13', '11 × 9 = 99, so 99 ÷ 9 = 11!'],
    ['division', '🌟', '40 ÷ 4 = 10', '40 Shared into 4 Equal Groups = 10 in Each!', 'Forty divided by four equals ten!', 'What is 40 ÷ 4?', '10', '11', '9', '12', '10 × 4 = 40, so 40 ÷ 4 = 10!'],
    ['division', '🏀', '30 ÷ 10 = 3', '30 Shared into 10 Equal Groups = 3 in Each!', 'Thirty divided by ten equals three!', 'What is 30 ÷ 10?', '3', '4', '2', '5', '3 × 10 = 30, so 30 ÷ 10 = 3!'],
    ['division', '🌻', '36 ÷ 12 = 3', '36 Shared into 12 Equal Groups = 3 in Each!', 'Thirty-six divided by twelve equals three!', 'What is 36 ÷ 12?', '3', '4', '2', '5', '3 × 12 = 36, so 36 ÷ 12 = 3!'],
    ['division', '📚', '120 ÷ 12 = 10', '120 Shared into 12 Equal Groups = 10 in Each!', 'One hundred twenty divided by twelve equals ten!', 'What is 120 ÷ 12?', '10', '11', '9', '12', '10 × 12 = 120, so 120 ÷ 12 = 10!'],
    ['division', '🐶', '48 ÷ 4 = 12', '48 Shared into 4 Equal Groups = 12 in Each!', 'Forty-eight divided by four equals twelve!', 'What is 48 ÷ 4?', '12', '13', '11', '14', '12 × 4 = 48, so 48 ÷ 4 = 12!'],
    ['division', '🦕', '72 ÷ 12 = 6', '72 Shared into 12 Equal Groups = 6 in Each!', 'Seventy-two divided by twelve equals six!', 'What is 72 ÷ 12?', '6', '7', '5', '8', '6 × 12 = 72, so 72 ÷ 12 = 6!'],
    ['division', '🖍️', '120 ÷ 10 = 12', '120 Shared into 10 Equal Groups = 12 in Each!', 'One hundred twenty divided by ten equals twelve!', 'What is 120 ÷ 10?', '12', '13', '11', '14', '12 × 10 = 120, so 120 ÷ 10 = 12!'],
    ['division', '🚗', '121 ÷ 11 = 11', '121 Shared into 11 Equal Groups = 11 in Each!', 'One hundred twenty-one divided by eleven equals eleven!', 'What is 121 ÷ 11?', '11', '12', '10', '13', '11 × 11 = 121, so 121 ÷ 11 = 11!'],
    ['division', '🐶', '14 ÷ 7 = 2', '14 Shared into 7 Equal Groups = 2 in Each!', 'Fourteen divided by seven equals two!', 'What is 14 ÷ 7?', '2', '3', '1', '4', '2 × 7 = 14, so 14 ÷ 7 = 2!'],
    ['division', '⚽', '63 ÷ 9 = 7', '63 Shared into 9 Equal Groups = 7 in Each!', 'Sixty-three divided by nine equals seven!', 'What is 63 ÷ 9?', '7', '8', '6', '9', '7 × 9 = 63, so 63 ÷ 9 = 7!'],
    ['division', '🌈', '80 ÷ 10 = 8', '80 Shared into 10 Equal Groups = 8 in Each!', 'Eighty divided by ten equals eight!', 'What is 80 ÷ 10?', '8', '9', '7', '10', '8 × 10 = 80, so 80 ÷ 10 = 8!'],
    ['division', '🍓', '63 ÷ 7 = 9', '63 Shared into 7 Equal Groups = 9 in Each!', 'Sixty-three divided by seven equals nine!', 'What is 63 ÷ 7?', '9', '10', '8', '11', '9 × 7 = 63, so 63 ÷ 7 = 9!'],
    ['division', '🪙', '24 ÷ 12 = 2', '24 Shared into 12 Equal Groups = 2 in Each!', 'Twenty-four divided by twelve equals two!', 'What is 24 ÷ 12?', '2', '3', '1', '4', '2 × 12 = 24, so 24 ÷ 12 = 2!'],
    ['division', '🎵', '32 ÷ 4 = 8', '32 Shared into 4 Equal Groups = 8 in Each!', 'Thirty-two divided by four equals eight!', 'What is 32 ÷ 4?', '8', '9', '7', '10', '8 × 4 = 32, so 32 ÷ 4 = 8!'],
    ['division', '⭐', '55 ÷ 5 = 11', '55 Shared into 5 Equal Groups = 11 in Each!', 'Fifty-five divided by five equals eleven!', 'What is 55 ÷ 5?', '11', '12', '10', '13', '11 × 5 = 55, so 55 ÷ 5 = 11!'],
    ['division', '🍉', '132 ÷ 12 = 11', '132 Shared into 12 Equal Groups = 11 in Each!', 'One hundred thirty-two divided by twelve equals eleven!', 'What is 132 ÷ 12?', '11', '12', '10', '13', '11 × 12 = 132, so 132 ÷ 12 = 11!'],
    ['division', '🦁', '45 ÷ 5 = 9', '45 Shared into 5 Equal Groups = 9 in Each!', 'Forty-five divided by five equals nine!', 'What is 45 ÷ 5?', '9', '10', '8', '11', '9 × 5 = 45, so 45 ÷ 5 = 9!'],
    ['division', '📚', '110 ÷ 10 = 11', '110 Shared into 10 Equal Groups = 11 in Each!', 'One hundred ten divided by ten equals eleven!', 'What is 110 ÷ 10?', '11', '12', '10', '13', '11 × 10 = 110, so 110 ÷ 10 = 11!'],
    ['division', '🦋', '81 ÷ 9 = 9', '81 Shared into 9 Equal Groups = 9 in Each!', 'Eighty-one divided by nine equals nine!', 'What is 81 ÷ 9?', '9', '10', '8', '11', '9 × 9 = 81, so 81 ÷ 9 = 9!'],
    ['division', '🌟', '96 ÷ 12 = 8', '96 Shared into 12 Equal Groups = 8 in Each!', 'Ninety-six divided by twelve equals eight!', 'What is 96 ÷ 12?', '8', '9', '7', '10', '8 × 12 = 96, so 96 ÷ 12 = 8!'],
    ['division', '🐘', '4 ÷ 2 = 2', '4 Shared into 2 Equal Groups = 2 in Each!', 'Four divided by two equals two!', 'What is 4 ÷ 2?', '2', '3', '1', '4', '2 × 2 = 4, so 4 ÷ 2 = 2!'],
    ['division', '⚽', '55 ÷ 11 = 5', '55 Shared into 11 Equal Groups = 5 in Each!', 'Fifty-five divided by eleven equals five!', 'What is 55 ÷ 11?', '5', '6', '4', '7', '5 × 11 = 55, so 55 ÷ 11 = 5!'],
    ['division', '🎁', '18 ÷ 6 = 3', '18 Shared into 6 Equal Groups = 3 in Each!', 'Eighteen divided by six equals three!', 'What is 18 ÷ 6?', '3', '4', '2', '5', '3 × 6 = 18, so 18 ÷ 6 = 3!'],
    ['division', '🐝', '60 ÷ 6 = 10', '60 Shared into 6 Equal Groups = 10 in Each!', 'Sixty divided by six equals ten!', 'What is 60 ÷ 6?', '10', '11', '9', '12', '10 × 6 = 60, so 60 ÷ 6 = 10!'],
    ['division', '🐶', '48 ÷ 6 = 8', '48 Shared into 6 Equal Groups = 8 in Each!', 'Forty-eight divided by six equals eight!', 'What is 48 ÷ 6?', '8', '9', '7', '10', '8 × 6 = 48, so 48 ÷ 6 = 8!'],
    ['division', '🎈', '54 ÷ 6 = 9', '54 Shared into 6 Equal Groups = 9 in Each!', 'Fifty-four divided by six equals nine!', 'What is 54 ÷ 6?', '9', '10', '8', '11', '9 × 6 = 54, so 54 ÷ 6 = 9!'],
    ['division', '🌙', '81 ÷ 3 = 27', '81 Shared into 3 Equal Groups = 27 in Each!', 'Eighty-one divided by three equals twenty-seven!', 'What is 81 ÷ 3?', '27', '28', '26', '29', '3 × 27 = 81, so the answer is 27!'],
    ['division', '🍓', '125 ÷ 5 = 25', '125 Shared into 5 Equal Groups = 25 in Each!', 'One hundred twenty-five divided by five equals twenty-five!', 'What is 125 ÷ 5?', '25', '26', '24', '27', '5 × 25 = 125, so the answer is 25!'],
    ['division', '🎯', '44 ÷ 2 = 22', '44 Shared into 2 Equal Groups = 22 in Each!', 'Forty-four divided by two equals twenty-two!', 'What is 44 ÷ 2?', '22', '23', '21', '24', '2 × 22 = 44, so the answer is 22!'],
    ['division', '🎯', '114 ÷ 6 = 19', '114 Shared into 6 Equal Groups = 19 in Each!', 'One hundred fourteen divided by six equals nineteen!', 'What is 114 ÷ 6?', '19', '20', '18', '21', '6 × 19 = 114, so the answer is 19!'],
    ['division', '🌈', '133 ÷ 7 = 19', '133 Shared into 7 Equal Groups = 19 in Each!', 'One hundred thirty-three divided by seven equals nineteen!', 'What is 133 ÷ 7?', '19', '20', '18', '21', '7 × 19 = 133, so the answer is 19!'],
    ['division', '🎯', '168 ÷ 8 = 21', '168 Shared into 8 Equal Groups = 21 in Each!', 'One hundred sixty-eight divided by eight equals twenty-one!', 'What is 168 ÷ 8?', '21', '22', '20', '23', '8 × 21 = 168, so the answer is 21!'],
    ['division', '🦁', '104 ÷ 4 = 26', '104 Shared into 4 Equal Groups = 26 in Each!', 'One hundred four divided by four equals twenty-six!', 'What is 104 ÷ 4?', '26', '27', '25', '28', '4 × 26 = 104, so the answer is 26!'],
    ['division', '🎨', '69 ÷ 3 = 23', '69 Shared into 3 Equal Groups = 23 in Each!', 'Sixty-nine divided by three equals twenty-three!', 'What is 69 ÷ 3?', '23', '24', '22', '25', '3 × 23 = 69, so the answer is 23!'],
    ['division', '⭐', '112 ÷ 7 = 16', '112 Shared into 7 Equal Groups = 16 in Each!', 'One hundred twelve divided by seven equals sixteen!', 'What is 112 ÷ 7?', '16', '17', '15', '18', '7 × 16 = 112, so the answer is 16!'],
    ['division', '🦒', '120 ÷ 8 = 15', '120 Shared into 8 Equal Groups = 15 in Each!', 'One hundred twenty divided by eight equals fifteen!', 'What is 120 ÷ 8?', '15', '16', '14', '17', '8 × 15 = 120, so the answer is 15!'],
    ['division', '🦋', '168 ÷ 7 = 24', '168 Shared into 7 Equal Groups = 24 in Each!', 'One hundred sixty-eight divided by seven equals twenty-four!', 'What is 168 ÷ 7?', '24', '25', '23', '26', '7 × 24 = 168, so the answer is 24!'],
    ['division', '🐢', '98 ÷ 7 = 14', '98 Shared into 7 Equal Groups = 14 in Each!', 'Ninety-eight divided by seven equals fourteen!', 'What is 98 ÷ 7?', '14', '15', '13', '16', '7 × 14 = 98, so the answer is 14!'],
    ['division', '🚗', '108 ÷ 9 = 12', '108 Shared into 9 Equal Groups = 12 in Each!', 'One hundred eight divided by nine equals twelve!', 'What is 108 ÷ 9?', '12', '13', '11', '14', '9 × 12 = 108, so the answer is 12!'],
    ['division', '🧩', '90 ÷ 3 = 30', '90 Shared into 3 Equal Groups = 30 in Each!', 'Ninety divided by three equals thirty!', 'What is 90 ÷ 3?', '30', '31', '29', '32', '3 × 30 = 90, so the answer is 30!'],
    ['division', '🍪', '117 ÷ 9 = 13', '117 Shared into 9 Equal Groups = 13 in Each!', 'One hundred seventeen divided by nine equals thirteen!', 'What is 117 ÷ 9?', '13', '14', '12', '15', '9 × 13 = 117, so the answer is 13!'],
    ['division', '🐠', '26 ÷ 2 = 13', '26 Shared into 2 Equal Groups = 13 in Each!', 'Twenty-six divided by two equals thirteen!', 'What is 26 ÷ 2?', '13', '14', '12', '15', '2 × 13 = 26, so the answer is 13!'],
    ['division', '🎈', '135 ÷ 9 = 15', '135 Shared into 9 Equal Groups = 15 in Each!', 'One hundred thirty-five divided by nine equals fifteen!', 'What is 135 ÷ 9?', '15', '16', '14', '17', '9 × 15 = 135, so the answer is 15!'],
    ['division', '🦋', '84 ÷ 6 = 14', '84 Shared into 6 Equal Groups = 14 in Each!', 'Eighty-four divided by six equals fourteen!', 'What is 84 ÷ 6?', '14', '15', '13', '16', '6 × 14 = 84, so the answer is 14!'],
    ['division', '🎈', '100 ÷ 5 = 20', '100 Shared into 5 Equal Groups = 20 in Each!', 'One hundred divided by five equals twenty!', 'What is 100 ÷ 5?', '20', '21', '19', '22', '5 × 20 = 100, so the answer is 20!'],
    ['division', '🚗', '85 ÷ 5 = 17', '85 Shared into 5 Equal Groups = 17 in Each!', 'Eighty-five divided by five equals seventeen!', 'What is 85 ÷ 5?', '17', '18', '16', '19', '5 × 17 = 85, so the answer is 17!'],
    ['division', '🦕', '180 ÷ 6 = 30', '180 Shared into 6 Equal Groups = 30 in Each!', 'One hundred eighty divided by six equals thirty!', 'What is 180 ÷ 6?', '30', '31', '29', '32', '6 × 30 = 180, so the answer is 30!'],
    ['division', '🐢', '60 ÷ 4 = 15', '60 Shared into 4 Equal Groups = 15 in Each!', 'Sixty divided by four equals fifteen!', 'What is 60 ÷ 4?', '15', '16', '14', '17', '4 × 15 = 60, so the answer is 15!'],
    ['division', '🎲', '90 ÷ 6 = 15', '90 Shared into 6 Equal Groups = 15 in Each!', 'Ninety divided by six equals fifteen!', 'What is 90 ÷ 6?', '15', '16', '14', '17', '6 × 15 = 90, so the answer is 15!'],
    ['division', '🚀', '180 ÷ 9 = 20', '180 Shared into 9 Equal Groups = 20 in Each!', 'One hundred eighty divided by nine equals twenty!', 'What is 180 ÷ 9?', '20', '21', '19', '22', '9 × 20 = 180, so the answer is 20!'],
    ['division', '🦕', '160 ÷ 8 = 20', '160 Shared into 8 Equal Groups = 20 in Each!', 'One hundred sixty divided by eight equals twenty!', 'What is 160 ÷ 8?', '20', '21', '19', '22', '8 × 20 = 160, so the answer is 20!'],
    ['division', '🌈', '180 ÷ 10 = 18', '180 Grouped by Tens = 18 Groups of 10!', 'One hundred eighty divided by ten equals eighteen!', 'What is 180 ÷ 10?', '18', '19', '17', '10', '10 × 18 = 180, so 180 ÷ 10 = 18!'],
    ['division', '🌻', '170 ÷ 10 = 17', '170 Grouped by Tens = 17 Groups of 10!', 'One hundred seventy divided by ten equals seventeen!', 'What is 170 ÷ 10?', '17', '18', '16', '10', '10 × 17 = 170, so 170 ÷ 10 = 17!'],
    ['division', '🌟', '200 ÷ 10 = 20', '200 Grouped by Tens = 20 Groups of 10!', 'Two hundred divided by ten equals twenty!', 'What is 200 ÷ 10?', '20', '21', '19', '10', '10 × 20 = 200, so 200 ÷ 10 = 20!'],
    ['division', '🌻', '90 ÷ 10 = 9', '90 Grouped by Tens = 9 Groups of 10!', 'Ninety divided by ten equals nine!', 'What is 90 ÷ 10?', '9', '10', '8', '11', '10 × 9 = 90, so 90 ÷ 10 = 9!'],
    ['division', '🐠', '130 ÷ 10 = 13', '130 Grouped by Tens = 13 Groups of 10!', 'One hundred thirty divided by ten equals thirteen!', 'What is 130 ÷ 10?', '13', '14', '12', '10', '10 × 13 = 130, so 130 ÷ 10 = 13!'],
    ['division', '🚀', '190 ÷ 10 = 19', '190 Grouped by Tens = 19 Groups of 10!', 'One hundred ninety divided by ten equals nineteen!', 'What is 190 ÷ 10?', '19', '20', '18', '10', '10 × 19 = 190, so 190 ÷ 10 = 19!'],
    ['division', '🦁', '100 ÷ 10 = 10', '100 Grouped by Tens = 10 Groups of 10!', 'One hundred divided by ten equals ten!', 'What is 100 ÷ 10?', '10', '11', '9', '12', '10 × 10 = 100, so 100 ÷ 10 = 10!'],
    ['division', '🪙', '70 ÷ 10 = 7', '70 Grouped by Tens = 7 Groups of 10!', 'Seventy divided by ten equals seven!', 'What is 70 ÷ 10?', '7', '8', '6', '10', '10 × 7 = 70, so 70 ÷ 10 = 7!'],
    ['division', '🧩', '140 ÷ 10 = 14', '140 Grouped by Tens = 14 Groups of 10!', 'One hundred forty divided by ten equals fourteen!', 'What is 140 ÷ 10?', '14', '15', '13', '10', '10 × 14 = 140, so 140 ÷ 10 = 14!'],
    ['division', '🎯', '150 ÷ 10 = 15', '150 Grouped by Tens = 15 Groups of 10!', 'One hundred fifty divided by ten equals fifteen!', 'What is 150 ÷ 10?', '15', '16', '14', '10', '10 × 15 = 150, so 150 ÷ 10 = 15!'],
    ['division', '🍪', '10 ÷ 5 = 2', '10 Shared into 5 Equal Groups = 2 in Each!', '10 cookies are shared equally among 5 friends. How many cookies does each friend get?', '10 cookies are shared equally among 5 friends. How many cookies does each friend get?', '2', '3', '1', '4', '2 × 5 = 10, so 10 ÷ 5 = 2!'],
    ['division', '🌻', '77 ÷ 7 = 11', '77 Shared into 7 Equal Groups = 11 in Each!', 'Owen plants 77 seeds in 7 equal rows. How many seeds are in each row?', 'Owen plants 77 seeds in 7 equal rows. How many seeds are in each row?', '11', '12', '10', '13', '11 × 7 = 77, so 77 ÷ 7 = 11!'],
    ['division', '🍪', '27 ÷ 9 = 3', '27 Shared into 9 Equal Groups = 3 in Each!', '27 cookies are shared equally among 9 friends. How many cookies does each friend get?', '27 cookies are shared equally among 9 friends. How many cookies does each friend get?', '3', '4', '2', '5', '3 × 9 = 27, so 27 ÷ 9 = 3!'],
    ['division', '🍎', '50 ÷ 5 = 10', '50 Shared into 5 Equal Groups = 10 in Each!', 'Sam shares 50 apples equally with 5 friends (including Sam). How many apples does each person get?', 'Sam shares 50 apples equally with 5 friends (including Sam). How many apples does each person get?', '10', '11', '9', '12', '10 × 5 = 50, so 50 ÷ 5 = 10!'],
    ['division', '⭐', '27 ÷ 3 = 9', '27 Shared into 3 Equal Groups = 9 in Each!', 'Ivy earns 27 points and shares them equally among 3 teammates. How many points does each teammate get?', 'Ivy earns 27 points and shares them equally among 3 teammates. How many points does each teammate get?', '9', '10', '8', '11', '9 × 3 = 27, so 27 ÷ 3 = 9!'],
    ['division', '📚', '24 ÷ 8 = 3', '24 Shared into 8 Equal Groups = 3 in Each!', '24 books are stacked into 8 equal piles. How many books are in each pile?', '24 books are stacked into 8 equal piles. How many books are in each pile?', '3', '4', '2', '5', '3 × 8 = 24, so 24 ÷ 8 = 3!'],
    ['division', '🍊', '45 ÷ 9 = 5', '45 Shared into 9 Equal Groups = 5 in Each!', '45 oranges are packed equally into 9 bags. How many oranges are in each bag?', '45 oranges are packed equally into 9 bags. How many oranges are in each bag?', '5', '6', '4', '7', '5 × 9 = 45, so 45 ÷ 9 = 5!'],
    ['division', '🍊', '33 ÷ 3 = 11', '33 Shared into 3 Equal Groups = 11 in Each!', '33 oranges are packed equally into 3 bags. How many oranges are in each bag?', '33 oranges are packed equally into 3 bags. How many oranges are in each bag?', '11', '12', '10', '13', '11 × 3 = 33, so 33 ÷ 3 = 11!'],
    ['division', '🌻', '32 ÷ 8 = 4', '32 Shared into 8 Equal Groups = 4 in Each!', 'Ella plants 32 seeds in 8 equal rows. How many seeds are in each row?', 'Ella plants 32 seeds in 8 equal rows. How many seeds are in each row?', '4', '5', '3', '6', '4 × 8 = 32, so 32 ÷ 8 = 4!'],
    ['division', '🍪', '84 ÷ 7 = 12', '84 Shared into 7 Equal Groups = 12 in Each!', '84 cookies are shared equally among 7 friends. How many cookies does each friend get?', '84 cookies are shared equally among 7 friends. How many cookies does each friend get?', '12', '13', '11', '14', '12 × 7 = 84, so 84 ÷ 7 = 12!'],
    ['division', '⭐', '28 ÷ 4 = 7', '28 Shared into 4 Equal Groups = 7 in Each!', 'Ben earns 28 points and shares them equally among 4 teammates. How many points does each teammate get?', 'Ben earns 28 points and shares them equally among 4 teammates. How many points does each teammate get?', '7', '8', '6', '9', '7 × 4 = 28, so 28 ÷ 4 = 7!'],
    ['division', '🔵', '88 ÷ 8 = 11', '88 Shared into 8 Equal Groups = 11 in Each!', '88 marbles are put into 8 equal groups. How many marbles are in each group?', '88 marbles are put into 8 equal groups. How many marbles are in each group?', '11', '12', '10', '13', '11 × 8 = 88, so 88 ÷ 8 = 11!'],
    ['division', '🔵', '6 ÷ 3 = 2', '6 Shared into 3 Equal Groups = 2 in Each!', '6 marbles are put into 3 equal groups. How many marbles are in each group?', '6 marbles are put into 3 equal groups. How many marbles are in each group?', '2', '3', '1', '4', '2 × 3 = 6, so 6 ÷ 3 = 2!'],
    ['division', '⭐', '72 ÷ 8 = 9', '72 Shared into 8 Equal Groups = 9 in Each!', 'Eli has 72 stickers to share equally among 8 friends. How many stickers does each friend get?', 'Eli has 72 stickers to share equally among 8 friends. How many stickers does each friend get?', '9', '10', '8', '11', '9 × 8 = 72, so 72 ÷ 8 = 9!'],
    ['division', '🍪', '16 ÷ 8 = 2', '16 Shared into 8 Equal Groups = 2 in Each!', '16 cookies are shared equally among 8 friends. How many cookies does each friend get?', '16 cookies are shared equally among 8 friends. How many cookies does each friend get?', '2', '3', '1', '4', '2 × 8 = 16, so 16 ÷ 8 = 2!'],
    ['division', '🔵', '18 ÷ 2 = 9', '18 Shared into 2 Equal Groups = 9 in Each!', '18 marbles are put into 2 equal groups. How many marbles are in each group?', '18 marbles are put into 2 equal groups. How many marbles are in each group?', '9', '10', '8', '11', '9 × 2 = 18, so 18 ÷ 2 = 9!'],
    ['division', '🍪', '18 ÷ 9 = 2', '18 Shared into 9 Equal Groups = 2 in Each!', '18 cookies are shared equally among 9 friends. How many cookies does each friend get?', '18 cookies are shared equally among 9 friends. How many cookies does each friend get?', '2', '3', '1', '4', '2 × 9 = 18, so 18 ÷ 9 = 2!'],
    ['division', '🍊', '80 ÷ 8 = 10', '80 Shared into 8 Equal Groups = 10 in Each!', '80 oranges are packed equally into 8 bags. How many oranges are in each bag?', '80 oranges are packed equally into 8 bags. How many oranges are in each bag?', '10', '11', '9', '12', '10 × 8 = 80, so 80 ÷ 8 = 10!'],
    ['division', '🍪', '36 ÷ 4 = 9', '36 Shared into 4 Equal Groups = 9 in Each!', '36 cookies are shared equally among 4 friends. How many cookies does each friend get?', '36 cookies are shared equally among 4 friends. How many cookies does each friend get?', '9', '10', '8', '11', '9 × 4 = 36, so 36 ÷ 4 = 9!'],
    ['division', '⭐', '12 ÷ 6 = 2', '12 Shared into 6 Equal Groups = 2 in Each!', 'Eli has 12 stickers to share equally among 6 friends. How many stickers does each friend get?', 'Eli has 12 stickers to share equally among 6 friends. How many stickers does each friend get?', '2', '3', '1', '4', '2 × 6 = 12, so 12 ÷ 6 = 2!'],
    ['division', '🔵', '8 ÷ 4 = 2', '8 Shared into 4 Equal Groups = 2 in Each!', '8 marbles are put into 4 equal groups. How many marbles are in each group?', '8 marbles are put into 4 equal groups. How many marbles are in each group?', '2', '3', '1', '4', '2 × 4 = 8, so 8 ÷ 4 = 2!'],
    ['division', '📚', '36 ÷ 9 = 4', '36 Shared into 9 Equal Groups = 4 in Each!', '36 books are stacked into 9 equal piles. How many books are in each pile?', '36 books are stacked into 9 equal piles. How many books are in each pile?', '4', '5', '3', '6', '4 × 9 = 36, so 36 ÷ 9 = 4!'],
    ['division', '🌻', '40 ÷ 5 = 8', '40 Shared into 5 Equal Groups = 8 in Each!', 'Lily plants 40 seeds in 5 equal rows. How many seeds are in each row?', 'Lily plants 40 seeds in 5 equal rows. How many seeds are in each row?', '8', '9', '7', '10', '8 × 5 = 40, so 40 ÷ 5 = 8!'],
    ['division', '🍎', '56 ÷ 8 = 7', '56 Shared into 8 Equal Groups = 7 in Each!', 'Jack shares 56 apples equally with 8 friends (including Jack). How many apples does each person get?', 'Jack shares 56 apples equally with 8 friends (including Jack). How many apples does each person get?', '7', '8', '6', '9', '7 × 8 = 56, so 56 ÷ 8 = 7!'],
    ['division', '🍊', '72 ÷ 6 = 12', '72 Shared into 6 Equal Groups = 12 in Each!', '72 oranges are packed equally into 6 bags. How many oranges are in each bag?', '72 oranges are packed equally into 6 bags. How many oranges are in each bag?', '12', '13', '11', '14', '12 × 6 = 72, so 72 ÷ 6 = 12!'],
  ];

  function ensureMathItemsInNumbersPack() {
    const pack = window.multiLangData && window.multiLangData.numbers;
    if (!pack || !Array.isArray(pack.kidItems) || pack._extraMathMerged) return;
    const seen = new Set(pack.kidItems.map(i => i.primary));
    EXTRA_MATH_BANK.forEach(([op, emoji, cardEq, cardMeaning, speech]) => {
      if (!seen.has(cardEq)) {
        seen.add(cardEq);
        pack.kidItems.push({
          emoji: emoji,
          primary: cardEq,
          meaning: cardMeaning,
          speech: speech,
          mathOp: op
        });
      }
    });
    // Tag existing items with mathOp if they contain + or -
    pack.kidItems.forEach(item => {
      if (!item.mathOp) {
        if (item.primary.includes('+')) item.mathOp = 'addition';
        else if (item.primary.includes('-')) item.mathOp = 'subtraction';
        else if (item.primary.includes('×')) item.mathOp = 'multiplication';
        else if (item.primary.includes('÷') || item.primary.includes('/')) item.mathOp = 'division';
      }
    });
    pack._extraMathMerged = true;
  }

  function getGeneratedMathQuestions(opFilterOverride) {
    ensureMathItemsInNumbersPack();
    const filter = opFilterOverride !== undefined ? opFilterOverride : mathOpFilter;
    const letters = ['A', 'B', 'C', 'D'];
    return EXTRA_MATH_BANK
      .filter(([op]) => !filter || filter === 'all' || op === filter)
      .map(([op, emoji, cardEq, cardMeaning, speech, questionPrompt, ans, d1, d2, d3, explanation], idx) => {
        const opts = [ans, d1, d2, d3];
        const shift = (idx * 3 + cardEq.length) % 4;
        const rotated = [opts[shift], opts[(shift + 1) % 4], opts[(shift + 2) % 4], opts[(shift + 3) % 4]];
        const correctLetter = letters[rotated.indexOf(ans)];
        const opLabels = {
          addition: '➕ Addition',
          subtraction: '➖ Subtraction',
          multiplication: '✖️ Multiplication',
          division: '➗ Division'
        };
        return {
          id: 'kid_math_' + op + '_' + idx,
          targetProfile: 'kid',
          domain: '6+ Numbers & Math',
          skill: opLabels[op] || 'Math',
          mathOp: op,
          question: {
            paragraph: `${emoji} ${opLabels[op]} Challenge`,
            question: questionPrompt,
            choices: {
              A: rotated[0],
              B: rotated[1],
              C: rotated[2],
              D: rotated[3]
            },
            correct_answer: correctLetter,
            explanation: `${cardEq} — ${explanation}`
          }
        };
      });
  }

  function ensureMathOpBar() {
    const passageBox = document.getElementById('kidQuizPassageBox');
    const host = passageBox && passageBox.parentNode;
    if (!host) return;
    let bar = document.getElementById('mathOpFilterBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'mathOpFilterBar';
      bar.className = 'flex flex-wrap items-center justify-center gap-2 mb-4';
      host.insertBefore(bar, passageBox);
    }
    const isMath = !!(window.appData && window.appData.kidCategory === 'numbers');
    bar.classList.toggle('hidden', !isMath);
    if (!isMath) return;

    // Symbol-only operation buttons (Step 6): the counts (25) and the
    // XP pills are gone — a young learner just taps ➕ ➖ ✖️ ➗ (or 🌟
    // for all). The name lives in title/aria-label for screen readers.
    const ops = [
      ['all', '🌟', 'All Math'],
      ['addition', '➕', 'Addition'],
      ['subtraction', '➖', 'Subtraction'],
      ['multiplication', '✖️', 'Multiplication'],
      ['division', '➗', 'Division']
    ];
    bar.innerHTML = ops.map(([key, symbol, name]) => {
      const active = key === mathOpFilter;
      const cls = active
        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50';
      return `<button id="math-op-${key}" title="${name}" aria-label="${name}" onclick="setMathOpFilter('${key}')" class="w-11 h-11 rounded-2xl text-xl border-2 transition flex items-center justify-center ${cls}">${symbol}</button>`;
    }).join('');
  }

  function setMathOpFilter(op) {
    mathOpFilter = op;
    window.mathOpFilter = op;
    kidCardIdx = 0;
    ensureMathOpBar();
    renderKidFlashcard();
    generateKidQuizRound();
  }

  function setKidSubMode(mode) {
    const pack = window.multiLangData && window.multiLangData[window.appData.kidCategory];
    if (mode === 'letters' && (!pack || !pack.letters || pack.letters.length === 0)) {
      if (typeof window.showToast === 'function') {
        window.showToast("Alphabet Letters mode is available for Malayalam & Hindi!");
      }
      return;
    }
    kidSubMode = mode;
    ['letters', 'words', 'sentences', 'spelling'].forEach(m => {
      const btn = document.getElementById(`btn-kid-sub-${m}`);
      if (!btn) return;
      if (m === mode) {
        btn.className = "flex-1 py-2 px-3 rounded-2xl text-xs sm:text-sm font-bold transition bg-amber-400 text-slate-950 shadow-sm";
      } else {
        btn.className = "flex-1 py-2 px-3 rounded-2xl text-xs sm:text-sm font-bold transition text-slate-700 hover:text-slate-900";
      }
    });
    kidCardIdx = 0;
    renderKidFlashcard();
    generateKidQuizRound();
    // Explorer bar (phones): sub-mode active highlight.
    document.querySelectorAll('#mobileKidBar [data-ksub]').forEach(b => {
      b.classList.toggle('mtab-active', b.getAttribute('data-ksub') === mode);
    });
  }

  function setKidViewTab(tab) {
    kidViewTab = tab;
    window.kidViewTab = tab;
    const practiceSec = document.getElementById('kidSectionPractice');
    const flashcardSec = document.getElementById('kidSectionFlashcards');
    const btnPractice = document.getElementById('tab-kid-practice');
    const btnFlash = document.getElementById('tab-kid-flashcards');

    if (practiceSec && flashcardSec) {
      if (tab === 'flashcards') {
        practiceSec.classList.add('hidden');
        flashcardSec.classList.remove('hidden');
        if (btnFlash) {
          btnFlash.className = "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm sm:text-base transition bg-amber-400 text-slate-950 border-2 border-amber-500 shadow-kids-btn btn-tactile";
        }
        if (btnPractice) {
          btnPractice.className = "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm sm:text-base transition bg-white text-slate-700 hover:text-slate-950 border-2 border-slate-200 shadow-kids-card btn-tactile";
        }
        renderKidFlashcard();
      } else {
        flashcardSec.classList.add('hidden');
        practiceSec.classList.remove('hidden');
        if (btnPractice) {
          btnPractice.className = "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm sm:text-base transition bg-amber-400 text-slate-950 border-2 border-amber-500 shadow-kids-btn btn-tactile";
        }
        if (btnFlash) {
          btnFlash.className = "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm sm:text-base transition bg-white text-slate-700 hover:text-slate-950 border-2 border-slate-200 shadow-kids-card btn-tactile";
        }
        generateKidQuizRound();
      }
    }
    if (typeof window.renderSubNavForKid === 'function') {
      window.renderSubNavForKid();
    }
    // Explorer bottom bar (phones): Practice/Flashcards active state.
    document.querySelectorAll('#mobileKidBar [data-kview]').forEach(b => {
      b.classList.toggle('mtab-active', b.getAttribute('data-kview') === tab);
    });
    // View toggle (language subjects): one button jumping to the
    // OTHER view, since the bar carries the sub-modes.
    const vt = document.getElementById('kidViewToggleBtn');
    if (vt) {
      const toFlash = tab !== 'flashcards';
      vt.innerHTML = `<span class="mtab-ico" aria-hidden="true">${toFlash ? '🃏' : '🎮'}</span><span>${toFlash ? 'Cards' : 'Quiz'}</span>`;
    }
  }

  function toggleKidViewTab() {
    setKidViewTab(kidViewTab === 'flashcards' ? 'practice' : 'flashcards');
  }
  window.toggleKidViewTab = toggleKidViewTab;

  function initKidPlayground() {
    const startCat = (window.appData && window.appData.kidCategory && window.multiLangData && window.multiLangData[window.appData.kidCategory])
      ? window.appData.kidCategory
      : 'spelling';
    selectKidCategory(startCat);
    setKidViewTab(kidViewTab || 'practice');
    renderKidProgressSummary();
  }

  // Per-profile courses (Step 6): hide the kid grid buttons of
  // courses the parent turned off, and never land on a hidden one.
  function kidCourseOn(key) {
    const p = (typeof window.activeProfile === 'function') ? window.activeProfile() : null;
    return typeof window.isCourseEnabled !== 'function' || window.isCourseEnabled(p, key);
  }
  function firstEnabledKidCategory() {
    for (const c of ALL_KID_CATEGORIES) { if (kidCourseOn(c.key)) return c.key; }
    return ALL_KID_CATEGORIES[0].key;
  }
  function applyKidCourseVisibility() {
    ALL_KID_CATEGORIES.forEach(c => {
      const btn = document.getElementById(`kidCat-${c.key}`);
      if (btn) btn.style.display = kidCourseOn(c.key) ? '' : 'none';
    });
  }
  window.applyKidCourseVisibility = applyKidCourseVisibility;

  function selectKidCategory(cat) {
    if (!window.multiLangData || !window.multiLangData[cat]) cat = 'spelling';
    // A course the parent turned off can still be the stored category
    // (changed on another device) — fall through to the first course
    // that is on instead of showing a hidden subject.
    if (!kidCourseOn(cat)) cat = firstEnabledKidCategory();
    if (window.appData) window.appData.kidCategory = cat;
    kidCardIdx = 0;
    kidQuizIdx = 0;

    // Sub-mode pills for multilingual subjects
    const subBar = document.getElementById('kidLangSubNav');
    if (subBar) {
      if (cat === 'malayalam' || cat === 'hindi' || cat === 'spanish' || cat === 'french' || cat === 'italian') {
        subBar.classList.remove('hidden');
        const pack = window.multiLangData[cat];
        const lettersBtn = document.getElementById('btn-kid-sub-letters');
        if (lettersBtn) {
          if (!pack.letters || pack.letters.length === 0) {
            lettersBtn.classList.add('opacity-40', 'cursor-not-allowed');
            if (kidSubMode === 'letters') kidSubMode = 'words';
          } else {
            lettersBtn.classList.remove('opacity-40', 'cursor-not-allowed');
          }
        }
        setKidSubMode(kidSubMode);
      } else {
        subBar.classList.add('hidden');
      }
    }

    ALL_KID_CATEGORIES.forEach(c => {
      const btn = document.getElementById(`kidCat-${c.key}`);
      if (!btn) return;
      if (c.key === cat) {
        btn.className = "kid-cat-btn h-[92px] sm:h-auto px-1 py-1.5 sm:p-3.5 rounded-2xl sm:rounded-3xl bg-amber-400 text-slate-950 font-bold text-[11px] leading-tight sm:text-sm shadow-kids-btn btn-tactile flex flex-col items-center justify-center gap-0.5 sm:gap-1 border-2 border-amber-500";
      } else {
        btn.className = "kid-cat-btn h-[92px] sm:h-auto px-1 py-1.5 sm:p-3.5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-[11px] leading-tight sm:text-sm shadow-kids-card btn-tactile flex flex-col items-center justify-center gap-0.5 sm:gap-1 border-2 border-slate-200 dark:border-slate-700";
      }
    });

    renderKidFlashcard();
    generateKidQuizRound();
    setKidViewTab(kidViewTab || 'practice');
    renderKidProgressSummary();
    syncKidTopicButton();
    // Two-state kid bar (phones): language subjects show the
    // sub-modes + a view toggle; other subjects show Practice /
    // Topics / Flashcards.
    if (isLangPackCategory(cat)) {
      document.body.classList.add('kid-bar-modes');
      document.body.classList.remove('kid-bar-views');
    } else {
      document.body.classList.add('kid-bar-views');
      document.body.classList.remove('kid-bar-modes');
    }
    if (typeof window.refreshStudentXPBadges === 'function') {
      window.refreshStudentXPBadges();
    }
    applyKidCourseVisibility();
  }

  // Topic switcher (Explorer, phones): like the profile switcher —
  // the bottom bar's Topics button shows the current topic, and
  // this overlay lists every subject for a one-tap switch.
  function renderTopicPicker() {
    const grid = document.getElementById('topicPickerGrid');
    if (!grid) return;
    const current = window.appData && window.appData.kidCategory;
    grid.innerHTML = ALL_KID_CATEGORIES.filter(c => kidCourseOn(c.key)).map(c => {
      const active = c.key === current;
      return `<button onclick="selectKidCategory('${c.key}'); closeTopicPicker();" class="p-4 rounded-3xl border-2 ${active ? 'border-amber-500 bg-amber-400 text-slate-950 shadow-kids-btn' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-amber-50 dark:hover:bg-slate-700'} btn-tactile transition flex flex-col items-center gap-1.5">
        <span class="text-4xl">${c.emoji}</span>
        <span class="font-extrabold text-sm font-kids">${c.name}</span>
      </button>`;
    }).join('');
  }
  function openTopicPicker() {
    renderTopicPicker();
    const overlay = document.getElementById('topicPickerOverlay');
    if (overlay) overlay.classList.remove('hidden');
  }
  function closeTopicPicker() {
    const overlay = document.getElementById('topicPickerOverlay');
    if (overlay) overlay.classList.add('hidden');
  }
  function syncKidTopicButton() {
    const cat = window.appData && window.appData.kidCategory;
    const entry = ALL_KID_CATEGORIES.find(c => c.key === cat) || ALL_KID_CATEGORIES[0];
    const ico = document.getElementById('kidTopicBtnIco');
    const label = document.getElementById('kidTopicBtnLabel');
    if (ico) ico.textContent = entry.emoji;
    if (label) label.textContent = entry.name;
  }
  window.openTopicPicker = openTopicPicker;
  window.closeTopicPicker = closeTopicPicker;

  function stripTranslit(s) {
    return String(s || '').replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  }
  function extractTranslit(s) {
    const m = String(s || '').match(/\(([^)]*)\)/g);
    return m ? m.map(x => x.slice(1, -1)).join(' / ') : '';
  }

  function getActiveKidItemList() {
    const cat = window.appData.kidCategory;
    const pack = window.multiLangData[cat];
    if (cat === 'spelling' && typeof window.getAllSpellingItems === 'function') {
      const allSpelling = window.getAllSpellingItems();
      const lenFilter = window.spellingLengthFilter || 'all';
      const filtered = allSpelling.filter(item => {
        const w = String(item.word || item.primary || '').split('•')[0].replace(/[^A-Za-z]/g, '').toUpperCase();
        if (lenFilter === 'all') return true;
        if (lenFilter === 'big') return w.length >= 7;
        return w.length === Number(lenFilter);
      });
      const list = filtered.length > 0 ? filtered : allSpelling;
      return list.map(item => ({
        ...item,
        nativeOnly: item.primary,
        pronounce: item.speech || item.primary,
        englishMeaning: item.meaning
      }));
    }
    if (cat === 'numbers') {
      ensureMathItemsInNumbersPack();
      const allMath = pack.kidItems || [];
      const filtered = (mathOpFilter && mathOpFilter !== 'all')
        ? allMath.filter(item => item.mathOp === mathOpFilter)
        : allMath;
      const list = filtered.length > 0 ? filtered : allMath;
      return list.map(item => ({
        ...item,
        nativeOnly: item.primary,
        pronounce: item.speech || item.primary,
        englishMeaning: item.meaning
      }));
    }
    if (kidSubMode === 'letters' && pack.letters && pack.letters.length > 0) {
      return pack.letters.map(item => ({
        emoji: item.emoji || '🔤',
        primary: `${item.char}  •  ${item.translit}`,
        nativeOnly: item.char,
        pronounce: `${item.translit} — ${stripTranslit(item.word)} (${extractTranslit(item.word) || item.translit})`,
        nativeWord: item.word,
        englishMeaning: item.wordMeaning,
        meaning: `${item.word} • ${item.wordMeaning}`,
        speech: item.speech || `${item.char}. ${item.word}.`,
        rawChar: item.char
      }));
    }
    if (kidSubMode === 'sentences' && pack.sentences && pack.sentences.length > 0) {
      return pack.sentences.map(item => ({
        emoji: '💬',
        primary: item.script,
        nativeOnly: item.script,
        pronounce: item.translit || '',
        translit: item.translit || '',
        englishMeaning: item.meaning,
        meaning: `${item.translit}\n${item.meaning}`,
        speech: item.speech || item.script
      }));
    }
    return (pack.kidItems || []).map(item => ({
      ...item,
      nativeOnly: stripTranslit(item.primary) || item.primary,
      pronounce: extractTranslit(item.primary) || item.speech || '',
      englishMeaning: item.meaning
    }));
  }

  function renderKidFlashcard() {
    const pack = window.multiLangData && window.multiLangData[window.appData.kidCategory];
    const items = getActiveKidItemList();
    if (!items || items.length === 0) {
      const emojiEl = document.getElementById('kidCardEmoji');
      if (emojiEl) emojiEl.innerText = '🌱';
      const primEl = document.getElementById('kidCardPrimaryText');
      if (primEl) primEl.innerText = 'Deck Ready';
      const meanEl = document.getElementById('kidCardMeaningText');
      if (meanEl) meanEl.innerText = 'Select a category above to start exploring flashcards!';
      const progEl = document.getElementById('kidCardProgressText');
      if (progEl) progEl.innerText = '0 of 0';
      return;
    }
    const item = items[kidCardIdx % items.length] || items[0];
    if (!item) return;

    const badgeEl = document.getElementById('kidLeftBadgeText');
    if (badgeEl && pack) {
      if (kidSubMode === 'letters') {
        badgeEl.innerText = `🔤 ${pack.label} Letter Sound (Tap to Hear!)`;
      } else if (kidSubMode === 'sentences') {
        badgeEl.innerText = `💬 ${pack.label} Sentence (Tap to Hear!)`;
      } else {
        badgeEl.innerText = pack.cloudDomain ? `📚 ${pack.label} Study Card (Tap to Hear!)` : '🔊 Tap Picture to Hear!';
      }
    }
    const progTextEl = document.getElementById('kidCardProgressText');
    if (progTextEl) progTextEl.innerText = `Card ${(kidCardIdx % items.length) + 1} of ${items.length}`;
    const emojiEl = document.getElementById('kidCardEmoji');
    if (emojiEl) emojiEl.innerText = item.emoji || '🌟';
    const primTextEl = document.getElementById('kidCardPrimaryText');
    if (primTextEl) primTextEl.innerText = item.primary || '';
    const meanTextEl = document.getElementById('kidCardMeaningText');
    if (meanTextEl) meanTextEl.innerText = item.meaning || '';
  }

  function stepKidCard(delta) {
    const pack = window.multiLangData && window.multiLangData[window.appData.kidCategory];
    const items = getActiveKidItemList();
    if (!items || items.length === 0) return;
    kidCardIdx = (kidCardIdx + delta + items.length) % items.length;
    if (window.LuminaDB && typeof window.LuminaDB.recordActivity === 'function' && items[kidCardIdx]) {
      window.LuminaDB.recordActivity({
        type: 'flashcard',
        isQuestion: false,
        domain: (pack && pack.label) || 'Learning',
        title: items[kidCardIdx].primary,
        xp: 3,
        durationSec: 4
      });
    }
    renderKidFlashcard();
    speakKidCurrentCard();
    renderKidProgressSummary();
  }

  function speakKidCurrentCard() {
    const pack = window.multiLangData && window.multiLangData[window.appData.kidCategory];
    const items = getActiveKidItemList();
    if (!items || items.length === 0) return;
    const item = items[kidCardIdx % items.length] || items[0];
    if (!item) return;
    if (typeof window.speakNativeAudio === 'function') {
      window.speakNativeAudio(item.speech || item.primary, (pack && pack.langCode) || 'en-US');
    }
  }

  function revealKidQuizHint() {
    kidHintRevealed = true;
    const hintBtn = document.getElementById('kidQuizHintBtn');
    if (hintBtn) hintBtn.classList.add('hidden');
    const subHint = document.getElementById('kidQuizSubHint');
    if (subHint && currentKidClueText) {
      subHint.classList.remove('hidden');
      const isLangPack = isLangPackCategory(window.appData.kidCategory);
      const badgePrefix = isLangPack ? '💡 Say it:' : '💡 Hint:';
      subHint.innerHTML = `<span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-100 text-amber-950 border border-amber-300 font-extrabold text-xs sm:text-sm animate-fade">${badgePrefix} ${escapeHtml(currentKidClueText)}</span>`;
    }
    if (typeof window.speakNativeAudio === 'function' && currentKidClueText) {
      const isLangPack = isLangPackCategory(window.appData.kidCategory);
      if (isLangPack && currentKidQuizAnswer) {
        const pack = window.multiLangData[window.appData.kidCategory];
        window.speakNativeAudio(currentKidQuizAnswer.speech || currentKidQuizAnswer.primary, pack.langCode);
      } else {
        window.speakNativeAudio(`Hint: ${currentKidClueText}`, 'en-US');
      }
    }
  }

  function resetCurrentKidCategoryQuestions() {
    const p = (window.LuminaDB && typeof window.LuminaDB.getActiveProfile === 'function')
      ? window.LuminaDB.getActiveProfile()
      : ((typeof window.activeProfile === 'function') ? window.activeProfile() : null);
    const cat = window.appData.kidCategory;
    const pack = window.multiLangData && window.multiLangData[cat];
    const domain = (pack && pack.cloudDomain) || cat;
    if (p && window.LuminaDB && typeof window.LuminaDB.resetCompletedQuestions === 'function') {
      window.LuminaDB.resetCompletedQuestions(p.id, domain);
    }
    if (typeof window.showToast === 'function') window.showToast("Questions reset for this topic! Ready to play.");
    generateKidQuizRound();
  }

  /* ================= LANGUAGE SPELLING BEE (kid tile builder) ==========
     A "build the word" round for the five language packs: hear the word,
     tap grapheme tiles into the slots. Malayalam/Hindi words are split
     into grapheme clusters (window.splitGraphemes) so vowel signs and
     conjuncts stay whole. Like the English kid bee, only a completed word
     earns XP — wrong builds just shake, so it can't be farmed. */
  let kidLangSpell = null;

  function syncKidPracticePanels(spellingOn) {
    const panel = document.getElementById('kidLangSpellPanel');
    if (panel) panel.classList.toggle('hidden', !spellingOn);
    ['kidQuizPassageBox', 'kidQuizPromptBox', 'kidQuizOptionsGrid'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', spellingOn);
    });
    if (spellingOn) {
      const toast = document.getElementById('kidQuizFeedbackToast');
      if (toast) toast.classList.add('hidden');
      const badge = document.getElementById('kidQuizHeaderBadge');
      if (badge) badge.innerText = '🐝 Language Spelling Bee!';
    }
  }

  function kidLangSpellPool() {
    const pack = window.multiLangData && window.multiLangData[window.appData.kidCategory];
    if (!pack) return { pack: null, pool: [] };
    return { pack: pack, pool: window.getLangSpellPool(pack.kidItems) };
  }

  function startKidLangSpellRound() {
    const cat = window.appData.kidCategory;
    const { pack, pool } = kidLangSpellPool();
    syncKidPracticePanels(true);
    if (!pack || pool.length === 0) return;
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (kidLangSpell && pool.length > 1) {
      let guard = 0;
      while (pick.target === kidLangSpell.target && guard < 6) {
        pick = pool[Math.floor(Math.random() * pool.length)];
        guard++;
      }
    }
    // Tiles: the word's graphemes plus up to 3 distractors from other
    // words in the same pack (same script), all shuffled.
    const tiles = pick.graphemes.map((ch, i) => ({ id: 'need' + i, char: ch, used: false }));
    const others = pool.filter(p => p.target !== pick.target);
    const distractorChars = [];
    let guard2 = 0;
    while (distractorChars.length < 3 && others.length > 0 && guard2 < 24) {
      const w = others[Math.floor(Math.random() * others.length)];
      const ch = w.graphemes[Math.floor(Math.random() * w.graphemes.length)];
      if (!pick.graphemes.includes(ch) && !distractorChars.includes(ch)) distractorChars.push(ch);
      guard2++;
    }
    distractorChars.forEach((ch, i) => tiles.push({ id: 'dist' + i, char: ch, used: false }));
    tiles.sort(() => Math.random() - 0.5);
    kidLangSpell = {
      cat: cat, item: pick.item, target: pick.target, graphemes: pick.graphemes,
      slots: new Array(pick.graphemes.length).fill(null), tiles: tiles,
      done: false, hintUsed: false
    };
    const emojiEl = document.getElementById('kidLangSpellEmoji');
    if (emojiEl) emojiEl.innerText = pick.item.emoji || '🐝';
    const meaningEl = document.getElementById('kidLangSpellMeaning');
    if (meaningEl) meaningEl.innerText = pick.item.meaning || '';
    const hintEl = document.getElementById('kidLangSpellHint');
    if (hintEl) { hintEl.innerText = ''; hintEl.classList.add('hidden'); }
    const hintBtn = document.getElementById('kidLangSpellHintBtn');
    if (hintBtn) hintBtn.classList.add('hidden');
    const xpBadge = document.getElementById('kidLangSpellXpBadge');
    if (xpBadge) xpBadge.innerText = `+${window.getSectionXP ? window.getSectionXP(cat, 'spelling') : 30} XP`;
    const fb = document.getElementById('kidLangSpellFeedback');
    if (fb) fb.classList.add('hidden');
    renderKidLangSpellBoard();
    kidLangSpellSpeak();
  }
  window.startKidLangSpellRound = startKidLangSpellRound;

  function renderKidLangSpellBoard() {
    if (!kidLangSpell) return;
    const slotsRow = document.getElementById('kidLangSpellSlots');
    if (slotsRow) {
      slotsRow.innerHTML = kidLangSpell.slots.map((slot, i) => slot
        ? `<button onclick="kidLangSpellTapSlot(${i})" class="w-11 h-14 sm:w-14 sm:h-16 rounded-2xl bg-amber-400 border-b-4 border-amber-600 text-slate-950 text-xl sm:text-2xl font-black flex items-center justify-center shadow-kids-btn btn-tactile animate-pop-in" title="Tap to remove">${escapeHtml(slot.char)}</button>`
        : `<div class="w-11 h-14 sm:w-14 sm:h-16 rounded-2xl bg-sky-100/70 dark:bg-slate-800 border-2 border-dashed border-sky-300 dark:border-slate-600 flex items-center justify-center text-sky-300 dark:text-slate-600 font-black text-xl">?</div>`
      ).join('');
    }
    const tilesRow = document.getElementById('kidLangSpellTiles');
    if (tilesRow) {
      tilesRow.innerHTML = kidLangSpell.tiles.map((tile, i) => tile.used
        ? `<div class="w-11 h-14 sm:w-14 sm:h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border-2 border-slate-200/70 dark:border-slate-700/60 opacity-40"></div>`
        : `<button onclick="kidLangSpellTapTile(${i})" class="w-11 h-14 sm:w-14 sm:h-16 rounded-2xl bg-white dark:bg-slate-800 border-b-4 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50 text-xl sm:text-2xl font-black flex items-center justify-center shadow-kids-btn btn-tactile hover:-translate-y-0.5 transition">${escapeHtml(tile.char)}</button>`
      ).join('');
    }
  }

  function kidLangSpellSpeak() {
    if (!kidLangSpell) return Promise.resolve();
    const pack = window.multiLangData && window.multiLangData[window.appData.kidCategory];
    const text = kidLangSpell.item.speech || kidLangSpell.target;
    if (typeof speakNativeAudio === 'function') {
      return speakNativeAudio(text, pack ? pack.langCode : undefined, 0.8) || Promise.resolve();
    }
    return Promise.resolve();
  }
  window.kidLangSpellSpeak = kidLangSpellSpeak;

  function kidLangSpellShowHint() {
    if (!kidLangSpell) return;
    kidLangSpell.hintUsed = true;
    const hintEl = document.getElementById('kidLangSpellHint');
    if (!hintEl) return;
    const translit = window.langTransliteration ? window.langTransliteration(kidLangSpell.item) : '';
    hintEl.innerText = translit
      ? `💡 Say it: ${translit} — ${kidLangSpell.graphemes.length} letters`
      : `💡 It starts with "${kidLangSpell.graphemes[0]}" — ${kidLangSpell.graphemes.length} letters`;
    hintEl.classList.remove('hidden');
  }
  window.kidLangSpellShowHint = kidLangSpellShowHint;

  function kidLangSpellTapTile(tileIdx) {
    if (!kidLangSpell || kidLangSpell.done) return;
    const tile = kidLangSpell.tiles[tileIdx];
    if (!tile || tile.used) return;
    const emptyIdx = kidLangSpell.slots.findIndex(s => s === null);
    if (emptyIdx === -1) return;
    kidLangSpell.slots[emptyIdx] = tile;
    tile.used = true;
    renderKidLangSpellBoard();
    if (kidLangSpell.slots.every(s => s !== null)) checkKidLangSpelling();
  }
  window.kidLangSpellTapTile = kidLangSpellTapTile;

  function kidLangSpellTapSlot(slotIdx) {
    if (!kidLangSpell || kidLangSpell.done) return;
    const slot = kidLangSpell.slots[slotIdx];
    if (!slot) return;
    const tile = kidLangSpell.tiles.find(t => t.id === slot.id);
    if (tile) tile.used = false;
    kidLangSpell.slots[slotIdx] = null;
    const fb = document.getElementById('kidLangSpellFeedback');
    if (fb) fb.classList.add('hidden');
    renderKidLangSpellBoard();
  }
  window.kidLangSpellTapSlot = kidLangSpellTapSlot;

  async function checkKidLangSpelling() {
    if (!kidLangSpell || kidLangSpell.done) return;
    const built = kidLangSpell.slots.map(s => s.char).join('');
    const pack = window.multiLangData[window.appData.kidCategory];
    const fb = document.getElementById('kidLangSpellFeedback');
    if (built === kidLangSpell.target) {
      kidLangSpell.done = true;
      const cat = window.appData.kidCategory;
      const xp = window.getSectionXP ? window.getSectionXP(cat, 'spelling') : 30;
      if (window.LuminaDB && typeof window.LuminaDB.recordActivity === 'function') {
        window.LuminaDB.recordActivity({
          type: 'language_spelling', isQuestion: true,
          domain: (pack ? pack.label : cat) + ' Spelling Bee',
          title: 'Spell: ' + kidLangSpell.target,
          questionId: 'kid_spell_' + cat + '_' + kidLangSpell.target,
          xp: xp, durationSec: 10, isCorrect: true, maxScore: 1, score: 1
        });
      }
      if (typeof window.refreshHeaderUI === 'function') window.refreshHeaderUI();
      if (typeof window.triggerConfetti === 'function') window.triggerConfetti();
      if (fb) {
        fb.innerText = `🎉 Awesome! "${kidLangSpell.target}" is correct! +${xp} XP`;
        fb.className = "mt-5 p-4 rounded-2xl text-center text-base sm:text-lg font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-2 border-emerald-300 dark:border-emerald-800 animate-pop-in";
        fb.classList.remove('hidden');
      }
      const speechPromise = kidLangSpellSpeak();
      const minPause = new Promise(resolve => setTimeout(resolve, 1700));
      const finishedTarget = kidLangSpell.target;
      await Promise.all([speechPromise, minPause]);
      // Advance only if this same completed round is still on screen.
      if (kidSubMode === 'spelling' && kidLangSpell && kidLangSpell.done && kidLangSpell.target === finishedTarget) {
        startKidLangSpellRound();
      }
    } else {
      if (fb) {
        fb.innerText = `🌱 Almost! That spells "${built}". Tap a letter to fix it!`;
        fb.className = "mt-5 p-4 rounded-2xl text-center text-base sm:text-lg font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-2 border-rose-200 dark:border-rose-900 animate-shake";
        fb.classList.remove('hidden');
      }
      const hintBtn = document.getElementById('kidLangSpellHintBtn');
      if (hintBtn) hintBtn.classList.remove('hidden');
    }
  }

  function generateKidQuizRound() {
    if (kidSubMode === 'spelling' && isLangPackCategory(window.appData.kidCategory)) {
      // Re-entrant renders (category/tab renders, async question-load
      // completions) must not re-roll a round already in progress.
      if (kidLangSpell && !kidLangSpell.done && kidLangSpell.cat === window.appData.kidCategory) {
        syncKidPracticePanels(true);
      } else {
        startKidLangSpellRound();
      }
      return;
    }
    syncKidPracticePanels(false);
    hasFailedFirstAttempt = false;
    kidHintRevealed = false;
    currentKidClueText = '';

    const pack = window.multiLangData[window.appData.kidCategory];
    // Question bank loads per-domain on demand: fetch this category's
    // questions first if they are not in memory yet, then generate the round.
    if (pack && pack.cloudDomain && window.QuestionLoader && !window.QuestionLoader.isReady(pack.cloudDomain) && !generateKidQuizRound._loadingDomain) {
      generateKidQuizRound._loadingDomain = true;
      window.QuestionLoader.ensureDomain(pack.cloudDomain).then(function () {
        generateKidQuizRound._loadingDomain = false;
        generateKidQuizRound();
      });
      return;
    }
    const passageBox = document.getElementById('kidQuizPassageBox');
    const promptBox = document.getElementById('kidQuizPromptBox');
    const builderZone = document.getElementById('spellingBuilderZone');
    const spellingToggle = document.getElementById('spellingModeToggle');
    const headerBadge = document.getElementById('kidQuizHeaderBadge');
    const topPrompt = document.getElementById('kidQuizTopPrompt');
    const subHint = document.getElementById('kidQuizSubHint');
    const grid = document.getElementById('kidQuizOptionsGrid');
    const feedbackToast = document.getElementById('kidQuizFeedbackToast');
    const hintBtn = document.getElementById('kidQuizHintBtn');

    if (feedbackToast) feedbackToast.classList.add('hidden');
    if (hintBtn) hintBtn.classList.add('hidden');
    if (subHint) {
      subHint.innerText = '';
      subHint.classList.add('hidden');
    }

    // Ensure Math Operation filter bar and Spelling Length filter bar are updated
    ensureMathOpBar();
    if (typeof window.ensureSpellingLevelBar === 'function') {
      window.ensureSpellingLevelBar();
    }

    // 1. Check if category is 6+ Spelling Bee
    if (window.appData.kidCategory === 'spelling') {
      if (spellingToggle) spellingToggle.classList.remove('hidden');
      if (window.spellingSubMode === 'tiles') {
        if (passageBox) passageBox.classList.add('hidden');
        if (promptBox) promptBox.classList.add('hidden');
        if (grid) grid.classList.add('hidden');
        if (builderZone) builderZone.classList.remove('hidden');
        if (typeof window.generateSpellingTileRound === 'function') {
          window.generateSpellingTileRound();
        }
        return;
      } else {
        // 4-choice quiz mode
        if (builderZone) builderZone.classList.add('hidden');
        if (promptBox) promptBox.classList.remove('hidden');
        if (grid) grid.classList.remove('hidden');
      }
    } else {
      if (spellingToggle) spellingToggle.classList.add('hidden');
      if (builderZone) builderZone.classList.add('hidden');
      if (promptBox) promptBox.classList.remove('hidden');
      if (grid) grid.classList.remove('hidden');
    }

    const p = (window.LuminaDB && typeof window.LuminaDB.getActiveProfile === 'function')
      ? window.LuminaDB.getActiveProfile()
      : ((typeof window.activeProfile === 'function') ? window.activeProfile() : null);
    const completed = new Set((p && p.completedQuestionIds) || []);

    // Check if this category has structured 4-choice questions in Cloud Firestore
    const cloudQs = (pack.cloudDomain && typeof window.getKidQuestionsByDomain === 'function')
      ? window.getKidQuestionsByDomain(pack.cloudDomain, false)
      : [];
    const allDomainQs = (pack.cloudDomain && typeof window.getKidQuestionsByDomain === 'function')
      ? window.getKidQuestionsByDomain(pack.cloudDomain, true)
      : [];

    if (cloudQs.length === 0 && allDomainQs.length > 0) {
      if (passageBox) passageBox.classList.add('hidden');
      if (promptBox) promptBox.classList.remove('hidden');
      const targetLabel = document.getElementById('kidQuizTargetLabel');
      if (targetLabel) {
        targetLabel.className = "text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 mt-2";
        targetLabel.innerHTML = `🏆 Star Explorer! You completed all ${allDomainQs.length} questions in ${escapeHtml(pack.label)}!`;
      }
      if (topPrompt) topPrompt.innerText = 'Track Completed:';
      if (subHint) {
        subHint.classList.remove('hidden');
        subHint.innerText = 'All questions in this track are completed!';
      }
      if (grid) {
        grid.classList.remove('hidden');
        grid.className = "flex justify-center mt-4";
        grid.innerHTML = `
          <div class="p-4 sm:p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 text-center space-y-1 shadow-sm max-w-md w-full">
            <div class="text-3xl">🌟</div>
            <p class="font-extrabold text-sm sm:text-base">Fantastic job! You completed all questions in this track!</p>
            <p class="text-xs font-semibold text-emerald-800">Parents and admins can add new questions or reset this track in the Parent Portal.</p>
          </div>
        `;
      }
      return;
    }

    if (cloudQs.length > 0) {
      currentKidQuizAnswer = null;
      // Zero-repeat non-repeating queue from deck!
      const qItem = (typeof window.getNextFromDeck === 'function')
        ? window.getNextFromDeck('kid_cloud_' + (p ? p.id : 'default') + '_' + window.appData.kidCategory, cloudQs, q => q.id)
        : cloudQs[Math.floor(Math.random() * cloudQs.length)];

      currentKidCloudQuestion = qItem;
      const qObj = qItem.question || {};

      if (headerBadge) {
        headerBadge.innerText = `${pack.label} • Question Challenge (${cloudQs.length} left)`;
      }
      if (qObj.paragraph && qObj.paragraph !== 'null') {
        passageBox.classList.remove('hidden');
        passageBox.innerHTML = `
          <div class="flex items-center gap-2 mb-2 pb-1 border-b border-amber-200/60 text-xs font-bold text-amber-900 select-none">
            <span>💡</span>
            <span>Tap any word to see its meaning &amp; hear it spoken!</span>
          </div>
          <div>${typeof window.renderInteractiveText === 'function' ? window.renderInteractiveText(qObj.paragraph) : escapeHtml(qObj.paragraph)}</div>
        `;
      } else {
        passageBox.classList.add('hidden');
        passageBox.innerText = '';
      }

      if (topPrompt) topPrompt.innerText = 'Read or Listen & Pick the Best Answer:';
      const targetLabel = document.getElementById('kidQuizTargetLabel');
      targetLabel.className = "text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-50 mt-1 leading-snug";
      targetLabel.innerHTML = (typeof window.renderInteractiveText === 'function')
        ? window.renderInteractiveText(qObj.question || '')
        : escapeHtml(qObj.question || '');

      // Store clue for conditional hint on first fail
      currentKidClueText = qObj.explanation || (qObj.choices && qObj.choices[qObj.correct_answer] ? `Focus on: ${qObj.choices[qObj.correct_answer]}` : 'Think carefully about the details!');

      const choices = qObj.choices || {};
      grid.className = "grid grid-cols-1 sm:grid-cols-2 gap-3.5";
      grid.innerHTML = ['A', 'B', 'C', 'D'].filter(k => choices[k]).map(letter => `
        <button id="kid-cloud-opt-${letter}" onclick="checkKidCloudQuizAnswer('${letter}')" class="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 border-4 border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 shadow-kids-card btn-tactile flex items-center gap-3.5 text-left transition">
          <span class="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-300 font-extrabold text-lg flex items-center justify-center shrink-0 border-2 border-sky-200 dark:border-sky-800">${letter}</span>
          <span class="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug">${escapeHtml(choices[letter])}</span>
        </button>
      `).join('');
      return;
    }

    // Otherwise: Interactive Picture / Letter / Sentence Match Game (Zero-Repeat Target Deck)
    currentKidCloudQuestion = null;
    passageBox.classList.add('hidden');
    if (headerBadge) {
      headerBadge.innerText = kidSubMode === 'letters' ? '🔤 Letter Sound Match!' : (kidSubMode === 'sentences' ? '💬 Sentence Match Game!' : '🎮 Find the Match Game!');
    }
    if (topPrompt) topPrompt.innerText = 'Can you tap:';
    const targetLabel = document.getElementById('kidQuizTargetLabel');
    targetLabel.className = "text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-50 mt-1";

    const items = getActiveKidItemList();
    const uncompletedItems = items.filter(i => !completed.has('kid_match_' + window.appData.kidCategory + '_' + kidSubMode + '_' + i.primary));

    if (uncompletedItems.length === 0 && items.length > 0) {
      if (passageBox) passageBox.classList.add('hidden');
      if (promptBox) promptBox.classList.remove('hidden');
      targetLabel.className = "text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 mt-2";
      targetLabel.innerHTML = `🌟 Super Matcher! You've matched every item in ${escapeHtml(pack.label)}!`;
      if (topPrompt) topPrompt.innerText = 'Track Completed:';
      if (subHint) {
        subHint.classList.remove('hidden');
        subHint.innerText = 'All items in this matching track are completed!';
      }
      if (grid) {
        grid.classList.remove('hidden');
        grid.className = "flex justify-center mt-4";
        grid.innerHTML = `
          <div class="p-4 sm:p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-center space-y-1 shadow-sm max-w-md w-full">
            <div class="text-3xl">🏆</div>
            <p class="font-extrabold text-sm sm:text-base">Super Explorer! You matched every item in this deck!</p>
            <p class="text-xs font-semibold text-amber-800">Parents and admins can reset this track or add more items in the Parent Portal.</p>
          </div>
        `;
      }
      return;
    }

    const targetPool = uncompletedItems.length > 0 ? uncompletedItems : items;
    if (!targetPool || targetPool.length === 0) {
      if (grid) {
        grid.className = "flex justify-center mt-4";
        grid.innerHTML = `<div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-bold text-center">Ready to play! Select a category above to start.</div>`;
      }
      return;
    }
    // Zero-repeat target selection from uncompleted pool!
    const target = (typeof window.getNextFromDeck === 'function')
      ? window.getNextFromDeck('kid_target_' + (p ? p.id : 'default') + '_' + window.appData.kidCategory + '_' + kidSubMode, targetPool, i => i.primary)
      : targetPool[Math.floor(Math.random() * targetPool.length)];

    if (!target) return;

    currentKidQuizAnswer = target;
    const isLangPack = isLangPackCategory(window.appData.kidCategory);
    // Language packs: show ONLY the native script in the question (no English / transliteration next to it)
    targetLabel.innerText = isLangPack ? (target.nativeOnly || target.primary) : target.primary;
    // Stash clue for conditional hint (NOT shown upfront!)
    if (isLangPack) {
      currentKidClueText = target.pronounce || '';
    } else {
      currentKidClueText = target.meaning ? target.meaning.split('\n')[0] : '';
    }

    // Guarantee 4 unique, non-overlapping choices without accidental repeats
    let pool = [target];
    const otherItems = items.filter(i => i.primary !== target.primary).sort(() => Math.random() - 0.5);
    for (const candidate of otherItems) {
      if (pool.length >= Math.min(4, items.length)) break;
      if (!pool.some(p => p.primary === candidate.primary)) {
        pool.push(candidate);
      }
    }
    pool.sort(() => Math.random() - 0.5);

    grid.className = "grid grid-cols-1 sm:grid-cols-2 gap-3.5";
    grid.innerHTML = pool.map((opt, idx) => {
      let labelHtml = '';
      let emojiClass = 'text-5xl sm:text-6xl';
      if (isLangPack) {
        // Options keep the English meaning (picture + English word/sentence)
        const en = opt.englishMeaning || (opt.meaning ? opt.meaning.split('\n')[0] : '');
        const sizeCls = kidSubMode === 'sentences' ? 'text-sm sm:text-base' : 'text-base';
        labelHtml = `<span class="${sizeCls} font-bold text-slate-800 dark:text-slate-100 text-center leading-snug">${escapeHtml(en)}</span>`;
      } else {
        labelHtml = `<span class="text-base font-bold text-slate-800 dark:text-slate-100 text-center leading-snug">${escapeHtml(opt.meaning.split('\n')[0])}</span>`;
      }

      return `
        <button onclick="checkKidQuizSelection(${idx})" data-primary="${escapeHtml(opt.primary)}" class="kid-pic-opt p-5 rounded-3xl bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 border-4 border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 shadow-kids-card btn-tactile flex flex-col items-center justify-center gap-2 transition">
          <span class="${emojiClass}">${opt.emoji}</span>
          ${labelHtml}
        </button>
      `;
    }).join('');
    window._currentKidPool = pool;
  }

  function speakKidQuizPrompt() {
    if (window.appData.kidCategory === 'spelling' && window.spellingSubMode === 'tiles') {
      if (typeof window.speakSpellingTargetWord === 'function') window.speakSpellingTargetWord();
      return;
    }
    const pack = window.multiLangData[window.appData.kidCategory];
    if (currentKidCloudQuestion && currentKidCloudQuestion.question) {
      const qObj = currentKidCloudQuestion.question;
      const p = (qObj.paragraph && qObj.paragraph !== 'null') ? (qObj.paragraph + '. ') : '';
      const c = qObj.choices || {};
      const optsText = ['A', 'B', 'C', 'D'].filter(k => c[k]).map(k => `Option ${k}: ${c[k]}`).join('. ');
      if (typeof window.speakNativeAudio === 'function') {
        window.speakNativeAudio(`${p}${qObj.question}. ${optsText}`, 'en-US');
      }
      return;
    }
    if (!currentKidQuizAnswer) return;
    if (typeof window.speakNativeAudio === 'function') {
      window.speakNativeAudio(currentKidQuizAnswer.speech || currentKidQuizAnswer.primary, pack.langCode);
    }
  }

  function checkKidCloudQuizAnswer(chosenLetter) {
    if (!currentKidCloudQuestion || !currentKidCloudQuestion.question) return;
    const cat = window.appData.kidCategory;
    const pack = window.multiLangData[cat];
    const qObj = currentKidCloudQuestion.question;
    const correctLetter = qObj.correct_answer;
    const isCorrect = (chosenLetter === correctLetter);
    const toast = document.getElementById('kidQuizFeedbackToast');
    toast.classList.remove('hidden');

    let effectiveTrack = cat;
    let effectiveSub = null;
    if (cat === 'numbers' && currentKidCloudQuestion.mathOp) {
      effectiveTrack = 'math';
      effectiveSub = currentKidCloudQuestion.mathOp;
    } else if (cat === 'malayalam' || cat === 'hindi' || cat === 'spanish' || cat === 'french' || cat === 'italian') {
      effectiveTrack = cat;
      effectiveSub = kidSubMode || 'words';
    }

    const baseXP = (typeof window.getSectionXP === 'function')
      ? window.getSectionXP(effectiveTrack, effectiveSub)
      : 20;
    const earnedXP = isCorrect ? baseXP : (window.wrongAnswerXP ? window.wrongAnswerXP(Math.max(3, Math.round(baseXP * 0.2))) : Math.max(3, Math.round(baseXP * 0.2)));

    const p = (window.LuminaDB && typeof window.LuminaDB.getActiveProfile === 'function')
      ? window.LuminaDB.getActiveProfile()
      : ((typeof window.activeProfile === 'function') ? window.activeProfile() : null);

    if (window.LuminaDB && typeof window.LuminaDB.recordActivity === 'function') {
      window.LuminaDB.recordActivity({
        type: 'kid_quiz',
        domain: pack ? pack.label : 'Kids Learning',
        title: qObj.question || currentKidCloudQuestion.id,
        isCorrect: isCorrect,
        xp: earnedXP,
        durationSec: 10,
        detail: `Answered ${chosenLetter} (${(qObj.choices && qObj.choices[chosenLetter]) || ''})`
      });
    }

    if (isCorrect) {
      if (p && window.LuminaDB && typeof window.LuminaDB.markQuestionCompleted === 'function') {
        window.LuminaDB.markQuestionCompleted(p.id, currentKidCloudQuestion.id);
      }
      const hintBtn = document.getElementById('kidQuizHintBtn');
      if (hintBtn) hintBtn.classList.add('hidden');

      const burstCount = baseXP >= 40 ? 110 : 75;
      if (typeof window.confetti === 'function') {
        window.confetti({ particleCount: burstCount, spread: 75, origin: { y: 0.6 } });
      }
      ['A', 'B', 'C', 'D'].forEach(letter => {
        const btn = document.getElementById(`kid-cloud-opt-${letter}`);
        if (!btn) return;
        if (letter === correctLetter) {
          btn.className = "p-4 sm:p-5 rounded-3xl bg-emerald-100 border-4 border-emerald-500 shadow-kids-card flex items-center gap-3.5 text-left transition";
        }
      });
      const bonusTag = baseXP >= 40 ? '🔥 SUPER STAR!' : '🌟 SUPER STAR!';
      toast.className = "mt-5 p-4 rounded-2xl text-left text-base sm:text-lg font-bold bg-emerald-100 text-emerald-950 border-2 border-emerald-400";
      toast.innerHTML = `<div class="flex items-center justify-between gap-2 mb-1"><span>${bonusTag} +${baseXP} XP!</span><button onclick="generateKidQuizRound()" class="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-sm font-bold">Next Question ➡️</button></div><p class="text-sm font-semibold text-emerald-900">${escapeHtml(qObj.explanation || '')}</p>`;
    } else {
      if (!hasFailedFirstAttempt) {
        hasFailedFirstAttempt = true;
        const hintBtn = document.getElementById('kidQuizHintBtn');
        if (hintBtn) hintBtn.classList.remove('hidden');
      }
      const chosenBtn = document.getElementById(`kid-cloud-opt-${chosenLetter}`);
      if (chosenBtn) {
        chosenBtn.className = "p-4 sm:p-5 rounded-3xl bg-rose-50 border-4 border-rose-300 opacity-60 shadow-xs flex items-center gap-3.5 text-left transition";
      }
      toast.className = "mt-5 p-4 rounded-2xl text-left text-base sm:text-lg font-bold bg-amber-100 text-amber-950 border-2 border-amber-400";
      toast.innerHTML = `<div>🤔 Good try! That's not quite right. Tap another option, or click <strong>💡 Show Hint</strong>!${earnedXP < 0 ? ` <span class="text-rose-700 font-black">${earnedXP} XP</span>` : ''}</div>`;
      if (typeof window.speakNativeAudio === 'function') {
        window.speakNativeAudio('Not quite, try another option or tap Show Hint!', 'en-US');
      }
    }
  }

  function checkKidQuizSelection(poolIdx) {
    const cat = window.appData.kidCategory;
    const pack = window.multiLangData[cat];
    const chosen = (window._currentKidPool && window._currentKidPool[poolIdx]) || null;
    const chosenPrimary = chosen ? chosen.primary : '';
    const isCorrect = (chosenPrimary === currentKidQuizAnswer.primary);
    const toast = document.getElementById('kidQuizFeedbackToast');
    toast.classList.remove('hidden');

    const baseXP = (typeof window.getSectionXP === 'function')
      ? window.getSectionXP(cat, kidSubMode)
      : 15;
    const earnedXP = isCorrect ? baseXP : (window.wrongAnswerXP ? window.wrongAnswerXP(Math.max(2, Math.round(baseXP * 0.2))) : Math.max(2, Math.round(baseXP * 0.2)));

    const p = (window.LuminaDB && typeof window.LuminaDB.getActiveProfile === 'function')
      ? window.LuminaDB.getActiveProfile()
      : ((typeof window.activeProfile === 'function') ? window.activeProfile() : null);

    if (window.LuminaDB && typeof window.LuminaDB.recordActivity === 'function') {
      window.LuminaDB.recordActivity({
        type: 'kid_quiz',
        domain: pack ? pack.label : 'Kids Learning',
        title: currentKidQuizAnswer.primary,
        isCorrect: isCorrect,
        xp: earnedXP,
        durationSec: 6,
        detail: currentKidQuizAnswer.meaning
      });
    }
    renderKidProgressSummary();

    if (isCorrect) {
      if (p && window.LuminaDB && typeof window.LuminaDB.markQuestionCompleted === 'function') {
        window.LuminaDB.markQuestionCompleted(p.id, 'kid_match_' + window.appData.kidCategory + '_' + kidSubMode + '_' + currentKidQuizAnswer.primary);
      }
      const hintBtn = document.getElementById('kidQuizHintBtn');
      if (hintBtn) hintBtn.classList.add('hidden');

      const burstCount = baseXP >= 40 ? 100 : 70;
      if (typeof window.confetti === 'function') {
        window.confetti({ particleCount: burstCount, spread: 70, origin: { y: 0.6 } });
      }
      const bonusTag = baseXP >= 40 ? '🔥 ' : '';
      toast.className = "mt-5 p-4 rounded-2xl text-center text-lg font-bold bg-emerald-100 text-emerald-900 border-2 border-emerald-400";
      toast.innerText = `🌟 YAY! You got it right! ${bonusTag}+${baseXP} Stars!`;
      setTimeout(generateKidQuizRound, 1600);
    } else {
      if (!hasFailedFirstAttempt) {
        hasFailedFirstAttempt = true;
        const hintBtn = document.getElementById('kidQuizHintBtn');
        if (hintBtn) hintBtn.classList.remove('hidden');
      }
      toast.className = "mt-5 p-4 rounded-2xl text-center text-lg font-bold bg-amber-100 text-amber-900 border-2 border-amber-400";
      toast.innerText = earnedXP < 0
        ? `🤔 Almost! ${earnedXP} XP — wrong taps cost points! Try another picture, or tap 💡 Show Hint!`
        : "🤔 Almost! Try tapping another picture, or tap 💡 Show Hint!";
      if (typeof window.speakNativeAudio === 'function') {
        window.speakNativeAudio('Not quite, try another picture or tap Show Hint!', 'en-US');
      }
    }
  }

  function renderKidProgressSummary() {
    const p = (typeof window.activeProfile === 'function') ? window.activeProfile() : null;
    if (!p) return;
    const el = document.getElementById('kidProgressSummaryGrid');
    if (!el || !window.multiLangData) return;
    el.innerHTML = ALL_KID_CATEGORIES.filter(c => kidCourseOn(c.key)).map(c => {
      const label = window.multiLangData[c.key]?.label || c.name;
      const m = (p.domainMastery && p.domainMastery[label]) || { attempted: 0, correct: 0, cardsViewed: 0 };
      return `
        <div onclick="selectKidCategory('${c.key}')" class="p-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/80 border-2 border-amber-200 text-center cursor-pointer transition">
          <div class="text-2xl mb-1">${c.emoji}</div>
          <div class="font-bold text-slate-900 text-xs">${c.name}</div>
          <div class="text-[11px] font-bold text-amber-800 mt-1">⭐ ${m.correct || 0} • 🃏 ${m.cardsViewed || 0}</div>
        </div>
      `;
    }).join('');
  }

  window.ALL_KID_CATEGORIES = ALL_KID_CATEGORIES;
  window.kidSubMode = kidSubMode;
  window.setKidSubMode = setKidSubMode;
  window.kidViewTab = kidViewTab;
  window.setKidViewTab = setKidViewTab;
  window.mathOpFilter = mathOpFilter;
  window.setMathOpFilter = setMathOpFilter;
  window.getGeneratedMathQuestions = getGeneratedMathQuestions;
  window.initKidPlayground = initKidPlayground;
  window.selectKidCategory = selectKidCategory;
  window.getActiveKidItemList = getActiveKidItemList;
  window.renderKidFlashcard = renderKidFlashcard;
  window.stepKidCard = stepKidCard;
  window.speakKidCurrentCard = speakKidCurrentCard;
  window.generateKidQuizRound = generateKidQuizRound;
  window.speakKidQuizPrompt = speakKidQuizPrompt;
  window.checkKidCloudQuizAnswer = checkKidCloudQuizAnswer;
  window.checkKidQuizSelection = checkKidQuizSelection;
  window.revealKidQuizHint = revealKidQuizHint;
  window.resetCurrentKidCategoryQuestions = resetCurrentKidCategoryQuestions;
  window.getCurrentKidQuizAnswer = function () { return currentKidQuizAnswer; };
  window.renderKidProgressSummary = renderKidProgressSummary;
})(window);
