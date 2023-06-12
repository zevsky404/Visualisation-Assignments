import * as d3 from "d3";
import { bigMoneyFormat, shortenText } from "./src/utils.js";
import {stratify, treemapDice, treemapSlice, treemapSliceDice} from "d3";

export function treemap({
  svg,
  data,
  width = 1000,
  height = 600,
  color,
}) {
  svg.attr("viewBox", [0, 0, width, height]).style("font", "10px sans-serif");
  svg.selectAll("*").remove();

  // Task 3: prepare the treemap using d3.treemap and d3.hierarchy with the
  // Slice and Dice tiling algorithm.


  // INSERT YOUR CODE HERE
  const root = d3.hierarchy(data)
      .sum(entry => entry.revenue)
      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

  const treemap = d3.treemap()
      .size([width, height])
      .padding(3)
      .tile(treemapSliceDice)
      (root);

  // END OF YOUR CODE

  draw();

  // Finish the draw function. You can take inspiration (and code) from
  // the given icicles implementation for both the rectangles and the labels.
  function draw() {
    // simple check if we have a root variable; return without drawing if not
    if (typeof (root) === "undefined") return;

    // create a group for each leaf node
    const node = svg
        .selectAll("g")
        .data(root.leaves())
        .join("g")
        //.attr("transform", (d) => `translate(${d.y0}, ${d.x0})`);

    const getTopMostParent = (d) => {
      const ancestors = d.ancestors();
      const topMostParent = ancestors[ancestors.length - 2].data;
      return topMostParent;
    }

    // actually draw the rectangles
    node.each(function () {
      d3.select(this)
          .append("rect")
          .attr("class", "treemap-rect")
          .style("fill", data => { return color(getTopMostParent(data)); })
          .attr("x", d => { return d.x0; })
          .attr("y", d => { return d.y0; })
          .attr("width", data => { return data.x1 - data.x0})
          .attr("height", data => { return data.y1 - data.y0; })

    });


    // setup labels for rectangles that are big enough
    const text = (data) => {
      let movieTitle;
      let movieRevenue;
      data.data.name ? movieTitle = shortenText(data.data.name, 30) : movieTitle = shortenText(data.data.title, 15);
      movieRevenue = bigMoneyFormat(data.value);

      return `${movieTitle}: \n ${movieRevenue}`
    }

    // add the name and the value as labels
    node.each(function() {
      d3.select(this)
          .append("text")
          .attr("class", "cell-title")
          .text(data => { return text(data); })
          .attr("font-size", data => { return fontSize(data); })
          .attr("x", d => { return d.x1; })
          .attr("y", d => { return d.y0; });

      const rect = d3.select(this).select("rect");
      const textElement = d3.select(this).select("text");

      const rectHeight = rect.attr("height");
      const rectWidth = rect.attr("width");
      const textWidth = textElement.node().getComputedTextLength();
      const textHeight = textElement.attr("font-size") * 0.9;

      if (rectHeight < textHeight) {
        d3.select(this).select("text").classed("hidden", true).classed("cell-title", false);
      }

      /*if (rectWidth < textWidth) {
        d3.select(this).select("text").classed("hidden", true).classed("cell-title", false);
      }*/

  });

    const translation = (d, i, nodes) => {
      const fontSize = parseFloat(d3.select(nodes[i]).style("font-size"));
      const translateY = fontSize * 0.9;
      return `translate(5, ${translateY}), rotate(-90, ${d.x0}, ${d.y0})`;
    }

    const allTextElements = d3.selectAll("text.cell-title");

    allTextElements.each(function () {
      d3.select(this)
          .attr("transform", translation)
    });
}

// naive function to heuristically determine font size based on the rectangle size
  function fontSize(d) {
    return Math.min(12, Math.max(8, d.x1 - d.x0 - 4));
  }
}

