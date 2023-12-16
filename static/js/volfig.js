function VolumeFig(pos, size) {
  this.x = pos.x;
  this.y = pos.y;
  this.margin = { top: 50, right: 30, bottom: 50, left: 40 };
  this.outerWidth = size.width;
  this.outerHeight = size.height;
  this.innerWidth = size.width - this.margin.left - this.margin.right;
  this.innerHeight = size.height - this.margin.top - this.margin.bottom;

  this.fig = d3
    .select("#mainsvg")
    .append("svg")
    .attr("id", "volfig")
    .attr("x", this.x)
    .attr("y", this.y)
    .attr("width", this.outerWidth)
    .attr("height", this.outerHeight)
    .append("g")
    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
}

VolumeFig.prototype.show = function (types, data) {
  data.forEach((d) => {
    d.time = new Date(d.time * 1000);
  });

  // color palette
  const color = d3
    .scaleOrdinal()
    .domain(types)
    .range(["#FA8828", "#419BB0", "#9FC131", "#a65628", "#984ea3", "#fe8de5"]);
  //stack the data?
  const stackedData = d3.stack().keys(types)(data);

  //////////
  // AXIS //
  //////////

  // X-axis and label
  const timeFormat = d3.timeFormat("%H:%M");
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data.map((d) => d.time)))
    .range([0, this.innerWidth])
    .nice();
  const xAxis = this.fig
    .append("g")
    .attr("transform", `translate(0, ${this.innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(18).tickFormat(timeFormat));
  this.fig
    .append("text")
    .attr("text-anchor", "end")
    .attr("x", this.innerWidth)
    .attr("y", this.innerHeight + 40)
    .text("时间");

  // Y-axis and label
  const yScale = d3
    .scaleLinear()
    .domain([0, 3500])
    .range([this.innerHeight, 0])
    .nice();
  this.fig.append("g").call(d3.axisLeft(yScale).ticks(7));
  this.fig
    .append("text")
    .attr("text-anchor", "end")
    .attr("x", 0)
    .attr("y", -20)
    .text("车流量")
    .attr("text-anchor", "start");

  //////////
  // BRUSHING AND CHART //
  //////////

  // Add a clipPath: everything out of this area won't be drawn.
  const clip = this.fig
    .append("defs")
    .append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", this.innerWidth)
    .attr("height", this.innerHeight)
    .attr("x", 0)
    .attr("y", 0);

  // Add brushing
  const brush = d3
    .brushX() // Add the brush feature using the d3.brush function
    .extent([
      [0, 0],
      [this.innerWidth, this.innerHeight],
    ]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
    .on("end", updateChart); // Each time the brush selection changes, trigger the 'updateChart' function

  // Create the scatter variable: where both the circles and the brush take place
  const areaChart = this.fig.append("g").attr("clip-path", "url(#clip)");

  // Area generator
  const area = d3
    .area()
    .x(function (d) {
      return xScale(d.data.time);
    })
    .y0(function (d) {
      return yScale(d[0]);
    })
    .y1(function (d) {
      return yScale(d[1]);
    });

  // Show the areas
  areaChart
    .selectAll("mylayers")
    .data(stackedData)
    .join("path")
    .attr("class", function (d) {
      return "sum_area " + d.key;
    })
    .style("fill", function (d) {
      return color(d.key);
    })
    .attr("d", area);

  // Add the brushing
  areaChart.append("g").attr("class", "brush").call(brush);

  let idleTimeout;
  function idled() {
    idleTimeout = null;
  }

  // A function that update the chart for given boundaries
  function updateChart(event, d) {
    extent = event.selection;

    // If no selection, back to initial coordinate. Otherwise, update X axis domain
    if (!extent) {
      if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350)); // This allows to wait a little bit
      xScale.domain(
        d3.extent(data, function (d) {
          return d.time;
        })
      );
    } else {
      xScale.domain([xScale.invert(extent[0]), xScale.invert(extent[1])]);
      areaChart.select(".brush").call(brush.move, null); // This remove the grey brush area as soon as the selection has been done
    }

    // Update axis and area position
    xAxis
      .transition()
      .duration(1000)
      .call(d3.axisBottom(xScale).ticks(18).tickFormat(timeFormat));
    areaChart.selectAll("path").transition().duration(1000).attr("d", area);
  }

  //////////
  // HIGHLIGHT GROUP //
  //////////

  const highlight = function (event, d) {
    d3.selectAll(".sum_area").style("opacity", 0.2);
    d3.select("." + d).style("opacity", 1);
  };

  const noHighlight = function (event, d) {
    d3.selectAll(".sum_area").style("opacity", 1);
  };

  //////////
  // LEGEND //
  //////////

  const size = 7;
  this.fig
    .selectAll("sum_legend_rect")
    .data(types)
    .join("rect")
    .attr("x", this.innerWidth - 50)
    .attr("y", function (d, i) {
      return -10 + i * (size + 5);
    }) // 100 is where the first dot appears. 25 is the distance between dots
    .attr("width", size * 2)
    .attr("height", size)
    .style("fill", function (d) {
      return color(d);
    })
    .on("mouseover", highlight)
    .on("mouseleave", noHighlight);

  this.fig
    .selectAll("sum_legend_text")
    .data(types)
    .join("text")
    .attr("x", this.innerWidth - 50 + size * 2.2)
    .attr("y", function (d, i) {
      return -10 + i * (size + 5) + size / 2;
    }) // 100 is where the first dot appears. 25 is the distance between dots
    .style("fill", function (d) {
      return color(d);
    })
    .text(function (d) {
      return d;
    })
    .attr("font-size", size)
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle")
    .on("mouseover", highlight)
    .on("mouseleave", noHighlight);
};
