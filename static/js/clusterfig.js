function ClusterFig(pos, size) {
  var self = this;
  // 初始化设置
  this.width = size.width;
  this.height = size.height;
  this.margin = { top: 10, right: 100, bottom: 20, left: 25 };
  this.legendWidth = 50;
  this.x = pos.x;
  this.y = pos.y;
  this.outerWidth = size.width;
  this.outerHeight = size.height;
  this.innerWidth = size.width - this.margin.left - this.margin.right;
  this.innerHeight = size.height - this.margin.top - this.margin.bottom;

  // 视图
  this.fig = d3
    .select("#mainsvg")
    .append("svg")
    .attr("id", "clusterfig")
    .attr("x", this.x)
    .attr("y", this.y)
    .attr("width", this.outerWidth)
    .attr("height", this.outerHeight);

  //   // 数据
  //   this.allData = allData;
  //   this.groupedData = groupedData;
  // 其他属性初始化
  this.dimensions = [
    "mean_velocity",
    "mean_acceleration",
    "rapid_acceleration_count",
    "occupy_count",
    "overspeed_count",
    "consecutive_lane_changes_count",
  ];
  this.dimensionNames = {
    mean_velocity: "平均速度",
    mean_acceleration: "平均加速度",
    rapid_acceleration_count: "急加速/急减速次数",
    occupy_count: "占道次数",
    overspeed_count: "超速次数",
    consecutive_lane_changes_count: "连续变道次数",
  };

  this.CLUSTER_COLORS = {
    0: "#0e2d8b", // 颜色1
    1: "#1d8a1a", // 颜色2
    2: "#ea16c7",
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

  // 创建group和legend组
  this.datagroup = this.fig.append("g").attr("id", "datagroup");
  this.legend = this.fig
    .append("g")
    .attr("id", "legend")
    .attr("transform", `translate(${this.width - 200}, 30)`); // 调整图例的位置

  // 选择选项
  this.SELECTED_TYPE = 1; // 1 or 3
  this.SELECTED_CLUSTER = null;
}

ClusterFig.prototype.show = function (allData, groupedData) {
  var self = this;
  // 创建比例尺
  this.scaleX = d3
    .scalePoint()
    .domain(this.dimensions)
    .range([0, this.innerWidth]);
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
        .range([self.innerHeight, 0]);
    });
  });

  function renderAxises() {
    // 删除已有的轴
    self.datagroup.selectAll(".dimension").remove();
    // 绘制各轴
    Ys = self.datagroup
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
      .attr("y", -0.05 * self.innerHeight)
      .attr("text-anchor", "middle")
      .text((d) => self.dimensionNames[d]);
  }

  function renderLines() {
    // Render Line
    // 创建一个折线路径生成器
    let lineGenerator = d3.line();
    // 绘制折线
    self.datagroup
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
      .attr("stroke-width", 0.5)
      .attr("opacity", 1);
    // 为groupedData绘制折线
    self.datagroup
      .append("g")
      .selectAll(".line-all")
      .data(groupedData)
      .enter()
      .append("path")
      .attr("class", (d) => `line-grouped type-${d.type} cluster-${d.Cluster}`)
      .attr("d", (d) =>
        lineGenerator(
          self.dimensions.map((p) => {
            return [self.scaleX(p), self.scaleY[p][d.type](d[p])]; // 将每个维度的值映射到坐标轴上
          })
        )
      )
      .attr("fill", "none")
      .attr("stroke", (d) => self.colorScaleCluster(d["Cluster"]))
      .attr("stroke-width", 2)
      .attr("opacity", 0);

    // 移动group内所有元素，空出留白
    self.datagroup.attr(
      "transform",
      `translate(${self.margin.left}, ${self.margin.left})`
    );
  }

  renderAxises();
  renderLines();

  // 绘制图例
  // 计算Cluster图例的起始位置
  let clusterLegendStartY = 20;
  // 绘制Cluster图例
  [0, 1, 2].forEach((cluster, i) => {
    this.legend
      .append("rect")
      .attr("fill", this.colorScaleCluster(cluster))
      .attr("x", 120)
      .attr("y", clusterLegendStartY + i * 25)
      .attr("width", 15)
      .attr("height", 15)
      .attr("rx", 5)
      .attr("ry", 5)
      .on("mouseover", function () {
        if (self.SELECTED_CLUSTER === null) {
          d3.select(this).attr("width", 20).attr("height", 20);
          self.datagroup
            .selectAll(
              `.line-all.type-${self.SELECTED_TYPE}.cluster-${cluster}`
            )
            .attr("opacity", 1)
            .attr("stroke-width", 1);
        }
      })
      .on("mouseout", function () {
        if (self.SELECTED_CLUSTER === null) {
          d3.select(this).attr("width", 15).attr("height", 15);
          self.datagroup
            .selectAll(
              `.line-all.type-${self.SELECTED_TYPE}.cluster-${cluster}`
            )
            .attr("stroke-width", 0.5);
        }
      })
      .on("click", function () {
        if (self.SELECTED_CLUSTER === null) {
          self.SELECTED_CLUSTER = cluster;
          self.datagroup
            .selectAll(`.line-all.type-${self.SELECTED_TYPE}`)
            .attr("opacity", 0.1);
          self.datagroup
            .selectAll(
              `.line-all.type-${self.SELECTED_TYPE}.cluster-${cluster}`
            )
            .attr("opacity", 1);
        } else {
          if (self.SELECTED_CLUSTER === cluster) {
            self.SELECTED_CLUSTER = null;
            self.datagroup
              .selectAll(`.line-all.type-${self.SELECTED_TYPE}`)
              .attr("opacity", 1);
          }
        }
      });
    //   .on("mouseout", function () {
    //     d3.select(this).attr("width", 15).attr("height", 15);
    //     d3.selectAll(`.line-all`).attr("opacity", 1);
    //   })
    //   .on("click", function () {
    //     let opacity =
    //       d3.selectAll(`.line-grouped.type-${type}`).style("opacity") === "1"
    //         ? 0
    //         : 1;
    //     d3.selectAll(`.line-grouped.type-${type}`).style("opacity", opacity);
    //   });

    // this.legend
    //   .append("text")
    //   .attr("x", 140)
    //   .attr("y", clusterLegendStartY + i * 25 + 13)
    //   .attr("font-size", 10)
    //   .text(`${this.TYPE[type]}`);

    // 选择不同的类型
    this.selected_bottom = this.legend
      .append("rect")
      .attr("x", 120)
      .attr("y", this.innerHeight - 20)
      .attr("width", 50)
      .attr("height", 30)
      .attr("fill", "#CCCCCC")
      .on("click", function () {
        self.SELECTED_TYPE = self.SELECTED_TYPE === 1 ? 3 : 1;
        renderAxises();
        self.datagroup.selectAll(".line-all").attr("opacity", 0);
        self.datagroup
          .selectAll(`.line-all.type-${self.SELECTED_TYPE}`)
          .attr("opacity", 1);
      });
  });
};
