function IdFig(pos, size) {
  var self = this;
  this.x = pos.x;
  this.y = pos.y;
  this.margin = { top: 25, right: 15, bottom: 25, left: 20 };
  this.outerWidth = size.width;
  this.outerHeight = size.height;
  this.innerWidth = size.width - this.margin.left - this.margin.right;
  this.innerHeight = size.height - this.margin.top - this.margin.bottom;

  this.idsvgPos = { x: 0, y: 0 };
  this.idsvgSize = {
    width: this.innerWidth,
    height: this.outerHeight / 3,
  };

  this.radioPos = { x: 0, y: this.outerHeight / 3 };
  this.radioSize = {
    width: this.innerWidth,
    height: this.outerHeight / 3,
  };

  this.histfigPos = { x: 0, y: (this.outerHeight * 2) / 3 };
  this.histfigSize = {
    width: this.innerWidth,
    height: this.outerHeight / 3,
  };

  this.CLUSTER_COLORS = {
    0: "#f58231", // 颜色1
    1: "#dcbeff", // 颜色2
    2: "#3cb44b",
  };

  // 个人页面主svg
  this.fig = d3
    .select("#mainsvg")
    .append("svg")
    .attr("id", "idfig")
    .attr("x", this.x)
    .attr("y", this.y)
    .attr("width", this.outerWidth)
    .attr("height", this.outerHeight);

  // id选择图svg
  this.idsvg = this.fig
    .append("svg")
    .attr("id", "idsvg")
    .attr("x", this.idsvgPos.x)
    .attr("y", this.idsvgPos.y)
    .attr("width", this.idsvgSize.width)
    .attr("height", this.idsvgSize.height);

  // 雷达图svg
  this.radiofig = this.fig
    .append("svg")
    .attr("id", "radiofig")
    .attr("x", this.radioPos.x)
    .attr("y", this.radioPos.y)
    .attr("width", this.radioSize.width)
    .attr("height", this.radioSize.height);

  // 直方图svg
  this.histfig = this.fig
    .append("svg")
    .attr("id", "histfig")
    .attr("x", this.histfigPos.x)
    .attr("y", this.histfigPos.y)
    .attr("width", this.histfigSize.width)
    .attr("height", this.histfigSize.height);

  this.dimensions = [
    "mean_velocity",
    "max_acceleration",
    "rapid_acceleration_count",
    "occupy_count",
    "overspeed_count",
    "consecutive_lane_changes_count",
  ];
  this.dimensionNames = {
    mean_velocity: "平均速度",
    max_acceleration: "最大加速度",
    rapid_acceleration_count: "急加速/急减速次数",
    occupy_count: "占道次数",
    overspeed_count: "超速次数",
    consecutive_lane_changes_count: "连续变道次数",
  };
}

IdFig.prototype.renderId = function (allData, id) {
  var self = this;
  const selected_item = allData.find((item) => item.id === id);
  self.idsvg.selectAll("*").remove();

  // 设置文本说明和对应的字段
  const texts = [
    { label: "平均速度", field: "mean_velocity" },
    { label: "最大加速度", field: "max_acceleration" },
    { label: "急加速/急减速次数", field: "rapid_acceleration_count" },
    { label: "占道次数", field: "occupy_count" },
    { label: "超速次数", field: "overspeed_count" },
    { label: "连续变道次数", field: "consecutive_lane_changes_count" },
  ];
  const groupWidth = self.idsvgSize.width * 0.45;
  const groupHeight = 50; // 可以根据需要调整

  texts.forEach((text, index) => {
    // 创建一个组 (g) 来放置说明和数值
    const group = self.idsvg
      .append("g")
      .attr(
        "transform",
        `translate(${(index % 2) * groupWidth}, ${
          Math.floor(index / 2) * groupHeight
        })`
      );

    // 添加说明文本
    group
      .append("text")
      .attr("x", 10) // 横坐标位置，可以根据需要调整
      .attr("y", 20) // 纵坐标位置
      .text(text.label);

    // 添加数值文本
    group
      .append("text")
      .attr("x", 10) // 横坐标位置，可以根据需要调整
      .attr("y", 40) // 纵坐标位置，略低于说明文本
      .text(parseFloat(selected_item[text.field]).toFixed(2)); // 保留两位小数
  });
};

IdFig.prototype.renderRadio = function (allData, id) {
  var self = this;
  const selected_item = [allData.find((item) => item.id === id)];
  const dimensions = Object.values(self.dimensionNames);
  const config = {
    margins: { top: 80, left: 80, bottom: 50, right: 80 },
    textColor: "black",
    title: "基本雷达图",
    radius: 70,
    animateDuration: 1000,
    tickNum: 5,
    axisfillColor: ["white", "#ddd"],
    axisStrokeColor: "#DDDDDD",
    pointsColor: "white",
    pointsSize: 3,
  };
  // 坐标尺

  self.scaleRadius = {};
  self.dimensions.forEach((d) => {
    self.scaleRadius[d] = {};
    Object.keys(TYPE).forEach((type) => {
      let minval = Math.min(
        d3.min(allData.filter((d) => +d.type === +type).map((e) => +e[d]))
      );
      let maxval = Math.max(
        d3.max(allData.filter((d) => +d.type === +type).map((e) => +e[d]))
      );
      self.scaleRadius[d][type] = d3
        .scaleLinear()
        .domain([0, 1.1 * maxval])
        .range([0, config.radius]);
    });
  });

  // 渲染坐标轴
  self.renderRadioAxes = function () {
    // ----渲染背景多边形-----
    const points = getPolygonPoints(
      dimensions.length,
      config.radius,
      config.tickNum
    );
    const axes = self.radiofig
      .append("g")
      .attr("class", "axes")
      .attr(
        "transform",
        "translate(" +
          self.radioSize.width / 2 +
          "," +
          self.radioSize.height / 2 +
          ")"
      )
      .selectAll("axis")
      .data(points);

    axes
      .enter()
      .append("polygon")
      .attr("class", "axis")
      .merge(axes)
      .attr("points", (d) => d)
      .attr("fill", (d, i) =>
        i % 2 === 0 ? config.axisfillColor[0] : config.axisfillColor[1]
      )
      .attr("stroke", config.axisStrokeColor);

    axes.exit().remove();

    // ----渲染对角线-----
    const line = d3.line();

    const outerPoints = getOuterPoints(points[0]);

    const lines = self.radiofig
      .select(".axes")
      .selectAll(".line")
      .data(outerPoints);

    lines
      .enter()
      .append("path")
      .attr("class", "line")
      .merge(lines)
      .attr("d", (d) => {
        return line([
          [0, 0],
          [d[0], d[1]],
        ]);
      })
      .attr("stroke", config.axisStrokeColor);

    lines.exit().remove();

    //生成背景多边形的顶点
    function getPolygonPoints(vertexNum, outerRadius, tickNum) {
      const points = [];
      let polygon;

      if (vertexNum < 3) return points;

      const anglePiece = (Math.PI * 2) / vertexNum;
      const radiusReduce = outerRadius / tickNum;

      for (let r = outerRadius; r > 0; r -= radiusReduce) {
        polygon = [];

        for (let i = 0; i < vertexNum; i++) {
          polygon.push(
            Math.sin(i * anglePiece) * r + "," + Math.cos(i * anglePiece) * r
          );
        }

        points.push(polygon.join(" "));
      }

      return points;
    }

    //得到最外层多边形的顶点
    function getOuterPoints(outerPoints) {
      const points = outerPoints.split(" ").map((d) => d.split(","));
      return points;
    }
  };

  // 渲染文本标签
  self.renderText = function () {
    const texts = self.radiofig
      .select(".axes")
      .selectAll(".label")
      .data(dimensions);

    texts
      .enter()
      .append("text")
      .attr("class", "label")
      .merge(texts)
      .attr(
        "x",
        (d, i) =>
          Math.sin((i * Math.PI * 2) / dimensions.length) * (config.radius + 20)
      )
      .attr(
        "y",
        (d, i) =>
          Math.cos((i * Math.PI * 2) / dimensions.length) * (config.radius + 20)
      )
      .attr("text-anchor", (d, i) => computeTextAnchor(dimensions, i))
      .attr("dy", 6.5) //由于text-anchor属性在垂向上对齐文字底部，故需要使其对齐文字中部
      .attr("font-size", "0.5em")
      .text((d) => d);

    function computeTextAnchor(data, i) {
      if (data.length < 3) return;

      const angle = (i * 360) / data.length;

      if (angle === 0 || Math.abs(angle - 180) < 0.01) {
        return "middle";
      } else if (angle > 180) {
        return "end";
      } else {
        return "start";
      }
    }
  };

  self.renderPolygons = function () {
    const polygons = self.radiofig.selectAll(".polygons").data(selected_item);

    polygons
      .enter()
      .append("g")
      .attr("class", (d) => `poly-all type-${d.type} cluster-${d.Cluster}`)
      .attr(
        "transform",
        "translate(" +
          self.radioSize.width / 2 +
          "," +
          self.radioSize.height / 2 +
          ")"
      )
      .append("polygon")
      .attr("class", "polygon")
      .merge(polygons)
      .attr("fill", "none")
      .attr("stroke", (d) => self.CLUSTER_COLORS[d.Cluster])
      .attr("stroke-width", "2")
      .attr("opacity", 1)
      .attr("points", generatePolygons);

    polygons.exit().remove();

    //计算多边形的顶点并生成顶点圆圈
    function generatePolygons(d, index) {
      const points = [];
      const anglePiece = (Math.PI * 2) / self.dimensions.length;

      self.dimensions.forEach(function (p, i) {
        // console.log(self.scaleRadius[p][d.type](d[p]));
        x = Math.sin(i * anglePiece) * self.scaleRadius[p][d.type](d[p]);
        y = Math.cos(i * anglePiece) * self.scaleRadius[p][d.type](d[p]);
        points.push(x + "," + y);
      });
      return points.join(" ");
    }
  };

  // 最终渲染雷达图
  self.renderRadioAxes();
  self.renderText();
  self.renderPolygons();
};

IdFig.prototype.renderHist = function (allData, groupedData) {};

IdFig.prototype.show = function (allData) {
  var self = this;
  var init_id = 201020457;
  self.renderId(allData, init_id);
  self.renderRadio(allData, init_id);
};

IdFig.prototype.updateId = function (Id) {};
