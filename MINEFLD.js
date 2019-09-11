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
const _ascii_a = 64;
const _renderElement = "content";
const _num_rows = 15;
const _num_columns = 10;

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
    let keypressCallback = (e) => {
        document.removeEventListener("keypress", keypressCallback, false);
        callback(e);
    };

    document.addEventListener("keypress", keypressCallback , false);
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

    for (let i = 1; i <= 9; i++) {
        writeln(String.fromCharCode(_ascii_a + i) + " │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │");
        writeln("  " + cube_left + cube_center + cube_center + cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center+ cube_center + char_right);
    }

    gotoLine(getCurrentLine() -1 );
    writeln("  " + cube_bottom_left + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center + cube_bottom_center  + char_bottom_right);
}

var draw_posn = function() {
    var ii, jj;
    for (ii = 0; ii < 10; ii++) {
        for (jj = 0; jj < 15; jj++) {
            if (guess[ii][jj] !== 0) {
                console.log("Gotoxy(" + jj * 4 + 1 + "," + ii * 2 + 2 + ");");
                console.log("TextColor(guess[ii][jj])");
                console.log("write(field[ii][jj]");
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

var get_guess = function() {

    let startingWritePos = 65;
    let getKeyCallback = function(e) {
        if(e.code !== _enterKeyCode && e.code !== _numpadEnterKeyCode)
        {
            writeAt(startingWritePos++, 10, e.key);
            writeAt(startingWritePos, 10, "_");
            getKey(getKeyCallback);
        }
        else
            submit();
    };

    writeAt(65, 9, "Move (eg A10X)?");
    writeAt(startingWritePos, 10, "_");
    getKey(getKeyCallback);

    var submit = () => {
        writeAt(65, 12, "SUBMIT!"); //TODO: REMOVE ME, Get text. Remove Logged Text (write substring of line excluding input to console)
    };

    /*
    * gotoxy(65,9);write('Move (eg A10X)?');
  repeat
    gotoxy(66,10);clreol;readln(choice);flag:=' ';
    ch:=Upcase(choice[1]);ud:=100;lr:=100;
    choice:=copy(choice,2,length(choice)-1);
    if choice[length(choice)] in ['0'..'9'] then begin end
    else begin
      flag:=upcase(choice[length(choice)]);
      choice:=copy(choice,1,(length(choice)-1))
    end;
    Val(choice,lr,fg);if fg<>0 then lr:=100;
    if ord(ch)>63 then ud:=(ord(ch)-64) else ud:=100;
    ok:=(flag in [' ','?','M'])and(guess[ud,lr]=0)and
                         (ud>0)and(ud<11)and(lr>0)and(lr<16);
    if not ok then begin sound(220);delay(200);nosound end;
  until ok;
(*  gotoxy(66,10);clreol;write(ch,' ',ud,'/',lr,' ',flag,'?'); *)
  guess[ud,lr]:=3;
  case flag of
    ' ' : if field[ud,lr]=chr(15) then begin
            done:=true;show_board;
          end else check_empty(ud,lr);
    '?' : field[ud,lr]:='?';
    'M' : if field[ud,lr]<>chr(15) then begin
            done:=true;show_board
          end else begin inc(score);guess[ud,lr]:=4 end;
  end;
  if not done then done:=(score=150)
  * */
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

   // }
    //drawBoard();
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
        {
            console.log("Key: " + e.code);
            getKey(getKeyCallback);
        }
    };

    createDisplay();
    instructions();
    getKey(getKeyCallback);
});