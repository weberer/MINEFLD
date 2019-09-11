let ch,
    done,
    field,
    guess,
    mine_ct,
    none,
    score;

// game constants
const _screenWidth = 80; //DOS CGA screen width in characters
const _screenHeight = 25; //DOS CGA screen height in characters
const _linePrefix = "display_line_";
const _enterKeyCode = "Enter";
const _numpadEnterKeyCode = "NumpadEnter";
const _backspaceKeyCode = "Backspace";
const _ascii_a = 64;
const _renderElement = "content";
const _num_rows = 15;
const _num_columns = 10;
const _input_x_location = 65;

// display rendering characters
const char_t = "┬"; //C2
const char_dash = "─"; //C4
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

let displayNextWriteLine = 0;

function createDisplay() { //Tested
    const parent = document.getElementById(_renderElement);
    let html = "";
    for(let i = 0; i < _screenHeight; i++)
        html += "<div id='" + _linePrefix + i + "'></div>";

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

function clrscr() { //Tested
    // start clearing screen at top
    gotoLine(0);

    // clear screen by setting line to empty string
    for(let i = 0; i < _screenHeight; i++)
        writeln("");
}

function writeln(content, lineNum) { //Tested
    if(lineNum) {
        if (typeof lineNum !== "number")
            throw "lineNum parameter must be of type number";
        else if (lineNum >= _screenHeight)
            throw "lineNum must be less than " + (_screenHeight - 1);
        else
            gotoLine(lineNum);
    }
    else if(!content) // if null content specified, set content to empty string
        content = " ";

    // write content to screen, and move to next line
    let element = document.getElementById(_linePrefix + displayNextWriteLine++);
    element.innerHTML = content.padEnd(_screenWidth);

    // if next line is greater than max screen lines, goto first screen line.
    if(getCurrentLine() >= _screenHeight)
        gotoLine (0);
}

function writeAt(xPos, yPos, text) {
    let previousLine = getCurrentLine(); //TODO: Remove, shouldn't be needed. Kept just in case
    gotoLine(yPos);
    let line = document.getElementById(_linePrefix + yPos);
    let content = line.innerHTML; // Get text of specified line

    // Break content into '3' parts, 1. Port before the new text 2. Part replaced by new text (not saved)
    // 3. Part after new text
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
    let line = document.getElementById(_linePrefix + yPos);
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
    else if(keyCode >= 65 && keyCode < 90) // Capital Letters
        return String.fromCharCode(keyCode);
    else if(keyCode >= 97 && keyCode < 123)// Lower Case Letters
        return String.fromCharCode(keyCode).toUpperCase();
    else
        return false;
}

var neighbors = function() {
    let ii, jj, ct;

    for (var pp = 1; pp <= 10; pp++) {
        for (var qq = 1; qq <= 15; qq++) {
            if (field[pp][qq] !== 15) {
                ii = pp - 1;
                ct = 0;
                while (ii != (PP + 2)) {
                    if (ii > 0 && ii < 11) {
                        jj = qq - 1;
                        while (jj != (qq + 2)) {
                            if (jj > 0 &&
                                jj < 16 &&
                                field[ii][jj] === 15
                            ) {
                                ct++;
                            }
                            jj++;
                        }
                        if (ct === 0) {
                            field[pp][qq] = '�';
                        } else {
                            field[pp][qq] = (48 + ct);
                        }
                    }
                }
            }
        }
    }
};

function drawBoard() {
    clrscr();
    writeln("     There are " + mine_ct + " mines.   SCORE : " + score + " [MAX 150]");
    writeln("    1   2   3   4   5   6   7   8   9  10  11  12  13  14  15");
    writeln("  " + cube_top_left + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top_right);

    for (let i = 1; i <= _num_columns; i++) {
        writeln(String.fromCharCode(_ascii_a + i) + " │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │");
        writeln("  " + cube_left + cube_center + cube_center + cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center + char_right);
    }

    gotoLine(getCurrentLine() -1 );
    writeln("  " + cube_bottom_left + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center  + char_bottom_right);

    draw_posn();
    // Draw input prompt and cursor
    writeAt(_input_x_location, 9, "Move (eg A10X)?");
    writeAt(_input_x_location, 10, "_");
}

var draw_posn = function() {
    // Offsets to position characters in the center of grids
    const _x_offset = 4,
          _y_offset = 3;

    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 15; j++) {
            if (guess[i][j] !== 0) {
                writeAt((j* 4 + _x_offset), (i * 2 + _y_offset), field[i][j]); //TODO: Add ability to color text
            }
        }
    }
};

function seed_mines() {
    for (let i = 0; i < _num_columns; i++) {
        for (let j = 0; j < _num_rows; j++) {
            field[i][j] = " ";
        }
    }

    for (let i = 0; i < _num_columns; i++) {
        for (let j = 0; j < _num_rows; j++) {
            guess[i][j] = 0;
        }
    }

    for (let i = 0; i < mine_ct; i++) {
        let x = getRandom(0, _num_columns),
            y = getRandom(0, _num_rows);
        while (field[x][y] !== ' ') {
            x = getRandom(0, _num_columns);
            y = getRandom(0, _num_rows);
        }
        field[x][y] = "*";
    }
    console.log(field); //TODO: Remove Logging
}

var check_empty = function(du, rl) {
    if (du > 0 && du < 11 && rl > 0 && rl < 15) {
        score++;
        none = true;
        while (!none) {
            guess[du][rl] = 3;
            none = true;
            if (field[du][rl] === '�') {
                none = false;
                if (guess[du - 1][rl + 1] === 0)
                    check_empty(du - 1, rl + 1);
                if (guess[du - 1][rl] === 0)
                    check_empty(du - 1, rl);
                if (guess[du - 1][rl - 1] === 0)
                    check_empty(du - 1, rl - 1);
                if (guess[du][rl + 1] === 0)
                    check_empty(du, rl + 1);
                if (guess[du][rl - 1] === 0)
                    check_empty(du, rl - 1);
                if (guess[du + 1][rl - 1] === 0)
                    check_empty(du + 1, rl - 1);
                if (guess[du + 1][rl] === 0)
                    check_empty(du + 1, rl);
                if (guess[du + 1][rl + 1] === 0)
                    check_empty(du + 1, rl + 1);
                none = !none;
            }
        }
    }
};

function show_board() {
    for (let i = 0; i < _num_columns; i++)
        for (let j = 0; j < _num_rows; j++)
            if (guess[i][j] === 0)
                guess[i][j] = 15;
}

var get_guess = function() {
    let startingWritePos = _input_x_location;
    let getKeyCallback = function(e) {
        if(e.code === _enterKeyCode || e.code === _numpadEnterKeyCode)
            submit();
        else
        {
            let alphaNumeric = false;
            // If more than one letter returned, key is not a char or digit
            if(e.key.length === 1)
                alphaNumeric = isAlphaNumeric(e.key.charCodeAt(0));

            if(e.code === _backspaceKeyCode) // backspace
            {
                // On backspace press, remove previous character if there are characters present
                if(startingWritePos > _input_x_location) {
                    writeAt(startingWritePos--, 10, " ");
                    writeAt(startingWritePos, 10, "_");
                }
            }
            else if(alphaNumeric) // 0-9, A-Z
            {
                writeAt(startingWritePos++, 10, e.key);
                writeAt(startingWritePos, 10, "_");
            }
            getKey(getKeyCallback);
        }
    };

function submit() {
        let ok,
            row,
            column,
            flag = " ";

        let choice = readAt(_input_x_location, 10);
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

        if(ch.charCodeAt(0) > 64)
            row = ch.charCodeAt(0) - 65;
        else
            row = 100;

        ok = (flag === " " || flag === "?" || flag === "M") && guess[row][column] === 0 && row >= 0 && row < 11 && column >= 0 && column < 16;
        if(!ok)
        {
            //Play a sound
        }

        if(!ok)
            get_guess();
        else {
            guess[row][column] = 3;

            switch (flag) {
                case " ":
                    if (field[row][column] === String.fromCharCode(15)) {
                        done = true;
                        show_board();
                    } else
                        check_empty(row, column);
                    break;

                case "?":
                    field[row][column] = "?";
                    break;

                case "M":
                    if (field[row][column] !== String.fromCharCode(15)) {
                        done = true;
                        show_board();
                    } else {
                        score++;
                        guess[row][column] = 4;
                    }
                    break;
            }
            console.log(guess); //TODO: Remove Me

            if (!done) {
                done = (score === 150);
                get_guess();
            }
        }
    };
    getKey(getKeyCallback);
};

var run = function() {
    score = 0;
    mine_ct = 25;
    done = false;
    field = create2dArray(10, 15);
    guess = create2dArray(10, 15);
    seed_mines();
    //while (!done) {
        drawBoard();
        get_guess();
        //drawBoard();
    //}
    drawBoard();
};

let instructions = function() {
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

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

//Begin game after document is loaded.
document.addEventListener("DOMContentLoaded", function(event)
{
    let getKeyCallback = function(e) {
        if(e.code === _enterKeyCode || e.code === _numpadEnterKeyCode)
            run();
        else
            getKey(getKeyCallback);
    };

    createDisplay();
    instructions();
    getKey(getKeyCallback);
});