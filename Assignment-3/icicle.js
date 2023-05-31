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

  // compute the maximum depth of hierarchy from the root node
  const maxDepth = d3.max(root.descendants(), (descendant) => { return descendant.depth; });

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
    data.data.name ? movieTitle = shortenText(data.data.name, ) : movieTitle = shortenText(data.data.title, );
    movieRevenue = bigMoneyFormat(data.value);

    return `${movieTitle}: ${movieRevenue}`
  }

  const translation = (d, i, nodes) => {
    const fontSize = parseFloat(d3.select(nodes[i]).style("font-size"));
    const translateY = fontSize * 0.9;
    return 'translate(5,' + translateY + ')';
  }

  const fitsRectangle = (d, i, nodes) => {
    const textHeight = parseFloat(d3.select(nodes[i]).style("font-size")) * 1.2 +
        parseFloat(d3.select(nodes[i]).style("font-size")) * 0.9;
    const rectHeight = d.y1 - d.y0;
    return rectHeight < textHeight;
  }

  // create text labels for each node
  node.each(function() {
    d3.select(this)
        .append("text")
        .attr("class", "cell-title")
        //.classed("hidden", fitsRectangle)
        .text(data => { return text(data); })
        .attr("font-size", data => { return fontSize(data); })

    const rect = d3.select(this).select("rect");
    const textElement = d3.select(this).select("text");
    const rectHeight = rect.attr("height");
    const textHeight = textElement.attr("font-size");
    console.log(`Rect height: ${rectHeight}, text height: ${textHeight}`)

    if (rectHeight < textHeight) {
      d3.select(this).select("text").classed("hidden", true).classed("cell-title", false);
    }

  })

  const allTextElements = d3.selectAll("text.cell-title");
  const allRectangles = d3.selectAll("rect.icicle-rect");

  allTextElements.each(function () {
    d3.select(this)
        .attr("transform", translation)
        .classed("hidden", fitsRectangle)
  })

  return svg.node();
}
