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
  const timeFormat = d3.timeFormat("%H:%M");
  const timeFormatSecond = d3.timeFormat("%H:%M:%S");
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
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data.map((d) => d.time)))
    .range([0, this.innerWidth])
    .nice();
  this.fig
    .append("g")
    .attr("transform", `translate(0, ${this.innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(9).tickFormat(timeFormat));
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
    .text("全时段全区域车流量")
    .attr("text-anchor", "start");

  //////////
  // CHART //
  //////////
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
  this.fig
    .append("g")
    .attr("id", "areaChart")
    .selectAll("layers")
    .data(stackedData)
    .join("path")
    .attr("class", (d) => "sum_area " + d.key)
    .style("fill", (d) => color(d.key))
    .attr("d", area);

  //////////
  // BRUSH //
  //////////
  const brushed = function ({ selection }) {
    if (selection === null) return;
    const [time0, time1] = selection.map(xScale.invert);
    // 显示时间条
    time_rect_start.attr("x", xScale(time0) - 30).attr("opacity", 1);
    time_rect_end.attr("x", xScale(time1) - 30).attr("opacity", 1);
    time_text_start.attr("x", xScale(time0)).text(timeFormatSecond(time0));
    time_text_end.attr("x", xScale(time1)).text(timeFormatSecond(time1));
    // 时间戳设定为第一帧
    ts0 = Math.floor(time0.getTime() / 1000);
    ts1 = Math.floor(time1.getTime() / 1000);
    fetch(`http://127.0.0.1:5100/get_data_by_ts?ts=${ts0}`)
      .then((response) => response.json())
      .then((data) => mainfig.renderObject(data));

    ats0 = Math.floor(ts0 / 60) * 60;
    ats1 = Math.ceil(ts1 / 60) * 60;
    fetch(
      `http://127.0.0.1:5100/get_heatmap_data_by_ts?ts0=${ats0}&ts1=${ats1}`
    )
      .then((response) => response.json())
      .then((data) => {
        heatfig.update(data);
      });
    queuefig.update({start:ts0,end:ts1})
    // // 读取一段时间的数据，用于进行统计热力图、拥堵图、排队图
    // ts_start = Math.floor(time0.getTime() / 1000);
    // ts_end = Math.floor(time1.getTime() / 1000);
    // fetch(
    //   `http://127.0.0.1:5100/get_pos_data_by_two_ts?ts0=${ts_start}&ts1=${ts_end}`
    // )
    //   .then((response) => response.json())
    //   .then((posData) => heatfig.update(posData));
  };

  var brusher = d3
    .brushX()
    .extent([
      [0, 0],
      [this.innerWidth, this.innerHeight],
    ])
    .on("end", brushed);

  this.fig.append("g").attr("id", "brushgroup").call(brusher);

  //////////
  // CURSOR Line //
  //////////
  var cursor_line = this.fig
    .append("line")
    .attr("class", "cursor_line")
    .attr("y1", 0)
    .attr("y2", this.innerHeight + 20)
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .style("stroke-dasharray", "1, 5")
    .style("display", "none");

  var time_rect_start = this.fig
    .append("rect")
    .attr("class", "time_rect")
    .attr("x", 0)
    .attr("y", this.innerHeight + 25 - 5)
    .attr("rx", 5)
    .attr("ry", 5)
    .attr("width", 60)
    .attr("height", 20)
    .attr("fill", "grey")
    .attr("opacity", 0);

  var time_rect_end = this.fig
    .append("rect")
    .attr("class", "time_rect")
    .attr("x", 0)
    .attr("y", this.innerHeight + 25 - 5)
    .attr("rx", 5)
    .attr("ry", 5)
    .attr("width", 60)
    .attr("height", 20)
    .attr("fill", "grey")
    .attr("opacity", 0);

  var time_text_start = this.fig
    .append("text")
    .attr("class", "time_text")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "hanging")
    .attr("x", 0)
    .attr("y", this.innerHeight + 25)
    .attr("font-size", 15);

  var time_text_end = this.fig
    .append("text")
    .attr("class", "time_text")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "hanging")
    .attr("x", 0)
    .attr("y", this.innerHeight + 25)
    .attr("font-size", 15);

  var time_rect_line = this.fig
    .append("rect")
    .attr("class", "time_rect_line")
    .attr("x", 0)
    .attr("y", this.innerHeight + 25 - 5)
    .attr("rx", 5)
    .attr("ry", 5)
    .attr("width", 60)
    .attr("height", 20)
    .attr("fill", "lightgrey")
    .attr("opacity", 0);

  var time_text_line = this.fig
    .append("text")
    .attr("class", "time_text_line")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "hanging")
    .attr("x", 0)
    .attr("y", this.innerHeight + 25)
    .attr("font-size", 15);

  this.fig.on("mousemove", () => {
    mouseX = d3.pointer(event)[0];
    if (mouseX < 0) return;
    cur_time = xScale.invert(mouseX);
    cursor_line.attr("x1", mouseX).attr("x2", mouseX).style("display", "block");
    time_rect_line.attr("x", mouseX - 30).attr("opacity", 1);
    time_text_line.attr("x", mouseX).text(timeFormatSecond(cur_time));
  });

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
    .style("fill", (d) => color(d))
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
    .style("fill", (d) => color(d))
    .text((d) => d)
    .attr("font-size", size)
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle")
    .on("mouseover", highlight)
    .on("mouseleave", noHighlight);
};
