import * as d3 from "d3";
import {bigMoneyFormat} from "./src/utils.js";

export function icicle({
  svg,
  data,
  height = 1000,
  width = 600,
  color
}) {

  // define a hierarchy for the data
  const root = d3.hierarchy(data).sum(entry => entry.revenue);
  console.log(root)

  // define a partition layout as the root of the hierarchy
  const partitionLayout = d3.partition().size([width, height]);
  partitionLayout(root);

  // compute the maximum depth of hierarchy from the root node
  const maxDepth = d3.max(root.descendants(), (descendant) => { return descendant.depth; });
  console.log(maxDepth)

  // define a scale for the depth of the hierarchy
  /*const paddingInner = 20;
  const paddingOuter = 10;
  const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => (start + i).toString());

  const scaleY = d3.scaleBand()
      .domain(range(1, maxDepth))
      .range([30, height - 30])
      .paddingInner(paddingInner)
      .paddingOuter(paddingOuter)*/


  // setup the viewBox and font for the SVG
  svg.attr("viewBox", [0, 0, width - 30, height - 30]).attr("font-family", "sans-serif");

  // setup a group node for each node in the hierarchy
  const node = svg
    .selectAll("g")
    .data(root.descendants().filter((d) => d.depth > 0))
    .join("g")
    .attr("transform", (d) => `translate(${d.y0 - 250}, ${d.x0})`);

  node.each(function () {
    d3.select(this)
        .append("rect")
        .attr("class", "icicle-rect")
        .style("fill", data => { return color(data.data.name); })
        .attr("width", data => { return data.y1 - data.y0 - 1})
        .attr("height", data => { return data.x1 - data.x0 - Math.min(1, (data.x1 - data.x0)); })
  })


  const minFontSize = 6;

  // helper function to compute font size according to the size of the rectangle
  function fontSize(d) {
    return Math.min(10, Math.max(minFontSize, d.x1 - d.x0 - 4));
  }

  // setup text labels for each node
  const text = (data) => {
    let movieTitle;
    let movieRevenue;
    data.data.name ? movieTitle = data.data.name : movieTitle = data.data.title;
    movieRevenue = bigMoneyFormat(data.value);

    return `${movieTitle}: ${movieRevenue}`
  }


  // create text labels for each node
      node.each(function() {
        d3.select(this)
            .append("text")
            .attr("class", "cell-title")
            .attr("transform", "translate(5, 9)")
            .text(data => { return text(data); })
            .attr("font-size", data => { return fontSize(data); })
      })


  return svg.node();
}
