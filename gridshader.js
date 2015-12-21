var blockDimension = 20;    //square blocks size dimension
var gridSize = 25;          //number of blocks across and down in grid
var gridPixels = 1;         //pixel width of gridlines
// pixelWidth - linear number of pixels required to render grid
var pixelWidth = blockDimension*gridSize+gridPixels*(gridSize+1);
var gridShade = []; //[row,column] shading data

function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion Failure";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message;
    }
}

function init() {
    loadBlockData();
    drawGrid();
}

function loadBlockData() {
    //Load the initial sequence of horizontal consecutive squares
    //Place the blocks hard to the left, with an empty square between each.
   
    var initialData = [
        [7,3,1,1,7],
        [1,1,2,2,1,1]
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
            gridShade[i][blockLength] = 0;  //whitespace
            track_column += blockLength+1;
            for (var k=track_column; k<gridSize; k++) {
                gridShade[i][k] = 0;    //whitespace to end of row
            }
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
