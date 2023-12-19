function HeatFig(pos, size) {
  var self = this;
  this.x = pos.x;
  this.y = pos.y;
  this.margin = { top: 5, right: 0, bottom: 0, left: 5 };
  this.outerWidth = size.width;
  this.outerHeight = size.height;
  this.innerWidth = size.width - this.margin.left - this.margin.right;
  this.innerHeight = size.height - this.margin.top - this.margin.bottom;
  this.gridSize = 3;

  this.svg = d3
    .select("#mainsvg")
    .append("svg")
    .attr("id", "heatmap")
    .attr("x", this.x)
    .attr("y", this.y)
    .attr("width", this.outerWidth)
    .attr("height", this.outerHeight)
    .append("g")
    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
  this.datagroup = this.svg.append("g").attr("id", "datagroup");
  this.gradientGroup = this.svg.append("g").attr("id", "gradientGroup");

  this.bound = this.svg
    .append("rect")
    .attr("fill-opacity", 0)
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 2.5)
    .attr("stroke", "black")
    .attr("width", this.innerWidth)
    .attr("height", this.innerHeight);

  this.renderMap = function (mapData) {
    bound_data = mapData[0];
    cross_walk_data = mapData[1];
    laneroad_data = mapData[2];
    signalroad_data = mapData[3];
    stoplinear_data = mapData[4];

    let map_group = this.svg.append("g").attr("id", "map_group");
    let path = d3.geoPath().projection(this.projection);

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
  };

  // 绘制数据函数
  // 遍历每个时间戳的数据
  this.plot = function (data) {
    data.forEach((d) => {
      proj = self.projection([d.x, d.y]);
      d.x = proj[0];
      d.y = proj[1];
    });

    data.forEach((d, i) => {
      // 为每个点创建一个径向渐变
      const gradient = self.gradientGroup
        .append("defs")
        .append("radialGradient")
        .attr("id", "gradient" + i)
        .attr("class", "gradient");

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "red")
        .attr("stop-opacity", (0.9 * d.v) / d3.max(data, (d) => d.v)); //point.value/d3.max(points, d => d.value)
      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "red")
        .attr("stop-opacity", 0);

      // 绘制使用渐变的圆
      self.datagroup
        .append("circle")
        .attr("class", "heat_point")
        .attr("cx", d.x)
        .attr("cy", d.y)
        .attr("r", 3.5) // 半径，可以根据需要调整
        .style("fill", "url(#gradient" + i + ")");
    });
  };
}

HeatFig.prototype.show = function (data, mapData) {
  // 计算投影
  this.projection = d3
    .geoIdentity()
    .fitSize([this.innerWidth, this.innerHeight], mapData[0]);
  // 渲染地图
  this.renderMap(mapData);
  // 绘制数据
  this.plot(data);
};

HeatFig.prototype.update = function (data) {
  // 清除已有数据
  this.datagroup.selectAll(".heat_point").remove();
  this.gradientGroup.selectAll(".gradient").remove();
  // 绘制新数据
  this.plot(data);
};
