import * as d3 from "d3";
import { bigMoneyFormat, shortenText } from "./src/utils.js";

export function lineChart({
  svg,
  data,
  width = 1000,
  height = 800,
  margin = { top: 30, right: 120, bottom: 50, left: 40 },
}) {
  // setup the viewBox and font for the SVG
  svg.attr("viewBox", [0, 0, width, height]).style("font", "10px sans-serif");

  // define an attribute for y-axis
  let attributeY = []
  for (const movie of data) {
    attributeY.push(movie.totalGross);
  }

  // define an attribute for x axis
  let attributeX = [];
  for (const movie of data) {
    attributeX.push(movie.day);
  }

  // define scale for the number of days on the x-axis
  const scaleX = d3.scaleLinear()
      .domain(d3.extent(attributeX))
      .range([margin.left, width - margin.right]);

  const xAxis = d3.axisBottom().scale(scaleX).ticks(5 );


  // define scale for total weekly gross on the y-axis
  const scaleY = d3.scaleLinear()
      .domain(d3.extent(attributeY))
      .range([height - margin.top, margin.bottom]);


  const yAxis = d3.axisLeft().scale(scaleY).tickFormat(domain => { return bigMoneyFormat(domain); });

  // group the data by movie title
  const movies = d3
    .groups(data, (d) => d.title)
    .map(([key, values]) => ({ key, values }));

  console.log(movies);

  // draw the x-axis
  svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(xAxis);

  // put the text label for x axis
  svg.append("text")
      .attr("class", "x-axis-label")
      .text("Days since Release")
      .attr("x", width / 2)
      .attr("y", height - margin.bottom + 40)
      .style("fill", "gray")
      .style("font-size", 15);


  // draw the y-axis
  svg.append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left}, ${margin.bottom - 70})`)
      .call(yAxis);

  // put the text label for y axis
  svg.append("text")
      .attr("class", "y-axis-label")
      .text("Total Gross")
      .attr("transform", `rotate(90), translate(700, 700)`)
      .style("fill", "gray")
      .style("font-size", 15);

  // color scale by movie title
  let movieTitles = movies.map((title) => { return title.key; });
  const color = d3.scaleOrdinal()
      .domain(movieTitles)
      .range(["#23171b","#4a58dd","#2f9df5","#27d7c4","#4df884","#95fb51","#dedd32","#ffa423","#f65f18","#ba2208","#900c00"]);

  // draw a line for each time series as well as labels

  // setup a group node for each time series
  const series = svg
    .append("g")
    .style("font", "bold 10px sans-serif")
    .selectAll("g")
    .data(movies)
    .join("g");

  // define line generator
  const line = d3.line()
      .x(data => scaleX(data.day))
      .y(data => scaleY(data.totalGross));

  // add the line as a path element
  series.each(function() {
        d3.select(this)
            .append("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", (data) => { return color(data.key); })
            .attr("stroke-width", 2)
            .attr("d", (data) => { return  line(data.values); });
      });

  // add labels for the series
  series.each(function () {
    d3.select(this)
        .append("text")
        .attr("class", "movie-label")
        .text( data => { return shortenText(data.key); })
        .attr("fill", (data) => { return color(data.key); })
        .attr("x" ,() => { return scaleX(d3.max(scaleX.domain())); })
        .attr("y", (data) => { return scaleY(); })
  })

  //TODO: align paths with axes
  //TODO: position labels correctly


  // Optional brushing task start here

  // Uncomment this part below to start your brushing task
  // Hint: this will create the total gross difference label (by default, the last data point) above your movie title label

  /**
  series
    .append("text")
    .classed("totalGrossDiff", true)
    .datum((d) => ({
      key: d.key,
      value: d.values[d.values.length - 1][attributeY],
    }))
    .attr("fill", "none")
    .attr("stroke-width", 1)
    .attr("x", scaleX.range()[1] + 3)
    .attr("y", (d) => scaleY(d.value) - 15)
    .attr("dy", "0.35em")
    .text((d) => bigMoneyFormat(d.value))
    .attr("fill", (d) => color(d.key))
   *
   */


  // Define the brush
  // const linechartBrush =

  // Call the brush


  function brushed(brushEvent) {
    const selection = brushEvent.selection;

    // Map container for the total gross difference label for each movie
    const updateLabel = new Map();

    if (selection) {
      // find the brush point on the x-axis at the beginning and end of the brush
      // const minX =
      // const maxX =

      // find the line for all movie
      const lines = series.selectAll("path");

      // find the point on the line for each movie at the beginning and end of the brush

      // use interpolateLine function to find the totalGrosss values for each movie at both brush points

      // find the total gross difference between the beginning and end of the brush

      // update the total gross difference label for each movie


      if (updateLabel.size > 0) {
        series
          .selectAll("text.totalGrossDiff")
          .text((d) => bigMoneyFormat(updateLabel.get(d.key)))
          .attr("fill", (d) => color(d.key))
      }
    }

  }

  function interpolateLine(moviesLine, i, brushPointX) {
    if (moviesLine == undefined || i == undefined || brushPointX == undefined) {
      return 0;
    }

    else if (attributeX in moviesLine[i] && attributeY in moviesLine[i] &&
      typeof moviesLine[i][attributeX] == "number" && typeof moviesLine[i][attributeY] == "number") {
      const a = [moviesLine[i][attributeX], moviesLine[i][attributeY]];

      let b;
      if (moviesLine[i + 1] == undefined || moviesLine[i + 1][attributeX] == undefined || moviesLine[i + 1][attributeY] == undefined) {
        b = [moviesLine[moviesLine.length - 1][attributeX], moviesLine[moviesLine.length - 1][attributeY]];
      } else {
        b = [moviesLine[i + 1][attributeX], moviesLine[i + 1][attributeY]];
      }

      if (a[0] == b[0] && b[1] == a[1]) {
        return b[1];
      }

      const m = (b[1] - a[1]) / (b[0] - a[0]);
      return m * (brushPointX - a[0]) + a[1];
    }
    return 0;
  }



}
