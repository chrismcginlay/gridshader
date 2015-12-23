var blockDimension = 20;    //square blocks size dimension
var gridSize = 25;          //number of blocks across and down in grid
var gridPixels = 1;         //pixel width of gridlines
// pixelWidth - linear number of pixels required to render grid
var pixelWidth = blockDimension*gridSize+gridPixels*(gridSize+1);
var gridShade = []; //[row,column] shading data
var ui_canvas = document.getElementById('layer-ui');
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

function init() {
    loadBlockData();
    drawGrid();
    drawShadedCells();
    cursor.draw(ui_ctx);
}

var cursor = {
    r: 0,
    c: 0,
    length: 1,
    colour: 'blue',
    draw: function(ctx) {
        var x = 0.5+(blockDimension+gridPixels)*this.c; //top left x-co-ord
        var y = 0.5+(blockDimension+gridPixels)*this.r; //top left y-co-ord
        ctx.save();
        ctx.strokeStyle = 'rgb(0,100,100)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, blockDimension*this.length+1, blockDimension+1);
        ctx.restore();
    }
}

ui_canvas.addEventListener("click", function(e) {
    var x = e.clientX;
    var y = e.clientY;
    var boundary = this.getBoundingClientRect();
    cursor.c = (x-boundary.left)/(blockDimension+gridPixels);
    cursor.r = (y-boundary.top)/(blockDimension+gridPixels);
    cursor.draw(ui_ctx);
});

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
