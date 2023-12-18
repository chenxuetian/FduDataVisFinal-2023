function HeatFig(pos, size) {
  var self = this;
  this.x = pos.x;
  this.y = pos.y;
  this.margin = { top: 0, right: 0, bottom: 0, left: 0 };
  this.outerWidth = size.width;
  this.outerHeight = size.height;
  this.innerWidth = size.width - this.margin.left - this.margin.right;
  this.innerHeight = size.height - this.margin.top - this.margin.bottom;

  this.bg_svg = d3
    .select("#mainsvg")
    .append("svg")
    .attr("id", "heatmap")
    .attr("x", this.x)
    .attr("y", this.y)
    .attr("width", this.outerWidth)
    .attr("height", this.outerHeight);
  this.svg = this.bg_svg.append("g");
  this.datagroup = this.svg.append("g").attr("id", "datagroup");
  this.gradientGroup = this.svg.append("g").attr("id", "gradientGroup");

  this.bound = this.svg
    .append("rect")
    .attr("fill-opacity", 0)
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 1)
    .attr("stroke", "black")
    .attr("width", this.outerWidth)
    .attr("height", this.innerHeight);

  // 绘制数据函数
  // 遍历每个时间戳的数据
  this.plot = function (posData) {
    let gridSize = this.gridSize;
    let aggregatedData = {};
    for (let timestamp in posData) {
      posData[timestamp].forEach((vehicle) => {
        if (vehicle.type in [1, 4, 5, 6]) {
          // points.push({
          //   x: self.projection([vehicle.position.x, vehicle.position.y])[0],
          //   y: self.projection([vehicle.position.x, vehicle.position.y])[1],
          // });
          let gridX = Math.floor(vehicle.position.x / gridSize) * gridSize;
          let gridY = Math.floor(vehicle.position.y / gridSize) * gridSize;
          let gridKey = `${gridX}_${gridY}`;

          // 聚合计数
          if (!aggregatedData[gridKey]) {
            aggregatedData[gridKey] = { count: 0, x: gridX, y: gridY };
          }
          aggregatedData[gridKey].count++;
        }
      });
    }

    let aggregatedArray = Object.values(aggregatedData);
    const points = aggregatedArray.map((d) => {
      return {
        x: self.projection([d.x, d.y])[0],
        y: self.projection([d.x, d.y])[1],
        value: d.count,
      };
    });

    points.forEach((point, index) => {
      // 为每个点创建一个径向渐变
      const gradient = self.gradientGroup
        .append("defs")
        .append("radialGradient")
        .attr("id", "gradient" + index)
        .attr("class", "gradient");

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "red")
        .attr(
          "stop-opacity",
          (0.9 * point.value) / d3.max(points, (d) => d.value)
        ); //point.value/d3.max(points, d => d.value)
      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "red")
        .attr("stop-opacity", 0);

      // 绘制使用渐变的圆
      self.datagroup
        .append("circle")
        .attr("class", "heat_point")
        .attr("cx", point.x)
        .attr("cy", point.y)
        .attr("r", 3.5) // 半径，可以根据需要调整
        .style("fill", "url(#gradient" + index + ")");
    });
    console.log(d3.max(points, (d) => d.value));
  };
}

HeatFig.prototype.show = function (data, mapData) {
  this.gridSize = 3;

  this.projection = d3
    .geoIdentity()
    .fitSize([this.outerWidth, this.outerHeight], mapData[0]);

  let projection = this.projection;

  function renderMap(svg, mapData, projection) {
    bound_data = mapData[0];
    cross_walk_data = mapData[1];
    laneroad_data = mapData[2];
    signalroad_data = mapData[3];
    stoplinear_data = mapData[4];

    let map_group = svg.append("g").attr("id", "map_group");
    let path = d3.geoPath().projection(projection);

    let bounds = bound_data.features;
    let crosswalks = cross_walk_data.features;
    let laneroads = laneroad_data.features;
    let signalroads = signalroad_data.features;
    let stoplinears = stoplinear_data.features;

    let boundMap = map_group
      .selectAll("bound")
      .data(bounds)
      .enter()
      .append("path")
      .attr("class", "bound")
      .attr("stroke", "#777777")
      .attr("stroke-width", 1)
      .attr("fill", "#FFFFFF")
      .attr("d", path);

    let crossWalkMap = map_group
      .selectAll("crosswalk")
      .data(crosswalks)
      .enter()
      .append("path")
      .attr("class", "crosswalk")
      .attr("stroke", "#CCCCCC")
      .attr("stroke-width", 1)
      .attr("fill", "#FFFFFF")
      .attr("d", path);

    let stopLinearMap = map_group
      .selectAll("stoplinear")
      .data(stoplinears)
      .enter()
      .append("path")
      .attr("class", "stoplinear")
      .attr("stroke", "#333333")
      .attr("stroke-width", 1)
      .attr("fill", "#FFFFFF")
      .attr("d", path);
  }

  renderMap(this.svg, mapData, projection);

  // 绘制数据
  this.plot(data);

  const legendWidth = 100; // 图例宽度
  const legendHeight = 10; // 图例高度
  const legendPosition = { x: 10, y: 20 }; // 图例位置

  const legendScale = d3
    .scaleLinear()
    .domain([0, 1]) // 代表最小和最大的热力值
    .range(["rgba(255, 0, 0, 0)", "rgba(255, 0, 0, 0.7)"]); // 与热力图的颜色和透明度相匹配

  // 创建线性渐变
  const linearGradient = this.svg
    .append("defs")
    .append("linearGradient")
    .attr("id", "legend-gradient");

  linearGradient
    .selectAll("stop")
    .data(legendScale.range())
    .enter()
    .append("stop")
    .attr("offset", (d, i) => i * 100 + "%")
    .attr("stop-color", (d) => d);

  // 绘制图例条
  this.svg
    .append("rect")
    .attr("x", legendPosition.x)
    .attr("y", legendPosition.y)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)")
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 0.5)
    .attr("stroke", "gray");

  // this.svg.append('text')
  //   .attr('x', legendPosition.x)
  //   .attr('y', legendPosition.y + legendHeight + 4)
  //   .text('0')
  //   .style("font-size", "5px");
};

HeatFig.prototype.update = function (data) {
  console.log("Start");
  // 清除已有数据
  console.log(this.svg.select("#datagroup").selectAll(".heat_point"));
  this.svg.select("#datagroup").selectAll(".heat_point").remove();
  this.svg.select("#gradientGroup").selectAll(".gradient").remove();
  // 绘制新数据
  this.plot(data);
  console.log("End");
};
