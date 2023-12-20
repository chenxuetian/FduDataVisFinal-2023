function ClusterFig(pos, size) {
  var self = this;
  // 初始化设置
  this.width = size.width;
  this.height = size.height;
  this.margin = { top: 20, right: 10, bottom: 20, left: 10 };
  this.legendWidth = 50;
  this.x = pos.x;
  this.y = pos.y;

  this.outerWidth = size.width;
  this.outerHeight = size.height;
  this.innerWidth = size.width - this.margin.left - this.margin.right;
  this.innerHeight = size.height - this.margin.top - this.margin.bottom;

  this.paralPos = { x: 0, y: 0 };
  this.paralSize = {
    width: mainfig.outerWidth + 30,
    height: this.outerHeight,
  };
  this.radioPos = { x: this.paralSize.width, y: 0 };
  this.radioSize = {
    width: (this.innerWidth / 15) * 3 + 20,
    height: this.outerHeight,
  };
  this.legendPos = { x: this.radioPos.x + this.radioSize.width + 10, y: 0 };
  this.legendSize = { width: this.innerWidth / 15, height: this.outerHeight };

  // 完整视图
  this.fig = d3
    .select("#mainsvg")
    .append("svg")
    .attr("id", "clusterfig")
    .attr("x", this.x)
    .attr("y", this.y)
    .attr("width", this.outerWidth)
    .attr("height", this.outerHeight);

  // 边框
  this.fig
    .append("rect")
    .attr("width", this.outerWidth)
    .attr("height", this.outerHeight)
    .attr("fill", "none")
    .attr("stroke-width", 2.5)
    .attr("stroke", "black");
  // 各子图

  this.paralfig = this.fig
    .append("svg")
    .attr("id", "paralfig")
    .attr("x", this.paralPos.x)
    .attr("y", this.paralPos.y)
    .attr("width", this.paralSize.width)
    .attr("height", this.paralSize.height);

  this.radiofig = this.fig
    .append("svg")
    .attr("id", "radiofig")
    .attr("x", this.radioPos.x)
    .attr("y", this.radioPos.y)
    .attr("width", this.radioSize.width)
    .attr("height", this.radioSize.height);

  this.legend = this.fig
    .append("svg")
    .attr("id", "legend")
    .attr("x", this.legendPos.x)
    .attr("y", this.legendPos.y)
    .attr("width", this.legendSize.width)
    .attr("height", this.legendSize.height);

  // 其他属性初始化
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

  this.CLUSTER_COLORS = {
    0: "#f58231", // 颜色1
    1: "#dcbeff", // 颜色2
    2: "#3cb44b",
  };
  this.TYPE = {
    1: "小型车辆",
    3: "非机动车",
  };
  this.TYPE2COLOR = {
    1: "#FA8828",
    3: "#9FC131",
  };
  this.colorScaleType = d3
    .scaleOrdinal()
    .domain(Object.keys(this.TYPE2COLOR))
    .range(Object.values(this.TYPE2COLOR));
  this.colorScaleCluster = d3
    .scaleOrdinal()
    .domain(Object.keys(this.CLUSTER_COLORS))
    .range(Object.values(this.CLUSTER_COLORS));

  // 创建group
  this.paralDataGroup = this.paralfig.append("g").attr("id", "paralDataGroup");

  // 选择选项
  this.SELECTED_TYPE = 1; // 1 or 3
  this.SELECTED_CLUSTER = null;
}

ClusterFig.prototype.showParall = function (allData, groupedData) {
  var self = this;
  // 创建比例尺
  this.scaleX = d3
    .scalePoint()
    .domain(this.dimensions)
    .range([20, this.paralSize.width - 40]);
  this.scaleY = {};
  this.dimensions.forEach((d) => {
    self.scaleY[d] = {};
    Object.keys(self.TYPE).forEach((type) => {
      let minval = Math.min(
        d3.min(allData.filter((d) => +d.type === +type).map((e) => +e[d])),
        d3.min(groupedData.filter((d) => +d.type === +type).map((e) => +e[d]))
      );
      let maxval = Math.max(
        d3.max(allData.filter((d) => +d.type === +type).map((e) => +e[d])),
        d3.max(groupedData.filter((d) => +d.type === +type).map((e) => +e[d]))
      );
      self.scaleY[d][type] = d3
        .scaleLinear()
        .domain([minval * 0.9, maxval * 1.1])
        .range([this.innerHeight - 30, 10])
        .nice();
    });
  });

  this.renderAxises = function () {
    // 删除已有的轴
    self.paralDataGroup.selectAll(".dimension").remove();
    // 绘制各轴
    Ys = self.paralDataGroup
      .selectAll(".dimension")
      .data(self.dimensions)
      .enter()
      .append("g")
      .attr("class", (d) => `dimension ${d.replace(/[\s/]/g, "-")}`)
      .attr("transform", (d) => `translate(${self.scaleX(d)},0)`);
    Ys.append("g").each(function (d) {
      d3.select(this)
        .call(d3.axisLeft(self.scaleY[d][self.SELECTED_TYPE]))
        .selectAll(".domain, .tick line") // 选择坐标轴的主线和刻度线
        .style("stroke-width", 2); // 设置线条宽度为2
    });
    // 为各轴注明属性名称
    Ys.append("text")
      .attr("font-size", 10)
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .text((d) => self.dimensionNames[d]);
  };

  this.renderLines = function () {
    // Render Line
    // 创建一个折线路径生成器
    let lineGenerator = d3.line();
    // 绘制折线
    self.paralDataGroup
      .append("g")
      .selectAll(".line-all")
      .data(allData)
      .enter()
      .append("path")
      .attr("class", (d) => `line-all type-${d.type} cluster-${d.Cluster}`)
      .attr("id", (d) => `${d.id}`)
      .attr("d", (d) =>
        lineGenerator(
          self.dimensions.map((p) => {
            return [self.scaleX(p), self.scaleY[p][d.type](d[p])]; // 将每个维度的值映射到坐标轴上
          })
        )
      )
      .attr("fill", "none")
      .attr("stroke", (d) => self.colorScaleCluster(d["Cluster"]))
      .attr("stroke-width", 1)
      .attr("opacity", 1)
      .on("mouseover", function (event, d) {
        if (
          self.SELECTED_CLUSTER == null ||
          d.Cluster == self.SELECTED_CLUSTER
        ) {
          d3.select(this).attr("stroke-width", 2).attr("stroke", "red");
        }
      }) // 高亮显示
      .on("mouseout", function (event, d) {
        if (
          self.SELECTED_CLUSTER == null ||
          d.Cluster == self.SELECTED_CLUSTER
        ) {
          d3.select(this)
            .attr("stroke-width", 1)
            .attr("stroke", (d) => self.colorScaleCluster(d["Cluster"]));
        }
      }) // 恢复原状
      .on("click", function (event, d) {
        let id = d.id;
        console.log(id);
        idfig.updateId(id);
        mainfig.selectId(id);
      });

    // 删掉不需要的线
    self.paralDataGroup
      .selectAll(`.line-all.type-${self.SELECTED_TYPE === 1 ? 3 : 1}`)
      .remove();

    // 移动group内所有元素，空出留白
    self.paralDataGroup.attr(
      "transform",
      `translate(${self.margin.left}, ${self.margin.top})`
    );
  };

  this.renderAxises();
  this.renderLines();
  // 只展现选中的type
  self.paralDataGroup.selectAll(".line-all").attr("opacity", 0);
  self.paralDataGroup
    .selectAll(`.line-all.type-${self.SELECTED_TYPE}`)
    .attr("opacity", 1);

  // 在最下方显示标题
  this.paraltitle_text = this.paralfig
    .append("text")
    .attr("x", this.paralSize.width / 2)
    .attr("y", this.paralSize.height - 10)
    .attr("text-anchor", "middle")
    .text("小型客车聚类结果");
};

ClusterFig.prototype.showLegend = function () {
  var self = this;
  // 绘制图例
  // 计算Cluster图例的起始位置
  let clusterLegendStartY = 20;
  // 绘制Cluster图例
  [0, 1, 2].forEach((cluster, i) => {
    self.legend
      .append("rect")
      .attr("fill", self.colorScaleCluster(cluster))
      .attr("x", 20)
      .attr("y", clusterLegendStartY + i * 25)
      .attr("width", 15)
      .attr("height", 15)
      .attr("rx", 5)
      .attr("ry", 5)
      .on("mouseover", function () {
        if (self.SELECTED_CLUSTER === null) {
          d3.select(this).attr("width", 20).attr("height", 20);
          self.paralDataGroup
            .selectAll(
              `.line-all.type-${self.SELECTED_TYPE}.cluster-${cluster}`
            )
            .attr("opacity", 1)
            .attr("stroke-width", 1);
          self.radiofig
            .selectAll(
              `.poly-all.type-${self.SELECTED_TYPE}.cluster-${cluster}`
            )
            .selectAll("polygon")
            .attr("opacity", 1)
            .attr("stroke-width", 3);
        }
      })
      .on("mouseout", function () {
        if (self.SELECTED_CLUSTER === null) {
          d3.select(this).attr("width", 15).attr("height", 15);
          self.paralDataGroup
            .selectAll(
              `.line-all.type-${self.SELECTED_TYPE}.cluster-${cluster}`
            )
            .attr("stroke-width", 0.5);
          self.radiofig
            .selectAll(
              `.poly-all.type-${self.SELECTED_TYPE}.cluster-${cluster}`
            )
            .selectAll("polygon")
            .attr("stroke-width", 2);
        }
      })
      .on("click", function () {
        if (self.SELECTED_CLUSTER === null) {
          self.SELECTED_CLUSTER = cluster;
          self.paralDataGroup
            .selectAll(`.line-all.type-${self.SELECTED_TYPE}`)
            .sort(
              (a, b) =>
                Number(a.Cluster === self.SELECTED_CLUSTER) -
                Number(b.Cluster === self.SELECTED_CLUSTER)
            ) // 将所选择的数据放到前面
            .attr("opacity", 0.1);
          self.paralDataGroup
            .selectAll(
              `.line-all.type-${self.SELECTED_TYPE}.cluster-${self.SELECTED_CLUSTER}`
            )
            .attr("opacity", 1);

          // 对于雷达图同理
          self.radiofig
            .selectAll(`.poly-all.type-${self.SELECTED_TYPE}`)
            .selectAll("polygon")
            .sort(
              (a, b) =>
                Number(a.Cluster === self.SELECTED_CLUSTER) -
                Number(b.Cluster === self.SELECTED_CLUSTER)
            )
            .attr("opacity", 0.1);
          self.radiofig
            .selectAll(
              `.poly-all.type-${self.SELECTED_TYPE}.cluster-${cluster}`
            )
            .selectAll("polygon")
            .attr("opacity", 1);
        } else {
          if (self.SELECTED_CLUSTER === cluster) {
            self.SELECTED_CLUSTER = null;
            self.paralDataGroup
              .selectAll(`.line-all.type-${self.SELECTED_TYPE}`)
              .attr("opacity", 1);
            self.radiofig
              .selectAll(`.poly-all.type-${self.SELECTED_TYPE}`)
              .selectAll("polygon")
              .attr("opacity", 1);
          }
        }
      });
    self.legend
      .append("text")
      .attr("x", 40)
      .attr("y", clusterLegendStartY + i * 25 + 13)
      .attr("font-size", 10)
      .text(`类别${i + 1}`);
  });

  // 选择不同的类型
  typeSwitch = function () {
    self.SELECTED_TYPE = self.SELECTED_TYPE === 1 ? 3 : 1;
    self.renderAxises();
    self.renderLines();
    self.paralDataGroup.selectAll(".line-all").attr("opacity", 0);
    self.paralDataGroup
      .selectAll(`.line-all.type-${self.SELECTED_TYPE}`)
      .attr("opacity", 1);
    self.radiofig
      .selectAll(`.poly-all`)
      .selectAll("polygon")
      .attr("opacity", 0);
    self.radiofig
      .selectAll(`.poly-all.type-${self.SELECTED_TYPE}`)
      .selectAll("polygon")
      .attr("opacity", 1);
    self.paraltitle_text.text(
      self.SELECTED_TYPE === 1 ? "小型客车聚类结果" : "非机动车聚类结果"
    );
    self.radiotitle_text.text(
      self.SELECTED_TYPE === 1 ? "小型客车各类统计结果" : "非机动车各类统计结果"
    );
  };
  this.selected_bottom = this.legend
    .append("rect")
    .attr("x", 20)
    .attr("y", this.innerHeight - 30)
    .attr("width", 50)
    .attr("height", 30)
    .attr("fill", "#CCCCCC")
    .on("click", typeSwitch);
  this.selected_text = this.legend
    .append("text")
    .attr("x", +this.selected_bottom.attr("x") + 25)
    .attr("y", +this.selected_bottom.attr("y") + 20)
    .attr("text-anchor", "middle")
    .text("切换")
    .on("click", typeSwitch);
};

ClusterFig.prototype.showRadio = function (allData, groupedData) {
  var self = this;
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
    Object.keys(self.TYPE).forEach((type) => {
      let minval = Math.min(
        d3.min(groupedData.filter((d) => +d.type === +type).map((e) => +e[d]))
      );
      let maxval = Math.max(
        d3.max(groupedData.filter((d) => +d.type === +type).map((e) => +e[d]))
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
          self.innerHeight / 2 +
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

  // 绘制图像
  self.renderPolygons = function () {
    // const newData = handleData(data);

    const polygons = self.radiofig.selectAll(".polygons").data(groupedData);

    polygons
      .enter()
      .append("g")
      .attr("class", (d) => `poly-all type-${d.type} cluster-${d.Cluster}`)
      .attr(
        "transform",
        "translate(" +
          self.radioSize.width / 2 +
          "," +
          self.innerHeight / 2 +
          ")"
      )
      .append("polygon")
      .attr("class", "polygon")
      .merge(polygons)
      .attr("fill", "none")
      .attr("stroke", (d) => self.CLUSTER_COLORS[d.Cluster])
      .attr("stroke-width", "2")
      .attr("opacity", 0)
      .attr("points", generatePolygons);

    // 只显示当前type的数据
    self.radiofig
      .selectAll(`.poly-all.type-${self.SELECTED_TYPE}`)
      .selectAll(".polygon")
      .attr("opacity", 1);

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

  // 绘制最终的雷达图
  self.renderRadioAxes();
  self.renderText();
  self.renderPolygons();

  // 在最下方显示标题
  this.radiotitle_text = this.radiofig
    .append("text")
    .attr("x", this.radioSize.width / 2)
    .attr("y", this.radioSize.height - 10)
    .attr("text-anchor", "middle")
    .text("小型客车各类统计结果");
};

ClusterFig.prototype.show = function (allData, groupedData) {
  this.showParall(allData, groupedData);
  this.showRadio(allData, groupedData);
  this.showLegend();
};
