function IdFig(pos, size) {
  var self = this;
  this.x = pos.x;
  this.y = pos.y;
  this.margin = { top: 25, right: 15, bottom: 25, left: 20 };
  this.outerWidth = size.width;
  this.outerHeight = size.height;
  this.innerWidth = size.width - this.margin.left - this.margin.right;
  this.innerHeight = size.height - this.margin.top - this.margin.bottom;

  this.idsvgPos = { x: 0, y: this.outerHeight / 7 };
  this.idsvgSize = {
    width: this.innerWidth,
    height: this.outerHeight / 5,
  };

  this.radioPos = { x: 0, y: this.outerHeight / 7 + this.outerHeight / 7 };
  this.radioSize = {
    width: this.innerWidth,
    height: this.outerHeight / 3,
  };

  this.histfigPos = { x: 0, y: (this.outerHeight * 8) / 15 };
  this.histfigSize = {
    width: this.innerWidth,
    height: (this.outerHeight * 7) / 15,
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

  this.bound = this.fig
    .append("rect")
    .attr("fill-opacity", 0)
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 2.5)
    .attr("stroke", "black")
    .attr("width", this.outerWidth)
    .attr("height", (this.outerHeight / 5) * 4 - 48)
    .attr("y", this.outerHeight / 5);

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
    rapid_acceleration_count: "急变速次数",
    occupy_count: "占道次数",
    overspeed_count: "超速次数",
    consecutive_lane_changes_count: "连续变道次数",
  };
}

IdFig.prototype.renderId = function (allData, id) {
  var self = this;
  const selected_item = allData.find((item) => item.id === id);
  self.idsvg.selectAll("*").remove();

  function calculateMedian(values) {
    if (values.length === 0) return 0;

    values.sort((a, b) => a - b);
    const half = Math.floor(values.length / 2);

    if (values.length % 2) {
      return values[half];
    }

    return (values[half - 1] + values[half]) / 2.0;
  }

  function addVelocityScore(allData) {
    // 提取出所有 mean_velocity 的值
    const meanVelocities = allData.map((item) => item.mean_velocity);

    // 计算 mean_velocity 的中位数
    const medianVelocity = calculateMedian(meanVelocities);

    // 为每个元素添加 velocity_score
    allData.forEach((item) => {
      item.velocity_score = Math.abs(item.mean_velocity - medianVelocity);
    });
    const max_score = Math.max(...allData.map((item) => item.velocity_score));

    // 如果最大分数是 0，则避免除以零的情况
    if (max_score === 0) return;

    // 对每个元素的 velocity_score 进行归一化处理
    allData.forEach((item) => {
      item.normalized_score = (item.velocity_score / max_score) * 8;
      item.fin_score = 100 - (item.normalized_score + 0.8*item.max_acceleration + item.rapid_acceleration_count + item.occupy_count + 1.2*item.overspeed_count + item.consecutive_lane_changes_count);
    });
  }

  addVelocityScore(allData);

  // 设置文本说明和对应的字段
  // ID，聚类结果，类型，得分
  const types = {
    "-1": "未知",
    1: "小型车辆",
    2: "行人",
    3: "非机动车",
    4: "卡车",
    5: "厢式货车、面包车",
    6: "客车",
    7: "静态物体",
    8: "路牙",
    9: "锥桶",
    10: "手推车、三轮车",
    11: "信号灯",
    12: "出入口",
  };
  const texts = [
    { label: "ID", field: "id" },
    { label: "聚类种类", field: "Cluster" },
    { label: "类型", field: "type" },
    { label: "文明得分", field: "fin_score" },
  ];
  selected_item.type_name = types[selected_item.type];
  const groupWidth = self.idsvgSize.width * 0.45;
  const groupHeight = 50; // 可以根据需要调整

  texts.forEach((text, index) => {
    // 创建一个组 (g) 来放置说明和数值
    const group = self.idsvg
      .append("g")
      .attr(
        "transform",
        `translate(${(index % 2) * groupWidth}, ${
          Math.floor(index / 2) * groupHeight + 50
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
      .text(
        index === 3
          ? parseFloat(selected_item[text.field]).toFixed(2)
          : selected_item[text.field]
      ); // 保留两位小数
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

IdFig.prototype.renderHist = function (allData, id) {
  var self = this;

  function calculateMedian(values) {
    if (values.length === 0) return 0;

    values.sort((a, b) => a - b);
    const half = Math.floor(values.length / 2);

    if (values.length % 2) {
      return values[half];
    }

    return (values[half - 1] + values[half]) / 2.0;
  }

  function addVelocityScore(allData) {
    // 提取出所有 mean_velocity 的值
    const meanVelocities = allData.map((item) => item.mean_velocity);

    // 计算 mean_velocity 的中位数
    const medianVelocity = calculateMedian(meanVelocities);

    // 为每个元素添加 velocity_score
    allData.forEach((item) => {
      item.velocity_score = Math.abs(item.mean_velocity - medianVelocity);
    });
    const max_score = Math.max(...allData.map((item) => item.velocity_score));

    // 如果最大分数是 0，则避免除以零的情况
    if (max_score === 0) return;

    // 对每个元素的 velocity_score 进行归一化处理
    allData.forEach((item) => {
      item.normalized_score = (item.velocity_score / max_score) * 8;
      item.fin_score = 100 - (item.normalized_score + 0.8*item.max_acceleration + item.rapid_acceleration_count + item.occupy_count + 1.2*item.overspeed_count + item.consecutive_lane_changes_count)
    });
  }

  addVelocityScore(allData);
  // 1. 选择 SVG 元素
  const svg = self.histfig; // 假设 self.histfig 是 SVG 元素
  const margin = { top: 10, right: 30, bottom: 30, left: 40 };
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;

  // 2. 准备数据：从 allData 中提取 velocity_score 的值
  const data = allData.map((item) => item.fin_score);

  // 3. 创建比例尺
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(data)])
    .range([0, width]);

  const histogram = d3
    .histogram()
    .value((d) => d)
    .domain(x.domain())
    .thresholds(x.ticks(20));

  const bins = histogram(data);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(bins, (d) => d.length)])
    .range([height - 50, 150]);

  // 4. 创建直方图生成器并绘制直方图
  svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("x", 1)
    .attr("transform", (d) => `translate(${x(d.x0)},${y(d.length)})`)
    .attr("width", (d) => x(d.x1) - x(d.x0) - 1)
    .attr("height", (d) => height - 50 - y(d.length))
    .style("fill", "#69b3a2");

  const selected_item = [allData.find((item) => item.id === id)];
  // 假设 selected_item 已经定义并包含 velocity_score
  console.log(selected_item);
  const selectedFinScore = selected_item[0].fin_score;
  console.log(selected_item.fin_score);

  // 在直方图上绘制红色竖线
  svg.selectAll(".line").remove();
  svg
    .append("line")
    .attr("x1", x(selectedFinScore))
    .attr("x2", x(selectedFinScore))
    .attr("y1", 140)
    .attr("y2", height - 50)
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("class", "line")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // 添加标题
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", margin.top + 120)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("text-decoration", "underline")
    .text("文明评分分布图");

  // 添加 X 轴标签
  svg
    .append("text")
    .attr(
      "transform",
      "translate(" + width + " ," + (height - 40 + margin.top + 20) + ")"
    )
    .style("text-anchor", "start")
    .text("score");

  // 添加 Y 轴标签
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("频数");

  // 添加 X 轴
  svg
    .append("g")
    .attr("transform", `translate(${margin.left},${height - 50 + margin.top})`)
    .call(d3.axisBottom(x));

  // 添加 Y 轴
  svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .call(d3.axisLeft(y));
};

IdFig.prototype.show = function (allData) {
  var self = this;
  var init_id = 201020457;
  self.renderId(allData, init_id);
  self.renderRadio(allData, init_id);
  self.renderHist(allData, init_id);
};

IdFig.prototype.updateId = function (Id) {
  var self = this;
  self.renderId(allData, Id);
  self.renderRadio(allData, Id);
  self.renderHist(allData, Id);
};
