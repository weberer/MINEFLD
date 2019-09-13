//game constants
const _ascii_0 = 48,
      _ascii_9 = 58,
      _ascii_A = 65,
      _ascii_Z = 90,
      _ascii_a = 97,
      _ascii_z = 122,
      _ascii_question_mark = 63,
      _backspace_key = "Backspace",
      _cursor = "_",
      _empty_marker = "█", // ASCII
      _enter_key = "Enter",
      _input_x_location = 65,
      _input_screen_row = 10,
      _line_prefix = "display_line_",
      _max_score = 150,
      _mine_ct = 25,
      _mine_marker = "*",
      _num_columns = 15,
      _num_rows = 10,
      _numpad_enter_key = "NumpadEnter",
      _parent_element = "content",
      _screen_columns = 80, //DOS CGA screen width in characters
      _screen_rows = 25, //DOS CGA screen height in characters
      _sound_delay = 200,  //mS
      _sound_frequency = 220, //Hz
      _sound_type = "square",
      _x_offset = 4,
      _x_scale = 3,
      _y_offset = 3,
      _y_scale = 2,
      _ascii_asterisk = _mine_marker.charCodeAt(0);

//text color constant
const _text_black = "black", // Pascal text color 0
      _text_cyan = "cyan", // Pascal text color 3
      _text_red = "red", // Pascal text color 4
      _text_white = "white"; // Pascal text color 15

// display rendering characters
const char_bottom = "─",
      char_bottom_center = "┴",
      char_bottom_left = "└",
      char_bottom_right = "┘",
      char_center = "┼",
      char_dash = "─",
      char_left = "├",
      char_right = "┤",
      char_t = "┬",
      char_top_left_corner = "┌",
      char_top_right_corner = "┐";

// multi character 'glyphs'
const cube_bottom_center = char_bottom_center + char_bottom + char_bottom + char_bottom,
      cube_bottom_left = char_bottom_left + char_bottom + char_bottom + char_bottom,
      cube_center = char_center + char_dash + char_dash + char_dash,
      cube_left = char_left + char_dash + char_dash + char_dash,
      cube_top = char_t + char_dash + char_dash+ char_dash,
      cube_top_left = char_top_left_corner + char_dash + char_dash + char_dash,
      cube_top_right = char_top_right_corner;

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

// Selects a row/line to read/write from
function gotoLine(lineNum) {
    if(lineNum === null || lineNum === undefined)
        throw "parameter lineNum must not be null";
    else if(typeof lineNum !== "number")
        throw "parameter lineNum must be of type number";

    displayNextWriteLine = lineNum;
}

// Returns row/line currently selected for read/write operations
function getCurrentLine() {
    return displayNextWriteLine;
}

// Clears text from all HTML display rows
function clrscr() {
    // start clearing screen at top
    gotoLine(0);
    // clear screen by setting line to empty string
    for(let i = 0; i < _screen_rows; i++)
        writeln("");
}

// Writes a line's content to the corresponding display HTML element
function writeln(content, lineNum) {
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

// Adds HTML formatting to a line/row of text
function formatText(text, displayRow) {
    // convert text into an array for easier access
    let charArray = Array.from(text);
    // calculate yCord of the field/guess array
    let yCord = (displayRow - _y_offset) / _y_scale;

    if(yCord < _num_rows && yCord >= 0 && Number.isInteger(yCord)) //if yCord is a valid array index
        for(let xCord = 0; xCord < _num_columns; xCord++) { // loop through every displayColumn in guess
            let displayColumn = xCord + (xCord * _x_scale) + _x_offset;// Calculate display column from displayColumn
                charArray[displayColumn] = charArray[displayColumn].fontcolor(guess[yCord][xCord]); // set text color equal to that in the guess array
        }

    // add blinking effect to the cursor
    for(let screenColumn = 0; screenColumn < _screen_columns; screenColumn ++ )
        if(charArray[screenColumn] === _cursor)
            charArray[screenColumn] = _cursor.blink();

    // Combine into single HTML string to display
    return charArray.join("");
}

// inserts (writes) text at an xPosition in row yPosition
function writeAt(xPos, yPos, text) {
    gotoLine(yPos);
    let line = document.getElementById(_line_prefix + yPos);
    let content = line.innerText; // Get text of specified line's text (no HTML tags)

    // Break content into '3' parts, 1. Port before the new text 2. Part replaced by new text (not saved)
    // 3. Part after new text
    if(typeof text === "number")
        text = text.toString();

    let contentBefore = content.substr(0, xPos);
    let contentAfter = content.substr(xPos +text.length);

    // Combine part 1, text, and part 3. Update line content.
    content = contentBefore + text + contentAfter;
    line.innerHTML = formatText(content, yPos); // write innerHTML b/c content may contain HTML tags
}

// Handles creation, removal and event return for keydown events
function getKey(callback) {
    let keydownCallback = (e) => {
        document.removeEventListener("keydown", keydownCallback, false);
        callback(e);
    };
    document.addEventListener("keydown", keydownCallback , false);
}

// combines key detection, input validation, submit confirmation and value return from display into one function
function getInput(xLocation, screenRow, callback) {
    let startingWritePos = xLocation;
    let getKeyCallback = function(e) {
        if(e.code === _enter_key || e.code === _numpad_enter_key)
            callback(readAt(xLocation,screenRow));
        else
        {
            let alphaNumeric = false;
            // If more than one letter returned, key is not a char or digit
            if(e.key.length === 1)
                alphaNumeric = isAlphaNumeric(e.key.charCodeAt(0));

            if(e.code === _backspace_key) // backspace
            {
                // On backspace press, remove previous character if there are characters present
                if(startingWritePos > xLocation) {
                    writeAt(startingWritePos--,screenRow, " ");
                    writeAt(startingWritePos, screenRow, _cursor);
                }
            }
            else if(alphaNumeric) // 0-9, A-Z, ?
            {
                writeAt(startingWritePos++, screenRow, e.key);
                writeAt(startingWritePos, screenRow, _cursor);
            }
            getKey(getKeyCallback);
        }
    };
    // Show the initial cursor
    writeAt(xLocation, screenRow, _cursor);
    // Begin execution of readInput function
    getKey(getKeyCallback);
}

function readAt(xPos, yPos)
{
    // Get text from line @ yPos
    let line = document.getElementById(_line_prefix + yPos);
    let content = line.innerText;
    let contentBefore = content.substr(0, xPos);

    // Split content before input location
    let inputText = content.substr(xPos);
    // Input data is from inputText[0] to the cursor '_'
    let inputArr = inputText.split(_cursor);

    // if the length of the array is > 2, the user entered a _ in their string. To fix this, combine all
    // sections of the input array except the final, adding the _ between
    if(inputArr.length > 2)
    {
        for(let i = 1; i < inputArr.length - 1; i++)
            inputArr[0] += _cursor + inputArr[i];
    }

    // append the cursor character to the line and write to the display
    content = contentBefore + _cursor;
    gotoLine(yPos);
    writeln(content);

    // remove trailing spaces and return user input
    return inputArr[0].split(" ")[0];
}

// Creates a 2D array object
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
    if(keyCode >= _ascii_0 && keyCode < _ascii_9) // Numbers
        return String.fromCharCode(keyCode);
    else if(keyCode === _ascii_question_mark || (keyCode >= _ascii_A && keyCode <_ascii_Z + 1)) // '?' and Capital Letters
        return String.fromCharCode(keyCode);
    else if(keyCode >= _ascii_a && keyCode < _ascii_z + 1)// Lower Case Letters
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

// Loops through the guess array, and draws squares that have already been guessed
function draw_posn() {
    for (let y = 0; y < _num_rows; y++)
        for (let x = 0; x < _num_columns; x++)
            if (guess[y][x] !== _text_black)
                writeAt((x + (x * _x_scale) + _x_offset), (y * _y_scale + _y_offset), field[y][x]);
}

function drawBoard() {
    clrscr();
    // Draw HUD, numbers and top row of the grid
    writeln("     There are " + mine_ct + " mines.   SCORE : " + score + " [MAX 150]");
    writeln("    1   2   3   4   5   6   7   8   9  10  11  12  13  14  15");
    writeln("  " + cube_top_left + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top_right);

    // draw middle rows of the grid
    for (let i = 1; i <= _num_rows; i++) {
        writeln(String.fromCharCode(_ascii_A + i - 1) + " │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │"); // this row will contain the symbols for mines etc.
        writeln("  " + cube_left + cube_center + cube_center + cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center + char_right);
    }

    // draw the bottom row of the grid
    gotoLine(getCurrentLine() -1 );
    writeln("  " + cube_bottom_left + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center  + char_bottom_right);

    draw_posn(); // draw squares that have been guessed
    neighbors();
    // Draw input prompt
    if(!done) {
        writeAt(_input_x_location, (_input_screen_row - 1), "Move (eg A10X)?");
    }
}
// Places mine_ct mines randomly around the board
function seed_mines() {
    // fill the field with empty squared
    for (let i = 0; i < _num_rows; i++) {
        for (let j = 0; j < _num_columns; j++) {
            field[i][j] = " ";
        }
    }

    // fill guess array with empty squares
    for (let i = 0; i < _num_rows; i++) {
        for (let j = 0; j < _num_columns; j++) {
            guess[i][j] = _text_black;
        }
    }

    // fill the board with mines
    for (let i = 0; i < mine_ct; i++) {
        // Pick a random location for a mine
        let x = getRandom(0, _num_rows),
            y = getRandom(0, _num_columns);
        while (field[x][y] !== ' ') { // If the guessed location has a mine, pick another location until
            x = getRandom(0, _num_rows); // a valid location is found
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
            guess[yPos][xPos] = _text_cyan;
            none = true;
            if (field[yPos][xPos] === _empty_marker) {
                none = false;
                if ((yPos - 1 >= 0) && (xPos + 1 < _num_columns) && guess[yPos - 1][xPos + 1] === _text_black)
                    check_empty(yPos - 1, xPos + 1);
                if ((yPos - 1 >= 0) && guess[yPos - 1][xPos] === _text_black)
                    check_empty(yPos - 1, xPos);
                if ((yPos - 1 >= 0) && (xPos - 1 >= 0) && guess[yPos - 1][xPos - 1] === _text_black)
                    check_empty(yPos - 1, xPos - 1);
                if ((xPos + 1 < _num_columns) && guess[yPos][xPos + 1] === _text_black)
                    check_empty(yPos, xPos + 1);
                if ((xPos - 1 >= 0) && guess[yPos][xPos - 1] === _text_black)
                    check_empty(yPos, xPos - 1);
                if ((yPos + 1 < _num_rows) && (xPos - 1 >= 0) && guess[yPos + 1][xPos - 1] === _text_black)
                    check_empty(yPos + 1, xPos - 1);
                if ((yPos + 1 < _num_rows) && guess[yPos + 1][xPos] === _text_black)
                    check_empty(yPos + 1, xPos);
                if ((yPos + 1 < _num_rows) && (xPos + 1 < _num_columns) && guess[yPos + 1][xPos + 1] === _text_black)
                    check_empty(yPos + 1, xPos + 1);
                none = !none;
            }
        }
    }
}

// Shows the entire board, even if not guessed
function show_board() {
    for (let i = 0; i < _num_rows; i++)
        for (let j = 0; j < _num_columns; j++)
            if (guess[i][j] === _text_black)
                guess[i][j] = _text_white;

    drawBoard();
    endRound();
}

function get_guess() {
    // logic of get_guess function. Takes in input from getInput(x,y);
    let submit = (choice) => {
        let ok,
            row,
            column,
            flag = " ";

        //let choice = readAt(_input_x_location, _input_screen_row);
        // get first character of choice
        let ch = choice.charAt(0).toUpperCase();

        // Remove first character (stored in row) from choice
        choice = choice.substring(1);
        let choiceFinalChar = choice.charAt(choice.length - 1 );

        // if the last character of choice is not a digit
        if(choiceFinalChar !== "0" && !parseInt(choiceFinalChar)) // b/c 0 is falsy, need special check for that
            flag = choiceFinalChar.toUpperCase();

        column = parseInt(choice);
        if(column.toString().length + 1 < choice.length) //if column contained extra letters, the length of the # will
            column = 100;                                // be less than expected
        else column--; // aligns column with the field/guess grid

        if(ch.charCodeAt(0) >= _ascii_A)
            row = ch.charCodeAt(0) - _ascii_A;
        else
            row = 100;

        // determine if user input is valid
        ok = (flag === " " || flag === "?" || flag === "M")  && row > -1 && row <= _num_rows && column > -1 && column <= _num_columns && guess[row][column] === _text_black;

        if(!ok) {
            sound();
            get_guess(); // if not valid guess again
        }
        else {
            guess[row][column] = _text_cyan; // set default guess color

            switch (flag) {
                case " ":
                    if (field[row][column] === String.fromCharCode(_ascii_asterisk)) {
                        done = true; // end game if player hit a mine without flagging it
                        show_board();
                    } else
                        check_empty(row, column); // show neighboring cells around 'empty' cells
                    break;

                case "?":
                    field[row][column] = "?";
                    break;

                case "M":
                    if (field[row][column] !== String.fromCharCode(_ascii_asterisk)) {
                        done = true; // end game if incorrect mine guess
                        show_board();
                    } else {
                        score++;
                        guess[row][column] = _text_red; // if correct guess, color mine
                    }
                    break;
            }

            if (!done) {
                // if max_score reached, game is complete
                if(score === _max_score) {
                   done = true;
                   endRound();
                }
                else { // otherwise player guesses again
                    drawBoard();
                    get_guess();
                }
            }
        }
    };

    // Start method by reading from keyboard.
    getInput(_input_x_location, _input_screen_row, submit);
}

// Prints instruction/welcome screen
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
}

// Displays end of round message and processes user response
function endRound() {
    let processInput = function(keyEvent) {
        let input = keyEvent.key.toUpperCase();
        if(input === 'Y')
            run();
        else if(input === 'N')
        {
            // Create 'goodbye' screen
            clrscr();
            writeAt(5, 10, "Thanks for the game.  See you again soon....");
        }
        else
            getKey(processInput);
    };

    // Print win message
    if(score === _max_score)
        writeAt(_input_x_location, 9, "WELL DONE!");

    // Prompt to play again
    writeAt(_input_x_location, 13, "Play Again? " + _cursor);
    getKey(processInput);
}

// Starts a round of the game
function run() {
    score = 0;
    mine_ct = _mine_ct;
    done = false;
    field = create2dArray(_num_columns, _num_rows);
    guess = create2dArray(_num_columns, _num_rows);
    console.log(guess);
    console.log(field);
    clrscr();
    seed_mines();
    drawBoard();
    get_guess();
}

//Begin game after document is loaded.
document.addEventListener("DOMContentLoaded", function() {
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