let ch,
    done = false,
    guess,
    mine_ct = 25,
    none,
    score = 0,
    xx,
    yy;

// game constants
const screenWidth = 80; //DOS CGA screen width in characters
const screenHeight = 25; //DOS CGA screen height in characters
const linePrefix = "display_line_";
const enterKeyCode = "Enter";
const renderElement = "content";

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
    const parent = document.getElementById(renderElement);
    let html = "";
    for(let i = 0; i < screenHeight; i++)
        html += "<div id='" + linePrefix + i + "'></div>";

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
    for(let i = 0; i < screenHeight; i++)
        writeln("");
}

function writeln(content, lineNum) { //Tested
    if(lineNum) {
        if (typeof lineNum !== "number")
            throw "lineNum parameter must be of type number";
        else if (lineNum >= screenHeight)
            throw "lineNum must be less than " + (screenHeight - 1);
        else
            gotoLine(lineNum);
    }
    else if(!content) // if null content specified, set content to empty string
        content = " ";

    // write content to screen, and move to next line
    let element = document.getElementById(linePrefix + displayNextWriteLine++);
    element.innerHTML = content;

    // if next line is greater than max screen lines, goto first screen line.
    if(getCurrentLine() >= screenHeight)
        gotoLine (0);
}

function getKey(callback) {

    let keypressCallback = (e) => {
        if(e.code === enterKeyCode)
        {
            document.removeEventListener("keypress", keypressCallback, false);
            callback();
        }
    };

    document.addEventListener("keypress", keypressCallback, false);
}

var create2dArray = function(x, y) {
    var returnArray = new Array(x);
    for (var i = 0; i < x; i++)
        returnArray[i] = new Array(y);
    return returnArray;
};

var field = create2dArray(10, 15);

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

var drawBoard = function() {

    writeln("     There are " + mine_ct + " mines.   SCORE : " + score + " [MAX 150]");
    writeln("    1   2   3   4   5   6   7   8   9  10  11  12  13  14  15");
    writeln("  " + cube_top_left + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top + cube_top_right);

    for (let i = 1; i <= 9; i++) {
        writeln(String.fromCharCode(64 + i) + " │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │");
        writeln("  " + cube_left + cube_center + cube_center + cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center + char_right);
    }

    gotoLine(getCurrentLine() -1 );
    writeln("  " + cube_bottom_left + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center  + char_bottom_right);
};


var draw_posn = function() {
    var ii, jj;
    for (ii = 0; ii < 10; ii++) {
        for (jj = 0; jj < 15; jj++) {
            if (guess[ii][jj] !== 0) {
                writeln("Gotoxy(" + jj * 4 + 1 + "," + ii * 2 + 2 + ");");
                writeln("TextColor(guess[ii][jj])");
                writeln("write(field[ii][jj]");
            }
        }
    }
};

var seed_mines = function() {
    var ii, jj;

    for (ii = 1; ii <= 10; ii++) {
        for (jj = 1; jj <= 15; jj++) {
            field[ii][jj] = " ";
        }
    }
    for (ii = 1; ii <= 10; ii++) {
        for (jj = 1; jj <= 15; jj++) {
            guess[ii][jj] = 0;
        }
    }
    for (ii = 1; ii <= mine_ct; ii++) {
        while (field[xx][yy] !== ' ') {
            xx = getRandom(1, 10);
            yy = getRandom(1, 15);
        }
        field[xx][yy] = String.fromCharCode(15);
    }
};

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

var show_board = function() {
    var ii, jj;
    for (ii = 1; ii <= 10; ii++) {
        for (jj = 1; jj <= 15; jj++) {
            if (guess[ii][jj] === 0) {
                guess[ii][jj] = 15;
            }
        }
    }
};

var run = function() {
    score = 0;
    seed_mines();
    while (!done) {
        drawBoard();
        get_guess();
    }
    draw_board();
}

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
    writeln("immediatley, and all their neighbors if any of them are also empty.");
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
    //clearscreen
    randomize();
    instructions();
    while (!done) {
        run();
        if (score === 150) {
            //clearscreen
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

var getRandom = function(min, max) {
    Math.floor(Math.random() * (max - min)) + min;
};

//Begin game after document is loaded.
document.addEventListener("DOMContentLoaded", function(event)
{
    createDisplay();
    instructions();
    getKey(() => {
        clrscr();
        drawBoard();
    });
});