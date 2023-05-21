import * as d3 from "d3";

let years = new Set();
let filteredDataset = [];

const colourScheme = ["#23171b","#4860e6","#2aabee","#2ee5ae","#6afd6a","#c0ee3d","#feb927","#fe6e1a","#c2270a","#900c00"]

const colours = d3.scaleOrdinal()
    .domain(years)
    .range(colourScheme);

let newColourScheme = [];
for (const colour of colourScheme) {
    newColourScheme.push(d3.rgb(colour).darker(0.5).toString());
}

const darkerColours = d3.scaleOrdinal()
    .domain(years)
    .range(newColourScheme);

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

            scatterPlot(d[0], d[1], cell, svg, grid_width, grid_height, margin);

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
function scatterPlot(labelX, labelY, scatterplotCell, svg, width, height, margin) {
    readFile.then(() => {
        // empty arrays for values
        let xValues = [];
        let yValues = [];

        // fill x and y values into arrays
        for (const entry of filteredDataset) {
            xValues.push(entry[`${labelX}`]);
            yValues.push(entry[`${labelY}`]);
        }

        // scale x axis
        let xScaling = d3.scaleLinear()
            .domain(d3.extent(xValues))
            .range([0, width - margin.right - 10]);

        let xAxis = d3.axisBottom().scale(xScaling).ticks(7);

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

        let yAxis = d3.axisLeft().scale(yScaling).ticks(7);

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
                .attr("class", "data-point")
                .attr("cx", (data) => { return xScaling(data[`${labelX}`]) + margin.left; })
                .attr("cy", (data) => { return yScaling(data[`${labelY}`]); })
                .attr("r", 2)
                .style("fill", (data) => { return colours(data.year); });


        const brush = d3.brush()
            .extent([
                [margin.left, margin.top],
                [width, height - margin.bottom]
            ])
            .on("start", brushStarted)
            .on("brush", brushed)
            .on("end", brushEnded)

        scatterplotCell.call(brush);


        // Clear the previously-active brush, if any.
        let brushCell;
        function brushStarted() {
            if (brushCell !== this) {
                d3.select(brushCell).call(brush.move, null);
                brushCell = this;
            }
        }

        function brushed(brushEvent) {
            const selection = brushEvent.selection;
            const allCircles = d3.selectAll("circle");

            allCircles.style("fill", function (data) {
                const cx = xScaling(data[`${labelX}`]) + margin.left;
                const cy = yScaling(data[`${labelY}`]);
                return isInsideBrush(selection, cx, cy) ? colours(data.year) : darkerColours(data.year);
            });

            allCircles.style("r", function (data) {
                const cx = xScaling(data[`${labelX}`]) + margin.left;
                const cy = yScaling(data[`${labelY}`]);
                return isInsideBrush(selection, cx, cy) ? 2 : 0.5;
            });

        }

        function brushEnded(brushEvent) {
            const selection = brushEvent.selection;
            const allCircles = d3.selectAll("circle");

            if (selection) return;
            allCircles.style("fill", (data) => {
                const cx = xScaling(data[`${labelX}`]) + margin.left;
                const cy = yScaling(data[`${labelY}`]);
                return isInsideBrush(selection, cx, cy) ? darkerColours(data.year) : colours(data.year);
            });

            allCircles.style("r", (data) => {
                const cx = xScaling(data[`${labelX}`]) + margin.left;
                const cy = yScaling(data[`${labelY}`]);
                return isInsideBrush(selection, cx, cy) ? 0.5 : 2;
            });
        }

        // A function that return TRUE or FALSE according if a dot is in the selection or not
        function isInsideBrush(brush_coords, cx, cy) {
            if (brush_coords)
                return brush_coords[0][0] <= cx &&
                    cx <= brush_coords[1][0] &&
                    brush_coords[0][1] <= cy &&
                    cy <= brush_coords[1][1];    // This return TRUE or FALSE depending on if the points
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
   readFile.then(() => {
       // creates new svg for parallel coordinates plot
       const parallelCoordinatesPlot = parent.append("svg")
           .attr("id", "parallel-coordinates-plot")
           .attr("viewBox", [0, 0, width, height])

       // creates array of objects, where each numerical attribute (y-axis) receives a scale
       // {bpm: scale function, energy: scale function, duration: scale function}
       let yAxesScaling = {};
       for (const attribute of numericalAttributes) {
           yAxesScaling[attribute] = d3.scaleLinear()
               .domain(d3.extent(filteredDataset.map(line => line[`${attribute}`])))
               .range([height - margin.top, margin.bottom]);
       }

       // scale x-axis so that the three y-axes are distributed along it
       let xScaling = d3.scalePoint()
           .range([margin.left, width - margin.right])
           .domain(numericalAttributes);

       // maps x and y coordinates for each attribute
       const drawPath = (data) => {
           return d3.line()(numericalAttributes.map((attribute) => {
               return [xScaling(attribute),                 // retrieves x-coordinate for line start from x-scaling
               yAxesScaling[attribute](data[attribute])];   // retrieves y-coordinate for line start from y-scaling
           }))
       };

       // draws y_axes with the respective label
       parallelCoordinatesPlot.selectAll("y-axes")
           .data(numericalAttributes)
           .enter()
           .append("g")
            .attr("class", (data) => { return `y-axis`; })
            .attr("transform", (data) => { return `translate (${xScaling(data)}, 0)`; })
            .each(function (data) { d3.select(this).call(d3.axisLeft().scale(yAxesScaling[data])); })
           .append("text")
            .attr("class", (data) => { return `y-label-${data}`; })
            .attr("y", height - margin.bottom + 15)
            .text((data) => { return data; })
            .style("text-anchor", "middle")
            .style("fill", "black");

       // draws lines/paths for each line in the JSON array
       parallelCoordinatesPlot.selectAll("data-paths")
           .data(filteredDataset)
           .enter()
           .append("path")
           .attr("d", drawPath)
           .style("fill", "none")
           .style("stroke", (data) => { return colours(data.year); })
           .style("opacity", 0.4);

       const axes = parallelCoordinatesPlot.selectAll("g.y-axis")

       const brushWidth = 10;
       const brush = d3.brushY()
           .extent([
               [-brushWidth / 2, margin.top],
               [brushWidth / 2, height - margin.bottom]
           ])
           .on("start brush end", brushed);
       axes.call(brush);


       function brushed({selection}, key) {
           let selections = new Map();
           if (selection === null) {
               selections.delete(key);
           } else {
               selections.set(key, selection.map(yAxesScaling[key].invert));
           }

           parallelCoordinatesPlot.selectAll("path")
               .each(function (data) {
                   console.log(data)
                   if (data === null) return;
                   const selected = Array.from(selections).every(([key, [max, min]]) => data[key] >= min && data[key] <= max);
                   d3.select(this).style("opacity", selected ? 0.4 : 0.1);
                   if (selected) {
                       d3.select(this).raise();
                   }
               });
       }
   })
}


