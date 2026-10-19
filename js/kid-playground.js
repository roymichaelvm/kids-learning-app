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
    { key: 'malayalam', emoji: '🌴', name: 'Malayalam' },
    { key: 'hindi', emoji: '🪔', name: 'Hindi' },
    { key: 'spanish', emoji: '🇪🇸', name: 'Spanish' }
  ];

  // 100 Kid-Friendly Math Items across Addition (25), Subtraction (25), Multiplication (25), and Division (25)
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
    ['division', '💯', '50 ÷ 10 = 5', '50 Grouped by Tens = 5 Groups of 10!', 'Fifty divided by ten equals five!', 'What is 50 ÷ 10?', '5', '4', '6', '10', '10 × 5 = 50, so 50 ÷ 10 = 5!']
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

    const ops = [
      ['all', '🌟 All Math'],
      ['addition', '➕ Addition'],
      ['subtraction', '➖ Subtraction'],
      ['multiplication', '✖️ Multiplication'],
      ['division', '➗ Division']
    ];
    bar.innerHTML = ops.map(([key, label]) => {
      const count = getGeneratedMathQuestions(key).length;
      const active = key === mathOpFilter;
      const cls = active
        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50';
      return `<button id="math-op-${key}" onclick="setMathOpFilter('${key}')" class="px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition ${cls}">${label} <span class="opacity-60">(${count})</span></button>`;
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
    ['letters', 'words', 'sentences'].forEach(m => {
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
  }

  function initKidPlayground() {
    const startCat = (window.appData && window.appData.kidCategory && window.multiLangData && window.multiLangData[window.appData.kidCategory])
      ? window.appData.kidCategory
      : 'spelling';
    selectKidCategory(startCat);
    setKidViewTab(kidViewTab || 'practice');
    renderKidProgressSummary();
  }

  function selectKidCategory(cat) {
    if (!window.multiLangData || !window.multiLangData[cat]) cat = 'spelling';
    if (window.appData) window.appData.kidCategory = cat;
    kidCardIdx = 0;
    kidQuizIdx = 0;

    // Sub-mode pills for multilingual subjects
    const subBar = document.getElementById('kidLangSubNav');
    if (subBar) {
      if (cat === 'malayalam' || cat === 'hindi' || cat === 'spanish') {
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
        btn.className = "kid-cat-btn p-3.5 rounded-3xl bg-amber-400 text-slate-950 font-bold text-sm shadow-kids-btn btn-tactile flex flex-col items-center justify-center gap-1 border-2 border-amber-500";
      } else {
        btn.className = "kid-cat-btn p-3.5 rounded-3xl bg-white hover:bg-amber-50 text-slate-800 font-bold text-sm shadow-kids-card btn-tactile flex flex-col items-center justify-center gap-1 border-2 border-slate-200";
      }
    });

    renderKidFlashcard();
    generateKidQuizRound();
    setKidViewTab(kidViewTab || 'practice');
    renderKidProgressSummary();
  }

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
    const pack = window.multiLangData[window.appData.kidCategory];
    const items = getActiveKidItemList();
    const item = items[kidCardIdx % items.length];

    const badgeEl = document.getElementById('kidLeftBadgeText');
    if (badgeEl) {
      if (kidSubMode === 'letters') {
        badgeEl.innerText = `🔤 ${pack.label} Letter Sound (Tap to Hear!)`;
      } else if (kidSubMode === 'sentences') {
        badgeEl.innerText = `💬 ${pack.label} Sentence (Tap to Hear!)`;
      } else {
        badgeEl.innerText = pack.cloudDomain ? `📚 ${pack.label} Study Card (Tap to Hear!)` : '🔊 Tap Picture to Hear!';
      }
    }
    document.getElementById('kidCardProgressText').innerText = `Card ${(kidCardIdx % items.length) + 1} of ${items.length}`;
    document.getElementById('kidCardEmoji').innerText = item.emoji;
    document.getElementById('kidCardPrimaryText').innerText = item.primary;
    document.getElementById('kidCardMeaningText').innerText = item.meaning;
  }

  function stepKidCard(delta) {
    const pack = window.multiLangData[window.appData.kidCategory];
    const items = getActiveKidItemList();
    kidCardIdx = (kidCardIdx + delta + items.length) % items.length;
    if (window.LuminaDB && typeof window.LuminaDB.recordActivity === 'function') {
      window.LuminaDB.recordActivity({
        type: 'flashcard',
        isQuestion: false,
        domain: pack.label,
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
    const pack = window.multiLangData[window.appData.kidCategory];
    const items = getActiveKidItemList();
    const item = items[kidCardIdx % items.length];
    if (typeof window.speakNativeAudio === 'function') {
      window.speakNativeAudio(item.speech || item.primary, pack.langCode);
    }
  }

  function revealKidQuizHint() {
    kidHintRevealed = true;
    const hintBtn = document.getElementById('kidQuizHintBtn');
    if (hintBtn) hintBtn.classList.add('hidden');
    const subHint = document.getElementById('kidQuizSubHint');
    if (subHint && currentKidClueText) {
      subHint.classList.remove('hidden');
      const isLangPack = (window.appData.kidCategory === 'malayalam' || window.appData.kidCategory === 'hindi' || window.appData.kidCategory === 'spanish');
      const badgePrefix = isLangPack ? '💡 Say it:' : '💡 Hint:';
      subHint.innerHTML = `<span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-100 text-amber-950 border border-amber-300 font-extrabold text-xs sm:text-sm animate-fade">${badgePrefix} ${escapeHtml(currentKidClueText)}</span>`;
    }
    if (typeof window.speakNativeAudio === 'function' && currentKidClueText) {
      const isLangPack = (window.appData.kidCategory === 'malayalam' || window.appData.kidCategory === 'hindi' || window.appData.kidCategory === 'spanish');
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

  function generateKidQuizRound() {
    hasFailedFirstAttempt = false;
    kidHintRevealed = false;
    currentKidClueText = '';

    const pack = window.multiLangData[window.appData.kidCategory];
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
        targetLabel.className = "text-xl sm:text-2xl font-black text-slate-900 mt-2";
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
      targetLabel.className = "text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 leading-snug";
      targetLabel.innerHTML = (typeof window.renderInteractiveText === 'function')
        ? window.renderInteractiveText(qObj.question || '')
        : escapeHtml(qObj.question || '');

      // Store clue for conditional hint on first fail
      currentKidClueText = qObj.explanation || (qObj.choices && qObj.choices[qObj.correct_answer] ? `Focus on: ${qObj.choices[qObj.correct_answer]}` : 'Think carefully about the details!');

      const choices = qObj.choices || {};
      grid.className = "grid grid-cols-1 sm:grid-cols-2 gap-3.5";
      grid.innerHTML = ['A', 'B', 'C', 'D'].filter(k => choices[k]).map(letter => `
        <button id="kid-cloud-opt-${letter}" onclick="checkKidCloudQuizAnswer('${letter}')" class="p-4 sm:p-5 rounded-3xl bg-white hover:bg-sky-50 border-4 border-slate-200 hover:border-sky-400 shadow-kids-card btn-tactile flex items-center gap-3.5 text-left transition">
          <span class="w-10 h-10 rounded-2xl bg-sky-100 text-sky-900 font-extrabold text-lg flex items-center justify-center shrink-0 border-2 border-sky-200">${letter}</span>
          <span class="text-base sm:text-lg font-bold text-slate-800 leading-snug">${escapeHtml(choices[letter])}</span>
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
    targetLabel.className = "text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1";

    const items = getActiveKidItemList();
    const uncompletedItems = items.filter(i => !completed.has('kid_match_' + window.appData.kidCategory + '_' + kidSubMode + '_' + i.primary));

    if (uncompletedItems.length === 0 && items.length > 0) {
      if (passageBox) passageBox.classList.add('hidden');
      if (promptBox) promptBox.classList.remove('hidden');
      targetLabel.className = "text-xl sm:text-2xl font-black text-slate-900 mt-2";
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
    // Zero-repeat target selection from uncompleted pool!
    const target = (typeof window.getNextFromDeck === 'function')
      ? window.getNextFromDeck('kid_target_' + (p ? p.id : 'default') + '_' + window.appData.kidCategory + '_' + kidSubMode, targetPool, i => i.primary)
      : targetPool[Math.floor(Math.random() * targetPool.length)];

    currentKidQuizAnswer = target;
    const isLangPack = (window.appData.kidCategory === 'malayalam' || window.appData.kidCategory === 'hindi' || window.appData.kidCategory === 'spanish');
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
        labelHtml = `<span class="${sizeCls} font-bold text-slate-800 text-center leading-snug">${escapeHtml(en)}</span>`;
      } else {
        labelHtml = `<span class="text-base font-bold text-slate-800 text-center leading-snug">${escapeHtml(opt.meaning.split('\n')[0])}</span>`;
      }

      return `
        <button onclick="checkKidQuizSelection(${idx})" data-primary="${escapeHtml(opt.primary)}" class="kid-pic-opt p-5 rounded-3xl bg-white hover:bg-sky-50 border-4 border-slate-200 hover:border-sky-400 shadow-kids-card btn-tactile flex flex-col items-center justify-center gap-2 transition">
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
    const pack = window.multiLangData[window.appData.kidCategory];
    const qObj = currentKidCloudQuestion.question;
    const correctLetter = qObj.correct_answer;
    const isCorrect = (chosenLetter === correctLetter);
    const toast = document.getElementById('kidQuizFeedbackToast');
    toast.classList.remove('hidden');

    const p = (window.LuminaDB && typeof window.LuminaDB.getActiveProfile === 'function')
      ? window.LuminaDB.getActiveProfile()
      : ((typeof window.activeProfile === 'function') ? window.activeProfile() : null);

    if (window.LuminaDB && typeof window.LuminaDB.recordActivity === 'function') {
      window.LuminaDB.recordActivity({
        type: 'kid_quiz',
        domain: pack.label,
        title: qObj.question || currentKidCloudQuestion.id,
        isCorrect: isCorrect,
        xp: isCorrect ? 20 : 5,
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

      if (typeof window.confetti === 'function') {
        window.confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      }
      ['A', 'B', 'C', 'D'].forEach(letter => {
        const btn = document.getElementById(`kid-cloud-opt-${letter}`);
        if (!btn) return;
        if (letter === correctLetter) {
          btn.className = "p-4 sm:p-5 rounded-3xl bg-emerald-100 border-4 border-emerald-500 shadow-kids-card flex items-center gap-3.5 text-left transition";
        }
      });
      toast.className = "mt-5 p-4 rounded-2xl text-left text-base sm:text-lg font-bold bg-emerald-100 text-emerald-950 border-2 border-emerald-400";
      toast.innerHTML = `<div class="flex items-center justify-between gap-2 mb-1"><span>🌟 SUPER STAR! +20 XP!</span><button onclick="generateKidQuizRound()" class="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-sm font-bold">Next Question ➡️</button></div><p class="text-sm font-semibold text-emerald-900">${escapeHtml(qObj.explanation || '')}</p>`;
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
      toast.innerHTML = `<div>🤔 Good try! That's not quite right. Tap another option, or click <strong>💡 Show Hint</strong>!</div>`;
      if (typeof window.speakNativeAudio === 'function') {
        window.speakNativeAudio('Not quite, try another option or tap Show Hint!', 'en-US');
      }
    }
  }

  function checkKidQuizSelection(poolIdx) {
    const pack = window.multiLangData[window.appData.kidCategory];
    const chosen = (window._currentKidPool && window._currentKidPool[poolIdx]) || null;
    const chosenPrimary = chosen ? chosen.primary : '';
    const isCorrect = (chosenPrimary === currentKidQuizAnswer.primary);
    const toast = document.getElementById('kidQuizFeedbackToast');
    toast.classList.remove('hidden');

    const p = (window.LuminaDB && typeof window.LuminaDB.getActiveProfile === 'function')
      ? window.LuminaDB.getActiveProfile()
      : ((typeof window.activeProfile === 'function') ? window.activeProfile() : null);

    if (window.LuminaDB && typeof window.LuminaDB.recordActivity === 'function') {
      window.LuminaDB.recordActivity({
        type: 'kid_quiz',
        domain: pack.label,
        title: currentKidQuizAnswer.primary,
        isCorrect: isCorrect,
        xp: isCorrect ? 15 : 3,
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

      if (typeof window.confetti === 'function') {
        window.confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      }
      toast.className = "mt-5 p-4 rounded-2xl text-center text-lg font-bold bg-emerald-100 text-emerald-900 border-2 border-emerald-400";
      toast.innerText = "🌟 YAY! You got it right! +15 Stars!";
      setTimeout(generateKidQuizRound, 1600);
    } else {
      if (!hasFailedFirstAttempt) {
        hasFailedFirstAttempt = true;
        const hintBtn = document.getElementById('kidQuizHintBtn');
        if (hintBtn) hintBtn.classList.remove('hidden');
      }
      toast.className = "mt-5 p-4 rounded-2xl text-center text-lg font-bold bg-amber-100 text-amber-900 border-2 border-amber-400";
      toast.innerText = "🤔 Almost! Try tapping another picture, or tap 💡 Show Hint!";
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
    el.innerHTML = ALL_KID_CATEGORIES.map(c => {
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
