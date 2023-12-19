function QueueFig(pos, size) {
  this.x = pos.x;
  this.y = pos.y;
  this.margin = { top: 20, right: 20, bottom: 20, left: 30 };
  this.outerWidth = size.width;
  this.outerHeight = size.height;
  this.innerWidth = size.width - this.margin.left - this.margin.right;
  this.innerHeight = size.height - this.margin.top - this.margin.bottom;
  this.time_interval = 10;

  this.fig = d3
    .select("#mainsvg")
    .append("svg")
    .attr("id", "queuefig")
    .attr("x", this.x)
    .attr("y", this.y)
    .attr("width", this.outerWidth)
    .attr("height", this.outerHeight);

  this.bound = this.fig
    .append("rect")
    .attr("fill-opacity", 0)
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 2.5)
    .attr("stroke", "black")
    .attr("width", this.outerWidth)
    .attr("height", this.outerHeight);

  this.svg = this.fig
    .append("g")
    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
}

QueueFig.prototype.show = function (data) {
  console.log(this.selected_Lanes);
  console.log(data);

  let svg = this.svg;
  this.data = data;

  const keys = ["left", "right", "down", "up"];
  const aggregatedData = {};

  for (const crossing in data) {
    aggregatedData[crossing] = {};
    keys.forEach((key) => {
      aggregatedData[crossing][key] = 0; // 使用默认值 0
    });

    for (const direction in data[crossing]) {
      for (const timestamp in data[crossing][direction]) {
        aggregatedData[crossing][direction] = Math.max(
          aggregatedData[crossing][direction],
          (data[crossing][direction][timestamp].stop_num * this.time_interval) /
            60
        );
      }
    }
  }

  const processedData = Object.keys(aggregatedData).map((crossing) => {
    return { crossing, ...aggregatedData[crossing] };
  });
  console.log(processedData);

  this.stack = d3.stack().keys(keys);
  const stackedData = this.stack(processedData);
  console.log(stackedData);

  this.xScale = d3
    .scaleBand()
    .domain(processedData.map((d) => d.crossing))
    .range([0, this.innerWidth])
    .padding(0.1);

  this.yScale = d3
    .scaleLinear()
    .domain([0, d3.max(stackedData, (d) => d3.max(d, (d) => d[1]))])
    .range([this.innerHeight, 0]);

  this.colorScale = d3
    .scaleOrdinal(d3.schemeCategory10) // 使用 D3 的一个内置颜色方案
    .domain(["up", "left", "right", "down"]);

  svg
    .selectAll(".stack_rect")
    .data(stackedData)
    .enter()
    .append("g")
    .attr("class", "stack_rect")
    .attr("fill", (d) => this.colorScale(d.key)) // 根据方位选择颜色
    .selectAll("rect")
    .data((d) => d)
    .enter()
    .append("rect")
    .attr("x", (d) => this.xScale(d.data.crossing))
    .attr("y", (d) => this.yScale(d[1]))
    .attr("height", (d) => this.yScale(d[0]) - this.yScale(d[1]))
    .attr("width", this.xScale.bandwidth())
    .on("mouseover", (event, d) => {
      console.log(d);
      tooltip.style("opacity", 1);
      tooltip
        .html("<p>" + `累计排队${Math.floor(d[1] - d[0])}分钟` + "</p>")
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", (event, d) => {
      tooltip
        .style("opacity", 0)
        .style("left", event.pageX + 1000 + "px")
        .style("top", event.pageY + "px");
    });

  const xAxis = d3.axisBottom(this.xScale);

  svg
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", `translate(0, ${this.innerHeight})`)
    .call(xAxis)
    .selectAll("text")
    .style("font-size", "6px");

  const yAxis = d3.axisLeft(this.yScale);

  svg
    .append("g")
    .attr("class", "yAxis")
    .call(yAxis)
    .selectAll("text")
    .style("font-size", "6px");

  svg
    .append("text")
    .attr("x", this.innerWidth / 2)
    .attr("y", 0 - this.margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "8px")
    .text("路口停车时间堆叠柱状图");

  svg
    .append("text")
    .attr("x", this.innerWidth + this.margin.right / 2 - 2)
    .attr("y", this.innerHeight + this.margin.bottom / 2 + 3)
    .style("text-anchor", "middle")
    .style("font-size", "6px")
    .text("路口编号");

  svg
    .append("text")
    .attr("y", 0 - this.margin.top / 2)
    .attr("x", 0)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "6px")
    .text("累计排队时间/min");

  const labels = {
    up: "北",
    down: "南",
    left: "西",
    right: "东",
  };

  const legend = this.svg
    .selectAll(".legend")
    .data(this.colorScale.domain())
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(0,${i * 7 - 15})`);

  legend
    .append("rect")
    .attr("x", this.innerWidth - 8)
    .attr("width", 8)
    .attr("height", 4)
    .style("fill", this.colorScale);

  legend
    .append("text")
    .attr("x", this.innerWidth - 12)
    .attr("y", 2)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .style("font-size", "6px") // 设置字体大小
    .text((d) => labels[d]);
};

QueueFig.prototype.update = function (time) {
  let s = time.start;
  let e = time.end;
  s = Math.floor(s / 10) * 10;
  e = Math.floor(e / 10) * 10;
  console.log([s, e]);

  let data = this.data;
  let interval = this.time_interval;

  const keys = ["left", "right", "down", "up"];
  const aggregatedData = {};
  for (cross in data) {
    aggregatedData[cross] = {};
    keys.forEach((key) => {
      aggregatedData[cross][key] = 0; // 使用默认值 0
    });
    for (direction in data[cross]) {
      let temp = data[cross][direction];
      console.log(temp);
      for (s; s < e; s = s + interval) {
        if (s in temp) break;
      }
      for (e; e > s; e = e - interval) {
        if (e in temp) break;
      }
      if (s > e) console.log("Error for selecting time.");
      console.log([s, e]);
      console.log(temp[e]);
      aggregatedData[cross][direction] =
        (this.time_interval / 60) * (temp[e]["stop_num"] - temp[s]["stop_num"]);
    }
  }
  console.log(aggregatedData);

  const processedData = Object.keys(aggregatedData).map((cross) => {
    return { cross, ...aggregatedData[cross] };
  });
  console.log(processedData);

  const stackedData = this.stack(processedData);
  console.log(stackedData);

  // resize the Y axis
  this.yScale = d3
    .scaleLinear()
    .domain([0, d3.max(stackedData, (d) => d3.max(d, (d) => d[1]))])
    .range([this.innerHeight, 0]);

  const yAxis = d3.axisLeft(this.yScale);

  this.svg.selectAll(".yAxis").remove();

  this.svg
    .append("g")
    .attr("class", "yAxis")
    .call(yAxis)
    .selectAll("text")
    .style("font-size", "6px");

  this.svg.selectAll(".stack_rect").remove();

  this.svg
    .selectAll(".stack_rect")
    .data(stackedData)
    .enter()
    .append("g")
    .attr("class", "stack_rect")
    .attr("fill", (d) => this.colorScale(d.key)) // 根据方位选择颜色
    .selectAll("rect")
    .data((d) => d)
    .enter()
    .append("rect")
    .attr("x", (d) => this.xScale(d.data.cross))
    .attr("y", (d) => this.yScale(d[1]))
    .attr("height", (d) => this.yScale(d[0]) - this.yScale(d[1]))
    .attr("width", this.xScale.bandwidth())
    .on("mouseover", (event, d) => {
      console.log(d);
      tooltip.style("opacity", 1);
      tooltip
        .html("<p>" + `累计排队${Math.floor(d[1] - d[0])}分钟` + "</p>")
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", (event, d) => {
      tooltip
        .style("opacity", 0)
        .style("left", event.pageX + 1000 + "px")
        .style("top", event.pageY + "px");
    });
};
