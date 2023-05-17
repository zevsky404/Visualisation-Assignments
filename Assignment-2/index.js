import * as d3 from "d3";
//import numerics from "numerics";

// cyclic access: let colour = colours[(i % colours.length + colours.length) % colours.length];
let years = new Set();
let filteredDataset = [];

const colours = d3.scaleOrdinal()
    .domain(years)
    .range(["#23171b","#4860e6","#2aabee","#2ee5ae","#6afd6a","#c0ee3d","#feb927","#fe6e1a","#c2270a","#900c00"]);

// Task 1 your solution here
// read in file
let readFile = d3.csv("Spotify_Music_Data.csv").then((response) => {
    return response;
    });


/**
 * filter dataset
 * years: set, receives all unique years from the dataset (2010 - 2019)
 * filteredDataset: array of JSONs, where each line is: {"title": title, "year": 201x, "bpm": 197, "energy": 5, "duration": 130}
 */
readFile.then((content) => {
    for (const entry of content) {
        years.add(entry.year);
    }
    for (const entry of content) {
        filteredDataset.push({"title":entry.title, "year":entry.year, "bpm":parseInt(entry["tempo (bpm)"]),
            "energy":parseInt(entry.energy), "duration":parseInt(entry["duration (s)"])});
    }
    filteredDataset.filter((value, index, array) => {
        if (array[index].bpm === 0 || array[index].energy === 0 || array[index].duration === 0) {
            array.splice(index, 1);
            return true;
        }
        return false;
    });
});


// Parent HTML element that contains the labels and the plots
// own svg for legend
const parent = d3.select("div#visualization");
const legendArea = d3.select("svg#draw-area");


// Sizes of the plots
const width = 800;
const height = 800;

const numericalAttributes = ["bpm", "energy", "duration"];
const margin = { top: 20, left: 30, bottom: 20, right: 30 };

// Set of selected items within the brush
const selectedItems = new Set();

createLabel();
createScatterPlotMatrix(width, height);
createHorizontalParallelCoordinates(width, height / 2);



/**
 * creates legend with a colour dot for each label using enter function
 */
function createLabel() {
    const xValue = 800;
    readFile.then(() => {
        legendArea.selectAll("colour-dots")
            .data(years)
            .enter()
            .append("circle")
                .attr("cx", xValue)
                .attr("cy", (d, i) => { return 100 + i * 25; })
                .attr("r", 7)
                .style("fill", (d) => { return colours(d); });

        legendArea.selectAll("labels")
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
    readFile.then(() => {
        const grid_height = height / numericalAttributes.length;
        const grid_width = width / numericalAttributes.length;
        const fontSize = 15;

        const svg = parent.append("svg")
            .attr("id", "scatter-plot")
            .attr("viewBox", [0, 0, width, height]);

        const scatterplot_matrix = svg.selectAll("g.scatterplot")
            .data(d3.cross(numericalAttributes, numericalAttributes))
            .join("g")
            .attr("transform", (d, i) => "translate(" + (i % numericalAttributes.length) * grid_width + "," + Math.floor(i / numericalAttributes.length) * grid_height + ")")
            .attr("class", "scatterplot-cell");


        scatterplot_matrix.each(function (d) { // each pair from cross combination
            const cell = d3.select(this);

            scatterPlot(d[0], d[1], cell, grid_width, grid_height, margin);

            const labelXPosition = (grid_width - margin.right - margin.left) / 2 + margin.left;
            const labelYPosition = 10;

            // label the same attribute axis
            if (d[0] === d[1]) {
                cell.append("text")
                    .text(d[0])
                        .attr("transform", "translate(" + labelXPosition + "," + labelYPosition + ")")
                        .attr("y", labelYPosition)
                        .style("text-anchor", "middle")
                        .style("fill", "black")
                        .style("font-size", fontSize);

            }
        })
    })
}


/**
 * creates a scatter plot in each cell
 * bpm x bpm, bpm x energy, bpm x duration
 * energy x bpm, energy x energy, energy x duration
 * duration x bpm, energy x duration, duration x duration
 * @param {string} labelX label for x-axis
 * @param {string} labelY label for y-axis
 * @param {nodeElement} scatterplotCell current cell in which plot is drawn
 * @param {number} width width of the cell
 * @param {number} height height of the cell
 * @param {Object} margin margin object, which stores all four margins (top, left, bottom, right)
 */
function scatterPlot(labelX, labelY, scatterplotCell, width, height, margin) {
    readFile.then(() => {
        // empty arrays for values
        let xValues = [];
        let yValues = [];

        // fill x and y values into arrays
        for (const entry of filteredDataset) {
            xValues.push(entry[`${labelX}`]);
        }

        for (const entry of filteredDataset) {
            yValues.push(entry[`${labelY}`]);
        }

        // scale x axis
        let xScaling = d3.scaleLinear()
            .domain(d3.extent(xValues))
            .range([0, width - margin.right - 10]);

        let xAxis = d3.axisBottom().scale(xScaling).ticks(7)

        // draw axis in scatter plot cell using that scaling
        scatterplotCell
            .append("g")
            .attr("class", `x-axis-${labelX}`)
            .attr("transform", `translate(${margin.left}, ${height - margin.bottom})`)
            .call(xAxis);

        // scale y axis
        let yScaling = d3.scaleLinear()
            .domain(d3.extent(yValues))
            .range([height - margin.bottom, margin.top]);

        let yAxis = d3.axisLeft().scale(yScaling).ticks(7)

        // draw axis in scatter plot cell using that scaling
        scatterplotCell
            .append("g")
            .attr("class", `y-axis-${labelY}`)
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(yAxis);

        scatterplotCell.selectAll("data-points")
            .data(filteredDataset)
            .enter()
            .append("circle")
                .attr("cx", (data) => { return xScaling(data[`${labelX}`]) + margin.left; })
                .attr("cy", (data) => { return yScaling(data[`${labelY}`]); })
                .attr("r", 2)
                .style("fill", (data) => {return colours(data.year)});



        const brush = d3.brush()
            .extent([
                [margin.left, margin.top],
                [axisYWidth, axisXHeight]
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
    })

}


/**
 * Task4
 * @param {number} width
 * @param {number} height
 */

function createHorizontalParallelCoordinates(width, height) {
    // creates new svg for parallel coordinates plot
    const svg = parent.append("svg")
        .attr("id", "parallel-coordinates-plot")
        .attr("viewBox", [0, 0, width, height])

    // creates object, where each numerical attribute (y-axis) receives a scale
    let yAxesScaling = {};
    for (const attribute of numericalAttributes) {
        const label = attribute;
        yAxesScaling[label] = d3.scaleLinear()
            .domain(d3.extent(filteredDataset[`${attribute}`]))
            .range([height, 0])
    }

    // scale x-axis so that the three y-axes are distributed along it
    let xScaling = d3.scalePoint()
        .range([0, width])
        .domain(numericalAttributes)


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


