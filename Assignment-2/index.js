import * as d3 from "d3";
//import numerics from "numerics";

// cyclic access: let colour = colours[(i % colours.length + colours.length) % colours.length];
let years = new Set();
let filteredDataset = [];
const colours = d3.scaleOrdinal()
    .domain(years)
    .range(["#23171b","#4860e6","#2aabee","#2ee5ae","#6afd6a","#c0ee3d","#feb927","#fe6e1a","#c2270a","#900c00"]);

// Task 1 your solution here
let readFile = d3.csv("Spotify_Music_Data.csv").then((response) => {
    return response;
    });


readFile.then((content) => {
    for (const entry of content) {
        years.add(entry.year);
    }
    for (const entry of content) {
        filteredDataset.push({"title":entry.title, "year":entry.year, "bpm":entry["tempo (bpm)"],
            "energy":entry.energy, "duration":entry["duration (s)"]});
    }
});


// Parent HTML element that contains the labels and the plots
const parent = d3.select("div#visualization");
const drawArea = d3.select("svg#draw-area");


// Sizes of the plots
const width = 800;
const height = 800;

// Set of selected items within the brush
const selectedItems = new Set();

createLabel();
createScatterPlotMatrix(width, height);
createHorizontalParallelCoordinates(width, height / 2);



/**
 * Task 2
 */
function createLabel() {
    const xValue = 800;
    readFile.then(() => {
        let test = drawArea.selectAll("colour-dots")
            .data(years)
            .enter()
            .append("circle")
            .attr("cx", xValue)
            .attr("cy", (d, i) => { return 100 + i * 25; })
            .attr("r", 7)
            .style("fill", (d) => { return colours(d); });

        console.log("Elements in the enter selection: " + test.nodes().length);

        drawArea.selectAll("labels")
            .data(years)
            .enter()
            .append("text")
            .attr("x", xValue + 20)
            .attr("y", (d, i) => { return 100 + i * 25; })
            .style("fill", (d) => { return colours(d); })
            .text((d) => { return d; })
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle");
    })
}


/**
 * Create Scatter Plot Matrix with the given width and height. The contents of each cell
 * in this matrix is defined by the scatterPlot() function.
 *
 * @param {number} width
 * @param {number} height
 */
function createScatterPlotMatrix(width, height) {

    const margin = { top: 10, left: 20, bottom: 20, right: 10 };

    const grid_height = height / numerics.length;
    const grid_width = width / numerics.length;
    const fontSize = 10;

    const svg = parent.append("svg")
        .attr("viewBox", [0, 0, width, height]);

    const scatterplot_matrix = svg.selectAll("g.scatterplot")
        .data(d3.cross(numerics, numerics))
        .join("g")
        .attr("transform", (d, i) => "translate(" + (i % numerics.length) * grid_width + "," + Math.floor(i / numerics.length) * grid_height + ")");

    scatterplot_matrix.each(function (d) { // each pair from cross combination
        const g = d3.select(this);

        scatterPlot(d[0], d[1], g, grid_width, grid_height, margin);


        const labelXPosition = (grid_width - margin.right - margin.left) / 2 + margin.left;
        const labelYPosition = 10;

        // label the same attribute axis
        if (d[0] === d[1]) {
            g.append("text")
                .text(d[0])
                .attr("transform", "translate(" + labelXPosition + "," + labelYPosition + ")")
                .style("text-anchor", "middle")
                .style("fill", "black")
                .style("font-size", fontSize);

        }
    })
}


/**
 * Task 3
 * @param {string} labelX
 * @param {string} labelY
 * @param {nodeElement} scatterplotCell
 * @param {number} width
 * @param {number} height
 * @param {Object} margin
 */
function scatterPlot(labelX, labelY, scatterplotCell, width, height, margin) {

    // Add your solution here

    const brush = d3.brush()
        .extent([
            [margin.left, margin.top],
            [axisYwidth, axisXheight]
        ])
        .on("end", brushed); // for simplifiying the matter we do it only at the end.

    scatterplotCell.call(brush);


    function brushed(brushEvent) {

        const selection = brushEvent.selection
        const scatterPLotD3 = d3.select(this) //  this always refers to the current plot


        // Add solution here

    }

    // A function that return TRUE or FALSE according if a dot is in the selection or not
    function isInsideBrush(brush_coords, cx, cy) {
        if (brush_coords)
            return brush_coords[0][0] <= cx && cx <= brush_coords[1][0] && brush_coords[0][1] <= cy && cy <= brush_coords[1][1];    // This return TRUE or FALSE depending on if the points
        else
            return false;
    }

}


/**
 * Task4
 * @param {number} width
 * @param {number} height
 */

function createHorizontalParallelCoordinates(width, height) {

    // Add your solution here


    const brushWidth = 10;
    const brush = d3.brushY()
        .extent([
            [-brushWidth / 2, margin.top],
            [brushWidth / 2, height - margin.bottom]
        ])
        .on("end", brushed);
    axes.call(brush);



    function brushed(brushEvent, key) {

        const selection = brushEvent.selection
        const attributeName = key[0]

        // Add your code here


    }
}


