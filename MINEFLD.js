//game constants
const _screen_columns = 80; //DOS CGA screen width in characters
const _screen_rows = 25; //DOS CGA screen height in characters
const _mine_marker = "*";
const _empty_marker = "█"; // ASCII
const _line_prefix = "display_line_";
const _enter_key = "Enter";
const _numpad_enter_key = "NumpadEnter";
const _backspace_key = "Backspace";
const _ascii_a = 64;
const _ascii_asterisk = _mine_marker.charCodeAt(0);
const _parent_element = "content";
const _num_columns = 15;
const _num_rows = 10;
const _input_x_location = 65;
const _input_screen_row = 10;
const _sound_frequency = 220; //Hz
const _sound_delay = 200;  //mS
const _sound_type = "square";

// display rendering characters
const char_t = "┬";
const char_dash = "─";
const char_top_left_corner = "┌";
const char_top_right_corner = "┐";
const char_center = "┼";
const char_bottom_left = "└";
const char_bottom = "─";
const char_bottom_center = "┴";
const char_bottom_right = "┘";
const char_right = "┤";
const char_left = "├";
const cube_top_left = char_top_left_corner + char_dash + char_dash + char_dash;
const cube_top_right = char_top_right_corner;
const cube_top = char_t + char_dash + char_dash+ char_dash;
const cube_left = char_left + char_dash + char_dash + char_dash;
const cube_center = char_center + char_dash + char_dash + char_dash;
const cube_bottom_left = char_bottom_left + char_bottom + char_bottom + char_bottom;
const cube_bottom_center = char_bottom_center + char_bottom + char_bottom + char_bottom;

// Globals
let displayNextWriteLine = 0,
    done,
    field,
    guess,
    mine_ct,
    score;

// Plays a buzzer sound
function sound() {
    let audioCtx = new window.AudioContext();
    let oscillator = audioCtx.createOscillator();

    // Create oscillator (sound generator), set values start
    oscillator.type = _sound_type;
    oscillator.frequency.value = _sound_frequency;
    oscillator.connect(audioCtx.destination);
    oscillator.start();

    // Stop playback after _sound_delay ms
    setTimeout(function () {
        oscillator.stop();
    }, _sound_delay);
}

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// Creates DOM elements used to display content
function createDisplay() {
    const body = document.getElementsByTagName("body")[0];
    body.innerHTML = "<div id='" + _parent_element + "'></div>";
    let parent = body.childNodes[0];
    let html = "";
    for(let i = 0; i < _screen_rows; i++)
        html += "<div id='" + _line_prefix + i + "'></div>";

    parent.innerHTML = html;
}

function gotoLine(lineNum) {
    if(lineNum === null || lineNum === undefined)
        throw "parameter lineNum must not be null";
    else if(typeof lineNum !== "number")
        throw "parameter lineNum must be of type number";

    displayNextWriteLine = lineNum;
}

function getCurrentLine() {
    return displayNextWriteLine;
}

function clrscr() {
    // start clearing screen at top
    gotoLine(0);
    // clear screen by setting line to empty string
    for(let i = 0; i < _screen_rows; i++)
        writeln("");
}

function writeln(content, lineNum) { //Tested
    if(lineNum) {
        if (typeof lineNum !== "number")
            throw "lineNum parameter must be of type number";
        else if (lineNum >= _screen_rows)
            throw "lineNum must be less than " + (_screen_rows - 1);
        else
            gotoLine(lineNum);
    }
    else if(!content) // if null content specified, set content to empty string
        content = " ";

    // write content to screen, and move to next line
    let element = document.getElementById(_line_prefix + displayNextWriteLine++);
    element.innerHTML = content.padEnd(_screen_columns);

    // if next line is greater than max screen lines, goto first screen line.
    if(getCurrentLine() >= _screen_rows)
        gotoLine (0);
}

function writeAt(xPos, yPos, text) {
    gotoLine(yPos);
    let line = document.getElementById(_line_prefix + yPos);
    let content = line.innerHTML; // Get text of specified line

    // Break content into '3' parts, 1. Port before the new text 2. Part replaced by new text (not saved)
    // 3. Part after new text
    if(typeof text === "number")
        text = text.toString();

    let contentBefore = content.substr(0, xPos);
    let contentAfter = content.substr(xPos +text.length);

    // Combine part 1, text, and part 3. Update line content.
    content = contentBefore + text + contentAfter;
    line.innerHTML = content;
}

function getKey(callback) {
    let keydownCallback = (e) => {
        document.removeEventListener("keydown", keydownCallback, false);
        callback(e);
    };
    document.addEventListener("keydown", keydownCallback , false);
}

function readAt(xPos, yPos)
{
    // Get text from line @ yPos
    let line = document.getElementById(_line_prefix + yPos);
    let content = line.innerHTML;
    let contentBefore = content.substr(0, xPos);

    // Split content before input location
    let inputText = content.substr(xPos);
    // Input data is from inputText[0] to the cursor '_'
    let inputArr = inputText.split("_");

    // if the length of the array is > 2, the user entered a _ in their string. To fix this, combine all
    // sections of the input array except the final, adding the _ between
    if(inputArr.length > 2)
    {
        for(let i = 1; i < inputArr.length - 1; i++)
            inputArr[0] += "_" + inputArr[i];
    }

    content = contentBefore + "_";
    gotoLine(yPos);
    writeln(content);

    return inputArr[0];
}

function create2dArray(x, y) {
    let returnArray = [];
    let tempArr = [];

    // Create an array of blank strings of lank y
    for(let i = 0; i < y; i++)
        tempArr.push(" ");

    // fill return array with x copies of tempArray
    for (let i = 0; i < x; i++)
        returnArray.push(tempArr.slice()); // Add a copy of tempArr to returnArr

    return returnArray;
}

/**
 * Determines if keycode represents an alphanumeric character. If so, returns the character associated with the code.
 * If a lower case character code is passed in, it is converted to upper case.
 * Returns false if keycode is not alphanumeric
 * @param keyCode e.code from keydown or keyup event
 * @returns {string|boolean}  String if number or letter. False otherwise
 */
function isAlphaNumeric(keyCode) {
    if(keyCode >= 48 && keyCode < 58) // Numbers
        return String.fromCharCode(keyCode);
    else if(keyCode === 63 || (keyCode >= 65 && keyCode < 90)) // '?' and Capital Letters
        return String.fromCharCode(keyCode);
    else if(keyCode >= 97 && keyCode < 123)// Lower Case Letters
        return String.fromCharCode(keyCode).toUpperCase();
    else
        return false;
}

/*
    Calculates the number of mines neighboring a square.
    A neighbor is defined as any square in the cardinal directions and diagonals
*/
function neighbors() {
    let neighborY,
        neighborX,
        neighborCount;

    // loop through every square
    for (let targetY = 0; targetY < _num_rows; targetY++)
        for (let targetX = 0; targetX < _num_columns; targetX++)
            if (field[targetY][targetX] !== _mine_marker) {
                neighborY = targetY - 1; // Start checking one square above the target
                neighborCount = 0;
                while (neighborY !== (targetY + 2)) { // Stop when more than one square below the target
                    if (neighborY > -1 && neighborY < _num_rows) { // Make sure Y coordinate is valid
                        neighborX = targetX - 1; // Start checking one square to the left of the target
                        while (neighborX !== (targetX + 2)) { // Stop when more than one square to the right of the target
                            if (neighborX > -1 && neighborX < _num_columns && field[neighborY][neighborX] === _mine_marker) // If X coordinate is valid and the square contains a mine
                                neighborCount++;
                            neighborX++; // Check next horizontal neighbor
                        }
                        // Set empty marker if no neighbors, else number of neighbors
                        if (neighborCount === 0)
                            field[targetY][targetX] = _empty_marker;
                        else
                            field[targetY][targetX] = neighborCount
                    }
                    neighborY ++; // Check next vertical neighbor
                }
            }
}

function drawBoard() {
    clrscr();
    writeln("     There are " + mine_ct + " mines.   SCORE : " + score + " [MAX 150]");
    writeln("    1   2   3   4   5   6   7   8   9  10  11  12  13  14  15");
    writeln("  " + cube_top_left + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top_right);

    for (let i = 1; i <= _num_rows; i++) {
        writeln(String.fromCharCode(_ascii_a + i) + " │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │");
        writeln("  " + cube_left + cube_center + cube_center + cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center + char_right);
    }

    gotoLine(getCurrentLine() -1 );
    writeln("  " + cube_bottom_left + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center  + char_bottom_right);

    draw_posn();
    neighbors();
    // Draw input prompt and cursor
    if(!done) {
        writeAt(_input_x_location, (_input_screen_row - 1), "Move (eg A10X)?");
        writeAt(_input_x_location, _input_screen_row, "_");
    }
}

var draw_posn = function() {
    // Offsets to position characters in the center of grids
    const _x_offset = 4,
          _x_scale = 3,
          _y_offset = 3,
          _y_scale = 2;


    for (let y = 0; y < _num_rows; y++) {
        for (let x = 0; x < _num_columns; x++) {
            if (guess[y][x] !== 0) {
                writeAt((x + (x * _x_scale) + _x_offset), (y * _y_scale + _y_offset), field[y][x]); //TODO: Add ability to color text
            }
        }
    }
};

// Places mine_ct mines randomly around the board
function seed_mines() {
    for (let i = 0; i < _num_rows; i++) {
        for (let j = 0; j < _num_columns; j++) {
            field[i][j] = " ";
        }
    }

    for (let i = 0; i < _num_rows; i++) {
        for (let j = 0; j < _num_columns; j++) {
            guess[i][j] = 0;
        }
    }

    for (let i = 0; i < mine_ct; i++) {
        let x = getRandom(0, _num_rows),
            y = getRandom(0, _num_columns);
        while (field[x][y] !== ' ') {
            x = getRandom(0, _num_rows);
            y = getRandom(0, _num_columns);
        }
        field[x][y] = "*";
    }
}

// Checks if square next to current one are empty. Allows for multiple empty squares to be shown w/ a single guess
function check_empty(yPos, xPos) {
    if (yPos > -1 && yPos < _num_rows && xPos > -1 && xPos < _num_columns) {
        score++;
        let none = false;
        while (!none) {
            guess[yPos][xPos] = 3;
            none = true;
            if (field[yPos][xPos] === _empty_marker) {
                none = false;
                if ((yPos - 1 >= 0) && (xPos + 1 < _num_columns) && guess[yPos - 1][xPos + 1] === 0)
                    check_empty(yPos - 1, xPos + 1);
                if ((yPos - 1 >= 0) && guess[yPos - 1][xPos] === 0)
                    check_empty(yPos - 1, xPos);
                if ((yPos - 1 >= 0) && (xPos - 1 >= 0) && guess[yPos - 1][xPos - 1] === 0)
                    check_empty(yPos - 1, xPos - 1);
                if ((xPos + 1 < _num_columns) && guess[yPos][xPos + 1] === 0)
                    check_empty(yPos, xPos + 1);
                if ((xPos - 1 >= 0) && guess[yPos][xPos - 1] === 0)
                    check_empty(yPos, xPos - 1);
                if ((yPos + 1 < _num_rows) && (xPos - 1 >= 0) && guess[yPos + 1][xPos - 1] === 0)
                    check_empty(yPos + 1, xPos - 1);
                if ((yPos + 1 < _num_rows) && guess[yPos + 1][xPos] === 0)
                    check_empty(yPos + 1, xPos);
                if ((yPos + 1 < _num_rows) && (xPos + 1 < _num_columns) && guess[yPos + 1][xPos + 1] === 0)
                    check_empty(yPos + 1, xPos + 1);
                none = !none;
            }
        }
    }
}

// Shows the entire board
function show_board() {
    for (let i = 0; i < _num_rows; i++)
        for (let j = 0; j < _num_columns; j++)
            if (guess[i][j] === 0)
                guess[i][j] = 15;

    drawBoard();
    endRound();
}

function get_guess() {
    let startingWritePos = _input_x_location;
    let getKeyCallback = function(e) {
        if(e.code === _enter_key || e.code === _numpad_enter_key)
            submit();
        else
        {
            let alphaNumeric = false;
            // If more than one letter returned, key is not a char or digit
            if(e.key.length === 1)
                alphaNumeric = isAlphaNumeric(e.key.charCodeAt(0));

            if(e.code === _backspace_key) // backspace
            {
                // On backspace press, remove previous character if there are characters present
                if(startingWritePos > _input_x_location) {
                    writeAt(startingWritePos--, _input_screen_row, " ");
                    writeAt(startingWritePos, _input_screen_row, "_");
                }
            }
            else if(alphaNumeric) // 0-9, A-Z, ?
            {
                writeAt(startingWritePos++, _input_screen_row, e.key);
                writeAt(startingWritePos, _input_screen_row, "_");
            }
            getKey(getKeyCallback);
        }
    };

    var submit = () => {
        let ok,
            row,
            column,
            flag = " ";

        let choice = readAt(_input_x_location, _input_screen_row);
        // get first character of choice
        let ch = choice.charAt(0).toUpperCase();

        // Remove first character (stored in row) from choice
        choice = choice.substring(1);
        let choiceFinalChar = choice.charAt(choice.length - 1 );
        // if the last character of choice is not a digit

        if(!parseInt(choiceFinalChar))
            flag = choiceFinalChar.toUpperCase();

        column = parseInt(choice);
        if(!column)
            column = 100;
        else column--;

        if(ch.charCodeAt(0) > _ascii_a)
            row = ch.charCodeAt(0) - _ascii_a - 1; //Subtract 1 more than a to align with array 0 index
        else
            row = 100;

        ok = (flag === " " || flag === "?" || flag === "M") && guess[row][column] === 0 && row > -1 && row <= _num_rows && column > -1 && column <= _num_columns;
        if(!ok)
            sound();

        if(!ok)
            get_guess();
        else {
            guess[row][column] = 3;

            switch (flag) {
                case " ":
                    if (field[row][column] === String.fromCharCode(_ascii_asterisk)) {
                        done = true;
                        show_board();
                    } else
                        check_empty(row, column);
                    break;

                case "?":
                    field[row][column] = "?";
                    break;

                case "M":
                    if (field[row][column] !== String.fromCharCode(_ascii_asterisk)) {
                        done = true;
                        show_board();
                    } else {
                        score++;
                        guess[row][column] = 4;
                    }
                    break;
            }

            if (!done) {
                if(score === 150) {
                   done = true;
                   endRound();
                }
                else {
                    drawBoard();
                    get_guess();
                }

            }
        }
    };

    // Begin execution of get_guess function
    getKey(getKeyCallback);
}

function instructions() {
    clrscr();

    writeln();
    writeln();
    writeln("                              M I N E F I E L D");
    writeln();
    writeln("       The display shows a minefield with " + mine_ct + " hidden mines. You choose areas to");
    writeln("examine by typing the coordinates, as 'D7'. If a mine is at the position, you");
    writeln("loose!  If not, you are shown the number of mines in the neighboring squares.");
    writeln();
    writeln("If the square you choose is empty, al adjacent squares will be shown");
    writeln("immediately, and all their neighbors if any of them are also empty.");
    writeln();
    writeln("If you think a mine is present, add 'M' (or 'm') to the end of the address, as");
    writeln("'D7M', or 'f11m', for example. If you are right, the mine will be shown ; if");
    writeln("not, you loose again!. If you cannot tell at all, you can append a query, '?'");
    writeln(" as in 'h10?'. Each correct guess (and empty display) scores you one point.");
    writeln("Query entries do not score.  The maximum possible is 150, if you guess all");
    writeln("squares correctly.");
    writeln();
    writeln("  Press &ltENTER&gt to continue.  Good luck!");
};

var startGame = function() {
    clrscr();
    instructions();
    while (!done) {
        run();
        if (score === 150) {
            clrscr();
            writeln("WELL DONE!");
        }
        writeln("Play again?");
        while (ch !== 'Y' && ch !== 'N') {
            //read key;
            //uppercase input
        }
        writeln(ch);
        done = (ch === 'N');
    }
    clrscr();
    writeln("Thanks for the game.  See you again soon....");
};

function endRound() {
    // Print win message
    if(score === 150)
        writeAt(65, 9, "WELL DONE!");

    // Prompt to play again
    writeAt(65, 13, "Play Again?");
    readAt(65, 14);
}

var run = function() {
    score = 0;
    mine_ct = 25;
    done = false;
    field = create2dArray(10, 15);
    guess = create2dArray(10, 15);
    seed_mines();
    drawBoard();
    get_guess();
};

//Begin game after document is loaded.
document.addEventListener("DOMContentLoaded", function(event)
{
    let getKeyCallback = function(e) {
        if(e.code === _enter_key || e.code === _numpad_enter_key)
            run();
        else
            getKey(getKeyCallback);
    };
    createDisplay();
    instructions();
    getKey(getKeyCallback);
});