import * as d3 from "d3";
import {bigMoneyFormat, shortenText} from "./src/utils.js";

export function icicle({
  svg,
  data,
  height = 1000,
  width = 600,
  color
}) {
  // define a hierarchy for the data
  const root = d3.hierarchy(data).sum(entry => entry.revenue);

  // define a partition layout as the root of the hierarchy
  const partitionLayout = d3.partition().size([width, height]);
  partitionLayout(root);

  // setup the viewBox and font for the SVG
  svg.attr("viewBox", [0, 0, width - 30, height - 30]).attr("font-family", "sans-serif");

  // setup a group node for each node in the hierarchy
  const node = svg
    .selectAll("g")
    .data(root.descendants().filter((d) => d.depth > 0))
    .join("g")
    .attr("transform", (d) => `translate(${d.y0 - 250}, ${d.x0})`);

  const getTopMostParent = (d) => {
    const ancestors = d.ancestors();
    const topMostParent = ancestors[ancestors.length - 2].data;
    return topMostParent;
  }

  node.each(function () {
    d3.select(this)
        .append("rect")
        .attr("class", "icicle-rect")
        .style("fill", data => { return color(getTopMostParent(data)); })
        .attr("width", data => { return data.y1 - data.y0 - 1})
        .attr("height", data => { return data.x1 - data.x0 - Math.min(1, (data.x1 - data.x0)); })
  });

  const minFontSize = 6;

  // helper function to compute font size according to the size of the rectangle
  function fontSize(d) {
    return Math.min(10, Math.max(minFontSize, d.x1 - d.x0 - 4));
  }

  // setup text labels for each node
  const text = (data) => {
    let movieTitle;
    let movieRevenue;
    data.data.name ? movieTitle = shortenText(data.data.name, 20) : movieTitle = shortenText(data.data.title, 10);
    movieRevenue = bigMoneyFormat(data.value);

    return `${movieTitle}: ${movieRevenue}`
  }

  const translation = (d, i, nodes) => {
    const fontSize = parseFloat(d3.select(nodes[i]).style("font-size"));
    const translateY = fontSize * 0.9;
    return `translate(5, ${translateY})`;
  }

  // create text labels for each node
  node.each(function() {
    d3.select(this)
        .append("text")
        .attr("class", "cell-title")
        .text(data => { return text(data); })
        .attr("font-size", data => { return fontSize(data); })

    const rect = d3.select(this).select("rect");
    const textElement = d3.select(this).select("text");

    const rectHeight = rect.attr("height");
    const textHeight = textElement.attr("font-size");

    if (rectHeight < textHeight) {
      d3.select(this).select("text").classed("hidden", true).classed("cell-title", false);
    }
  });

  const allTextElements = d3.selectAll("text.cell-title");

  allTextElements.each(function () {
    d3.select(this)
        .attr("transform", translation)
  });

  return svg.node();
}
