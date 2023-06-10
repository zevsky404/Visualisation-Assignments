import * as d3 from "d3";
import cloud from "d3-cloud";
import {transition} from "d3";

/* Function to draw a word cloud
 * svg: d3 selection of an svg element
 * wordsPerGenre: Map of form {group =>  [[word, frequency], [word, frequency], ...], ...}
 * selection: d3 selection of select element
 */
export function wordcloud({ svg, wordsPerGroup, selection }) {
  console.log(wordsPerGroup.get("Crime")[9]);
  console.log(selection.node().options)
  const width = 800;
  const height = 400;
  svg.attr("viewBox", [0, 0, width, height]);

  // group element, translated such that the origin is in the middle of the svg
  const g = svg
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // word size scale, you can play around with the range if you like
  const size = d3.scaleLinear()
      .range([10, 55]);

  // fill the select box with the options from the wordsPerGroup
  selection
    .selectAll("option")
    .data(Array.from(wordsPerGroup.keys()))
    .join("option")
    .text((d) => d);

  // start of TODO: create the layout of the word cloud with
  // d3-cloud. The function you need has been imported for you
  // as "cloud()". Note, that the actual words will be
  // determined in the "update()"-function below.
  // The layout should call the "draw()"-function on "end".

  const colourRange = d3.interpolateRgb("rgb(180, 180, 180)", "rgb(0, 140, 199)");
  const colour = d3.scaleSequential(colourRange);

  const layout = cloud()
      .size([width, height])
      .padding(4)
      //.on("end", draw)

  // end of TODO
  update();
  selection.on("change", update);


  function update() {
    // get the option of the select box
    const group = selection.property("value");

    // get the 100 most frequent words of the selected group
    const words = wordsPerGroup.get(group).slice(0, 100);
    //console.log(words)

    //adjust the domain of the word size scale
    size.domain(d3.extent(words, (d) => d[1]));
    colour.domain(d3.extent(words, (d) => d[1]));
    // start of TODO: adjust the layout accordingly
    // call the layout with the words -> layout.words(....)

    layout
        .words(words)
        .rotate(() => { return ~~(Math.random() * 2) * 90; })
        .fontSize(d => { return size(d[1]); })
        .on("end", draw);
    // end of TODO
    layout.start(); // then call layout.start() to start the layout

  }

  // complete the draw function to draw the word cloud
  function draw(words) {
    console.log(words)
    // start of TODO: create the word cloud
    g.selectAll("text")
        .data(words)
        .join("text")
          .attr("class", "wordcloud-word")
          .text(d => { return d[0]; })
          .style("font-size", d => { return `${size(d[1])}px`; })
          .style("fill", d => { return `${colour(d[1])}`; })
          .attr("text-anchor", "middle")
          .attr("font-family", "Bebas Neue")
          .attr("transform", d => { return `translate(${[d.x, d.y]}), rotate(${d.rotate})`; })

    // end of TODO
  }
}
