import * as d3 from "d3";
import { bigMoneyFormat, shortenText } from "./src/utils.js";

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

  // define a scale for the depth of the hierarchy
  const paddingInner = 20;
  const paddingOuter = 10;
  const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => (start + i).toString());

  const scaleY = d3.scaleBand()
      .domain(range(1, maxDepth))
      .range([0, height])
      .paddingInner(paddingInner)
      .paddingOuter(paddingOuter)


  // setup the viewBox and font for the SVG
  svg.attr("viewBox", [0, 0, width, height]).attr("font-family", "sans-serif");

  // setup a group node for each node in the hierarchy
  const node = svg
    .selectAll("g")
    .data(root.descendants().filter((d) => d.depth > 0))
    .join("g")
    .attr("transform", (d) => `translate(${scaleY((d.depth).toString())},${d.x0})`);

  svg.selectAll("rect")
      .data(root.descendants)
      .enter()
      .append("rect")
      .attr("class", "icicle-rect")
      .style("fill", "#BBB")
      .attr("x", data => { return data.x0; } )
      .attr("y", data => { return data.y0; })


  const minFontSize = 6;

  // helper function to compute font size according to the size of the rectangle
  function fontSize(d) {
    return Math.min(12, Math.max(minFontSize, d.x1 - d.x0 - 2));
  }

  // setup text labels for each node
  // const text =

  // create text labels for each node


  return svg.node();
}
