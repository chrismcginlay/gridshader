var blockDimension = 20;    //square blocks size dimension
var gridSize = 25;          //number of blocks across and down in grid
var gridPixels = 1;         //pixel width of gridlines
// pixelWidth - linear number of pixels required to render grid
var pixelWidth = blockDimension*gridSize+gridPixels*(gridSize+1);
var gridShade = []; //[row][column] current cell shading data organised by row
var columnData = []; //[column][block] current block data organised by column
var ui_canvas = document.getElementById('layer-ui');
var cursorLineWidth = 3;

assert(ui_canvas.width==pixelWidth,"Canvas has wrong width");
assert(ui_canvas.height==pixelWidth, "Canvas has wrong height");
if (ui_canvas.getContext) {
    var ui_ctx = ui_canvas.getContext('2d');
}

function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion Failure";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message;
    }
}

function fillSquareAtRC(context, r, c) {
    //Shade square at row=r, column=c
    var x = 0.5+(blockDimension+gridPixels)*c; //top left x-co-ord
    var y = 0.5+(blockDimension+gridPixels)*r; //top left y-co-ord
    context.fillRect(x, y, blockDimension+0.5, blockDimension+0.5);
}

function clearSquareAtRC(context, r, c) {
    //clear square at row=r, column=c
    var x = 0.5+(blockDimension+gridPixels)*c; //top left x-co-ord
    var y = 0.5+(blockDimension+gridPixels)*r; //top left y-co-ord
    context.clearRect(x, y, blockDimension+0.5, blockDimension+0.5);
}

function init() {
    loadBlockData();
    drawGrid();
    drawConstrainedCells();
    drawShadedCells();
    cursor.draw(ui_ctx);
    computeColumnBlocks();
    showColumnBlocks();
}

var cursor = {
    r: 0,
    c: 0,
    c_old: 0, //record block start column at start of any dragging operation
    length: 1,
    colour: 'blue',
    dragging: false,
    dragLimitLow: 0,            //restrict movement of dragged blocks so as not
    dragLimitHigh: gridSize,    //to overlap any adjacent blocks.
    draw: function(ctx) {
        var x = 0.5+(blockDimension+gridPixels)*this.c; //top left x-co-ord
        var y = 0.5+(blockDimension+gridPixels)*this.r; //top left y-co-ord
        ctx.strokeRect(
            x, y, 
            (blockDimension+gridPixels)*this.length,
            (blockDimension+gridPixels)
        );
    },
    clear: function(ctx) {
        var x = 0.5+(blockDimension+gridPixels)*this.c; //top left x-co-ord
        var y = 0.5+(blockDimension+gridPixels)*this.r; //top left y-co-ord
        //clear cursor rectangle plus extra pixel width 
        //in case of half-integer cursor pos
        var clearance = cursorLineWidth/2 + 1;
        ctx.clearRect(
            x-clearance, 
            y-clearance, 
            (blockDimension+gridPixels)*this.length+2*clearance, 
            (blockDimension+gridPixels)+2*clearance
        );
    }
}

ui_canvas.addEventListener("mousedown", function(e) {
    var x = e.clientX;
    var y = e.clientY;
    var boundary = this.getBoundingClientRect();
    cursor.clear(ui_ctx);   //clear old cursor
    var c = x2c(x);
    var r = y2r(y);
    findCursorStart(r,c);
    cursor.c_old = cursor.c;    //record start of this block
    findCursorLength();
    cursor.dragging = (gridShade[r][c] == 1); 
    cursor.dragLimitLow = cursor.c - findSpaceToLeft(); //no further left
    cursor.dragLimitHigh = cursor.c + findSpaceToRight(); //no further right
    ui_ctx.save();
    ui_ctx.strokeStyle = 'rgb(0,100,100)';
    ui_ctx.lineWidth = cursorLineWidth;
    cursor.draw(ui_ctx);
    ctx.restore();
});

ui_canvas.addEventListener("mouseout", function(e) {
    cursor.dragging = false;
    cursor.draw(ui_ctx);
});

ui_canvas.addEventListener("mouseup", function(e) {
    if (!cursor.dragging) {
        return;
    }
    cursor.dragging = false;
    for (var i=0; i<cursor.length; i++) {
        gridShade[cursor.r][cursor.c_old+i] = 0;
    }
    for (var i=0; i<cursor.length; i++) {
        gridShade[cursor.r][cursor.c+i] = 1;
    }
    clearShadedCellRow(cursor.r);
    drawShadedCellRow(cursor.r);
    computeColumnBlocks();
    showColumnBlocks();
});

ui_canvas.addEventListener("mousemove", function(e) {
    if (cursor.dragging) {
        var x = e.clientX;
        var y = e.clientY;
        var boundary = this.getBoundingClientRect();
        cursor.clear(ui_ctx);   //clear old cursor
        var c = x2c(x);
        //Allow block drag, but avoid adjacent blocks
        cursor.c = Math.min(
            cursor.dragLimitHigh, Math.max(cursor.dragLimitLow, c));
        //cursor.r is fixed. Makes no sense to drag up/down
        //var r = y2r(y);
        ui_ctx.save();
        ui_ctx.strokeStyle = 'rgb(150,0,0)';
        ui_ctx.lineWidth = cursorLineWidth;
        cursor.draw(ui_ctx);
        ui_ctx.restore();
    }
});

function x2c(x) {
    //Convert window (x,-) to grid (-,column).
    var canvas_boundary = ui_canvas.getBoundingClientRect();
    var column = Math.floor
        ((x-canvas_boundary.left)/(blockDimension+gridPixels));
    return column;
}

function y2r(y) {
    //Convert window (-,y) to grid (row, -).
    var canvas_boundary = ui_canvas.getBoundingClientRect();
    var row = Math.floor
        ((y-canvas_boundary.top)/(blockDimension+gridPixels));
    return row;
}
    
function findCursorStart(r,c) {
    var current_column = c;
    cursor.r = r;

    var test = gridShade[1][2];
    if (current_column==0) { 
        cursor.c = current_column;
        return;
    }
    if (gridShade[cursor.r][current_column] == 0) {
        //we aren't on a shaded cell
        cursor.c = current_column;
    } else {
        while (current_column>0) {
            if (gridShade[cursor.r][current_column-1] == 1) {
                current_column -= 1;
                if (current_column==0) {
                    cursor.c = current_column;
                    break;
                }
            } else {
                cursor.c = current_column;
                break;
            }
        }
    }
}

function findCursorLength() {
    //Assumes cursor is placed at block start (per findCursorStart)
    if (gridShade[cursor.r][cursor.c] == 0) {
        cursor.length = 1; //Just whitespace, not a block
        return;
    }

    var cl = 0;
    var column_to_test = cursor.c;
    do {
        if (gridShade[cursor.r][column_to_test] == 1) {
            cl++;
            column_to_test++;
        } else break;
    } while (column_to_test<25);
    cursor.length = cl;
    return;
}

function findSpaceToLeft() {
    //Should the cursor be dragging a block, how many spaces are to its left
    var free_to_left = 0;
    if (cursor.dragging) {
        var test_column = cursor.c-1;
        while (test_column>=1) {
            var one_left = gridShade[cursor.r][test_column];
            var two_left = gridShade[cursor.r][test_column-1];
            if (one_left == 0 && two_left ==0) {
                free_to_left++;
            } else {
                break;
            }
            test_column--;
        }
        if (test_column==0) {
            if (gridShade[cursor.r][test_column]==0) {
                free_to_left++;
            }
        }
    } 
    return free_to_left;
}

function findSpaceToRight() {
    //Should the cursor be dragging a block, how many spaces are to its right
    var free_to_right = 0;
    if (cursor.dragging) {
        var test_column = cursor.c+cursor.length;
        while (test_column<24) {
            var one_right = gridShade[cursor.r][test_column];
            var two_right = gridShade[cursor.r][test_column+1];
            if (one_right == 0 && two_right ==0) {
                free_to_right++;
            } else {
                break;
            }
            test_column++;
        }
        if (test_column==24) {
            if (gridShade[cursor.r][test_column]==0) {
                free_to_right++;
            }
        }
    }
    return free_to_right;
}

function drawConstrainedCells() {
    //The problem gives certain cells as definitely shaded.
    //Specify them here as (r,c) pairs
    var constrained = [
        [3,3],
        [3,4],
        [3,12],
        [3,13],
        [3,21],
        [8,6],
        [8,7],
        [8,10],
        [8,14],
        [8,15],
        [8,18],
        [16,6],
        [16,11],
        [16,16],
        [16,20],
        [21,3],
        [21,4],
        [21,9],
        [21,10],
        [21,15],
        [21,20],
        [21,21]
    ];
    canvas = document.getElementById('layer-bg-grid');
    assert(canvas.width==pixelWidth,"Canvas has wrong width");
    assert(canvas.height==pixelWidth, "Canvas has wrong height");
    if (canvas.getContext) {
        ctx = canvas.getContext('2d');
        var r=0; //row
        var c=0; //column
        for (i=0; i<constrained.length;i++) {
            var cell = constrained[i];
            r = cell[0];
            c = cell[1];
            var x = 0.5+(blockDimension+gridPixels)*c+4; //top left x-co-ord
            var y = 0.5+(blockDimension+gridPixels)*r+4; //top left y-co-ord
            ctx.fillRect(
                x, y, 
                (blockDimension+gridPixels)-8,
                (blockDimension+gridPixels)-8
            );
        }
    }
}
 
function loadBlockData() {
    //Load the initial sequence of horizontal consecutive squares
    //Place the blocks hard to the left, with an empty square between each.

    var blockLength = 0; //length of consecutive shaded squares   
    var initialData = [
        [7,3,1,1,7],
        [1,1,2,2,1,1],
        [1,3,1,3,1,1,3,1],
        [1,3,1,1,6,1,3,1],
        [1,3,1,5,2,1,3,1],
        [1,1,2,1,1],
        [7,1,1,1,1,1,7],
        [3,3],
        [1,2,3,1,1,3,1,1,2],
        [1,1,3,2,1,1],
        [4,1,4,2,1,2],
        [1,1,1,1,1,4,1,3],
        [2,1,1,1,2,5],
        [3,2,2,6,3,1],
        [1,9,1,1,2,1],
        [2,1,2,2,3,1],
        [3,1,1,1,1,5,1],
        [1,2,2,5],
        [7,1,2,1,1,1,3],
        [1,1,2,1,2,2,1],
        [1,3,1,4,5,1],
        [1,3,1,3,10,2],
        [1,3,1,1,6,6],
        [1,1,2,1,1,2],
        [7,2,1,2,5]
    ];

    for (var i=0; i<initialData.length; i++) {
        var rowData = initialData[i];
        gridShade[i] = [];
        var track_column = 0; //track cumulative position as building up row
        for (var j=0; j<rowData.length; j++) {
            blockLength = rowData[j];
            for (var k=0; k<blockLength; k++) {
                gridShade[i][track_column+k] = 1;   //shade
            } 
            gridShade[i][track_column+blockLength] = 0;  //whitespace after block
            track_column += blockLength+1;
        }
        for (var k=track_column; k<gridSize; k++) {
            gridShade[i][k] = 0;    //whitespace to end of row
        }
    }
    for (var i=initialData.length; i<gridSize; i++) {
        gridShade[i] = [];
        for (var k=0; k<gridSize; k++) {
            gridShade[i][k] = 0;    //whitespace remaining rows
        }
    }

    //console.log(JSON.stringify(gridShade));
}

function drawGrid() {
    canvas = document.getElementById('layer-bg-grid');
    assert(canvas.width==pixelWidth,"Canvas has wrong width");
    assert(canvas.height==pixelWidth, "Canvas has wrong height");
    if (canvas.getContext) {
        ctx = canvas.getContext('2d');

        ctx.beginPath();
        for (var vline=0; vline<=gridSize; vline++) {
            ctx.moveTo(0.5+vline*(blockDimension+1), 0);
            ctx.lineTo(0.5+vline*(blockDimension+1), pixelWidth);
        }
        for (var hline=0; hline<=gridSize; hline++) {
            ctx.moveTo(0, 0.5+hline*(blockDimension+1));
            ctx.lineTo(pixelWidth, 0.5+hline*(blockDimension+1));
        }
        ctx.stroke();
    }
}

function drawShadedCellRow(r) {
    canvas = document.getElementById('layer-blocks');
    assert(canvas.width==pixelWidth,"Canvas has wrong width");
    assert(canvas.height==pixelWidth, "Canvas has wrong height");

    if (canvas.getContext) {
        ctx = canvas.getContext('2d');
        ctx.save();
        ctx.fillStyle = 'rgba(200,0,200,0.5)';
        for (var j=0; j<gridSize; j++) {
            if (gridShade[r][j]==1) {
                fillSquareAtRC(ctx, r, j);
            }
        }
        ctx.restore();
    }
}

function clearShadedCellRow(r) {
    canvas = document.getElementById('layer-blocks');
    assert(canvas.width==pixelWidth,"Canvas has wrong width");
    assert(canvas.height==pixelWidth, "Canvas has wrong height");

    if (canvas.getContext) {
        ctx = canvas.getContext('2d');
        for (var j=0; j<gridSize; j++) {
            clearSquareAtRC(ctx, r, j);
        }
    }
}

function drawShadedCells() {
    //using gridShade array, draw the pattern of squares, thus showing blocks

    canvas = document.getElementById('layer-blocks');
    assert(canvas.width==pixelWidth,"Canvas has wrong width");
    assert(canvas.height==pixelWidth, "Canvas has wrong height");

    if (canvas.getContext) {
        ctx = canvas.getContext('2d');
        ctx.save();
        ctx.fillStyle = 'rgba(200,0,200,0.5)';
        for (var i=0; i<gridSize; i++) {
            for (var j=0; j<gridSize; j++) {
                //console.log(i,j,gridShade[i][j]);
                if (gridShade[i][j]==1) {
                    fillSquareAtRC(ctx, i, j);
                }
            }
        }
        ctx.restore();
    }
}

function computeColumnBlocks() {
    // i iterates over columns, j over rows.
    // Cf. gridShade[r][c]
    for (var i=0; i<gridSize; i++) {
        columnData[i] = [];
        var count = 0;
        for(var j=0; j<gridSize; j++) {
            if (gridShade[j][i] == 1) {
                count++;
                if (j==gridSize-1) {
                    columnData[i].push(count);
                }
            } else if (count>0) {
                columnData[i].push(count);
                count = 0;
            }
        }
    }
}              

function showColumnBlocks() {
    canvas = document.getElementById('column-data');
    if (canvas.getContext) {
        ctx = canvas.getContext('2d');
        ctx.save();
        ctx.clearRect(0,0,ui_canvas.width, 240);
        for (var i=0; i<gridSize; i++) {
            var aColumn = columnData[i];
            for (var j=0; j<aColumn.length; j++) {
                ctx.font = "10px sans-serif";
                ctx.fillText(
                    aColumn[j],
                    i*(blockDimension+gridPixels)+6,
                    j*(blockDimension+gridPixels)+20
                );
            }
        } 
        ctx.restore();
    }
}
