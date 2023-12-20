function MainFig(pos, size) {
  var self = this;
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
    .attr("id", "mainfig")
    .attr("x", this.x)
    .attr("y", this.y)
    .attr("width", this.outerWidth)
    .attr("height", this.outerHeight);
  this.projection = d3
    .geoIdentity()
    .translate([417.4337123993244, 384.6565283477654])
    .scale(0.5962286483704783); // 等价于下面的函数
  // .fitSize([this.outerWidth, this.outerHeight], mapData[0]);

  // 绘制边框
  this.figBound = this.fig
    .append("rect")
    .attr("fill-opacity", "0")
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 2.5)
    .attr("stroke", "black")
    .attr("width", this.outerWidth)
    .attr("height", this.outerHeight);

  // 添加轨道线group
  this.pathgroup = this.fig.append("g").attr("id", "pathgroup");
  // 添加地图group
  this.mapgroup = this.fig.append("g").attr("id", "mapgroup");
  // 添加数据group
  this.datagroup = this.fig.append("g").attr("id", "datagroup");

  // 播放相关
  this.play_flag = false;
  this.bottom_rect = this.fig
    .append("rect")
    .attr("id", "play_bottom")
    .attr("x", 50)
    .attr("y", 30)
    .attr("width", 50)
    .attr("height", 30)
    .attr("fill", "#CCCCCC");
  this.bottom_text = this.fig
    .append("text")
    .attr("id", "bottom_text")
    .attr("x", 75)
    .attr("y", 50)
    .text("播放")
    .attr("font-size", ".7em")
    .attr("text-anchor", "middle");
  // 播放按钮
  this.bottom_rect.on("click", async function (event, d) {
    if (!self.play_flag) {
      self.play_flag = true;
      d3.select("#bottom_text").text("停止");
      self.play();
    } else {
      self.play_flag = false;
      d3.select("#bottom_text").text("播放");
    }
  });

  this.timeFormat = d3.timeFormat("%Y-%m-%d %H:%M:%S");
  this.time_text = this.fig
    .append("text")
    .attr("id", "time_text")
    .attr("x", 150)
    .attr("y", 50);

  // 数据投影操作
  this.reformulatePos = function (d) {
    const projection = self.projection;
    cent_x = d["position"]["x"];
    cent_y = d["position"]["y"];
    shape_x = d["shape"]["x"];
    shape_y = d["shape"]["y"];
    x = cent_x - shape_x / 2;
    y = cent_y - shape_y / 2;
    proj_x = projection([x, y])[0];
    proj_y = projection([x, y])[1];

    proj_cent_x = projection([cent_x, cent_y])[0];
    proj_cent_y = projection([cent_x, cent_y])[1];

    width = shape_x;
    height = shape_y;

    proj_width = width * projection.scale();
    proj_height = height * projection.scale();

    return [proj_x, proj_y, proj_width, proj_height, proj_cent_x, proj_cent_y];
  };

  // 在data中查询id的记录
  // TODO: 注意，这个之后要改到后端里面执行
  this.cvtIdData = function (data, id) {
    let recs_for_id = [];
    var time_stamp_list = Object.keys(data);
    time_stamp_list.forEach(function (d, idx) {
      let one_time_data = data[d];
      one_time_data.forEach(function (d, idx) {
        if (d["id"] == id) {
          recs_for_id.push(d);
        }
      });
    });
    return recs_for_id;
  };

  // 突出显示相关
  this.SELECTED_MODE = false;
  this.SELECTED_ID = "none";
  this.quitSelectedMode = function () {
    self.SELECTED_MODE = false;
    self.SELECTED_ID = "none";
    self.datagroup
      .selectAll(".data_item")
      .attr("opacity", 1)
      .attr("selected", false);
    // 删除路径
    self.pathgroup.selectAll("path").remove();
  };
  this.intoSelectedMode = function (id, data) {
    self.SELECTED_ID = id;
    self.SELECTED_MODE = true;
    let idData = self.cvtIdData(data, id);
    let idPosData = idData.map((d) => d["position"]);
    // 加边框显示
    self.datagroup
      .select(`#id_${id}`)
      .attr("stroke", "black")
      .attr("stroke-width", 0.2)
      .attr("selected", true);
    // 其他的淡化
    self.datagroup
      .selectAll(".data_item")
      .filter((d) => d["id"] != id)
      .attr("opacity", 0.25)
      .attr("selected", false);
    // 绘制路径
    self.paintPath(idPosData);
  };

  this.paintPath = function (idPosData) {
    // 清除已有路径
    self.pathgroup.selectAll("path").remove();
    // 生成路径
    const pathLine = d3
      .line()
      .curve(d3.curveBasis)
      .x((d) => self.projection([d["x"], d["y"]])[0])
      .y((d) => self.projection([d["x"], d["y"]])[1]);
    self.pathgroup
      .append("path")
      .attr("class", "path")
      .attr("d", pathLine(idPosData))
      .attr("transform", self.zoom_transform)
      .attr("stroke-width", 0.7)
      .attr("stroke", "red")
      .attr("fill", "none");
  };

  // Zoom相关
  this.initialScale = 1;
  this.initialTranslate = [0, 0];
  this.zoom_transform = `translate(
    ${this.initialTranslate[0]},${this.initialTranslate[1]}
  ) scale(${this.initialScale})`;

  // 鼠标事件函数
  this.mouseoverEvent = function (event, d) {
    d3.select(this).attr("stroke", "black").attr("stroke-width", 0.2);
    tooltip.style("opacity", 1);
    tooltip
      .html(
        "<p>" +
          `id: ${d["id"]}` +
          "</p>" +
          "<p>" +
          `类型: ${TYPE[d["type"]]}` +
          "</p>" +
          "<p>" +
          `坐标：${d["position"]["x"]}, ${d["position"]["y"]}` +
          "</p>" +
          "<p>" +
          `速度: ${d["velocity"]}`
      )
      .style("left", event.pageX + 15 + "px")
      .style("top", event.pageY - 28 + "px");
  };

  this.mouseoutEvent = function (event, d) {
    let this_object = d3.select(this);
    if (
      !this_object.attr("selected") ||
      this_object.attr("selected") == "false"
    ) {
      this_object.attr("stroke-width", 0);
    }
    tooltip.style("opacity", 0);
  };

  this.mouseclickEventFactory = function (data) {
    return function (event, d) {
      if (
        !self.SELECTED_MODE &&
        !(d3.select(this).attr("selected") == "true")
      ) {
        const id = d3.select(this).data()[0]["id"];
        self.intoSelectedMode(id, data);
      }
    };
  };

  this.mousedblclickEvent = function (event, d) {
    // 取消选取模式
    if (self.SELECTED_MODE && d3.select(this).attr("selected") == "true") {
      self.quitSelectedMode();
      // 此物体恢复正常
      d3.select(this)
        .attr("stroke", "black")
        .attr("stroke-width", 0)
        .attr("selected", false);
    }
  };

  // 添加Zoom
  var zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);
  this.fig.call(
    zoom,
    d3.zoomIdentity
      .translate(this.initialTranslate[0], this.initialTranslate[1])
      .scale(this.initialScale)
  );

  function zoomed(event) {
    self.zoom_transform = event.transform;
    self.mapgroup
      .selectAll("path")
      .attr("transform", event.transform)
      .attr("stroke-width", function () {
        return 1 / event.transform.k;
      });
    self.datagroup.selectAll("rect").attr("transform", function () {
      var _this = d3.select(this);
      var old_transform = _this.attr("transform");
      var old_rotate = old_transform.slice(old_transform.search("rotate"));
      return event.transform.toString() + " " + old_rotate;
    });
    self.datagroup.selectAll("circle").attr("transform", event.transform);
    self.pathgroup.selectAll("path").attr("transform", event.transform);
  }

  this.update_data = async function () {
    this.record_data = this.cache_data;
    this.time_stamp_list = Object.keys(this.record_data);
    this.cur_time_stamp_idx = 0;
    this.cur_time_stamp = this.time_stamp_list[this.cur_time_stamp_idx];
    this.time_text.text(this.timeFormat(new Date(this.cur_time_stamp * 1000)));
    fetch(
      `http://127.0.0.1:5100/get_data_by_ts?ts=${
        parseInt(this.cur_time_stamp) + 60
      }`
    )
      .then((response) => response.json())
      .then((data) => (self.cache_data = data));
  };

  this.update_data = async function () {
    this.record_data = this.cache_data;
    this.time_stamp_list = Object.keys(this.record_data);
    this.cur_time_stamp_idx = 0;
    this.cur_time_stamp = this.time_stamp_list[this.cur_time_stamp_idx];
    this.time_text.text(this.timeFormat(new Date(this.cur_time_stamp * 1000)));
    fetch(
      `http://127.0.0.1:5100/get_data_by_ts?ts=${
        parseInt(this.cur_time_stamp) + 60
      }`
    )
      .then((response) => response.json())
      .then((data) => (self.cache_data = data));
  };
}

MainFig.prototype.renderLegend = async function () {
  const legendWidth = 140;
  const legendHeight = 100;
  let figLegend = this.fig
    .append("g")
    .attr("id", "legend_group")
    .attr(
      "transform",
      `translate(${this.outerWidth - legendWidth - 20}, ${
        this.outerHeight - legendHeight - 20
      })`
    );

  figLegend
    .append("rect")
    .attr("fill-opacity", "0")
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 1.5)
    .attr("stroke", "black")
    .attr("width", legendWidth)
    .attr("height", legendHeight);

  const color = Object.values(TYPE2COLOR);
  const legendText = Object.values(TYPE);

  const legendPos = function (d, i) {
    return [legendWidth / 5 + 10, 12 + i * ((legendHeight - 20) / 5)];
  };
  let legend_text = figLegend
    .append("g")
    .attr("id", "text_group")
    .selectAll("text")
    .data(legendText)
    .enter()
    .append("text")
    .attr("x", (d, i) => legendPos(d, i)[0])
    .attr("y", (d, i) => legendPos(d, i)[1])
    .text((d) => d)
    .attr("text-anchor", "start")
    .attr("font-size", ".7em");

  let legend_color = figLegend
    .append("g")
    .attr("id", "rect_group")
    .selectAll("rect")
    .data(color)
    .enter()
    .append("rect")
    .attr("x", (d, i) => legendPos(d, i)[0] - 33)
    .attr("y", (d, i) => legendPos(d, i)[1] - 7)
    .attr("width", legendWidth / 5)
    .attr("height", (legendHeight - 20) / 10)
    .attr("fill", (d) => d);
};

MainFig.prototype.renderMap = async function (mapData) {
  const bound_data = mapData[0];
  const cross_walk_data = mapData[1];
  const laneroad_data = mapData[2];
  const signalroad_data = mapData[3];
  const stoplinear_data = mapData[4];

  let path = d3.geoPath().projection(this.projection);

  let bounds = bound_data.features;
  let crosswalks = cross_walk_data.features;
  let laneroads = laneroad_data.features;
  let signalroads = signalroad_data.features;
  let stoplinears = stoplinear_data.features;

  let boundMap = this.mapgroup
    .selectAll("bound")
    .data(bounds)
    .enter()
    .append("path")
    .attr("class", "bound")
    .attr("stroke", "#777777")
    .attr("stroke-width", 1)
    .attr("fill", "#FFFFFF")
    .attr("d", path);

  let crossWalkMap = this.mapgroup
    .selectAll("crosswalk")
    .data(crosswalks)
    .enter()
    .append("path")
    .attr("class", "crosswalk")
    .attr("stroke", "#CCCCCC")
    .attr("stroke-width", 1)
    .attr("fill", "#FFFFFF")
    .attr("d", path)
    .attr("id", (d) => d.properties.fid)
    .on("mouseover", function (event, d) {
      console.log(d.properties.fid);
    });

  let stopLinearMap = this.mapgroup
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

MainFig.prototype.renderObject = async function (data) {
  // 退出选择模式
  this.quitSelectedMode();
  // 停止播放
  this.play_flag = false;
  this.bottom_text.text("播放");

  // 初始化数据信息
  this.record_data = null;
  this.cache_data = data;
  await this.update_data();

  // 初始化第一帧数据
  const timeData = this.record_data[this.cur_time_stamp];
  const reformulatePos = this.reformulatePos;
  const projection = this.projection;

  // Zoom transform
  const zoom_transform = this.zoom_transform;

  const vehicleData = timeData.filter((d) =>
    [1, 3, 4, 5, 6, 10].includes(d["type"])
  );
  const personData = timeData.filter((d) => d["type"] === 2);

  // 删除所有的已有数据
  this.datagroup.selectAll(".data_item").remove();

  // 渲染数据
  this.datagroup
    .selectAll("rect")
    .data(vehicleData, (d) => d["id"])
    .enter()
    .append("rect")
    // .attr(
    //   "transform",
    //   (d) => `translate(0, 0) rotate(${(d["orientation"] / Math.PI) * 180},
    //     ${reformulatePos(d)[4]}, ${reformulatePos(d)[5]})`
    // )
    .attr(
      "transform",
      (d) =>
        zoom_transform.toString() +
        " " +
        `rotate(${(d["orientation"] / Math.PI) * 180},
        ${reformulatePos(d)[4]}, ${reformulatePos(d)[5]})`
    )
    .attr("angle", (d) => (d["orientation"] / Math.PI) * 180)
    .attr("x", (d) => reformulatePos(d)[0])
    .attr("y", (d) => reformulatePos(d)[1])
    .attr("width", (d) => reformulatePos(d)[2])
    .attr("height", (d) => reformulatePos(d)[3])
    .attr("class", "data_item")
    .attr("fill", (d) => TYPE2COLOR[d["type"]])
    .attr("selected", false)
    .attr("id", (d) => "id_" + String(d["id"]))
    .attr("opacity", 1)
    .on("mouseover", this.mouseoverEvent)
    .on("mouseout", this.mouseoutEvent)
    .on("click", this.mouseclickEventFactory(data))
    .on("dblclick", this.mousedblclickEvent);
  // .on("dblclick", this.mousedblclickEvent);

  this.datagroup
    .selectAll("circle")
    .data(personData, (d) => d["id"])
    .enter()
    .append("circle")
    .attr("cx", (d) => projection([d["position"]["x"], d["position"]["y"]])[0])
    .attr("cy", (d) => projection([d["position"]["x"], d["position"]["y"]])[1])
    .attr("r", (d) => d["shape"]["x"] * 1)
    .attr("class", "data_item")
    .attr("fill", (d) => TYPE2COLOR[d["type"]])
    .attr("selected", false)
    .attr("transform", zoom_transform)
    .attr("id", (d) => "id_" + String(d["id"]))
    .attr("opacity", 1)
    .on("mouseover", this.mouseoverEvent)
    .on("mouseout", this.mouseoutEvent)
    .on("click", this.mouseclickEventFactory(data))
    .on("dblclick", this.mousedblclickEvent);
};

MainFig.prototype.updateObject = async function (transition) {
  var self = this;
  const reformulatePos = this.reformulatePos;
  const projection = this.projection;
  var datagroup = self.datagroup;

  data = this.record_data;
  timeData = data[this.cur_time_stamp];

  const vehicleData = timeData.filter((d) =>
    [1, 3, 4, 5, 6, 10].includes(d["type"])
  );
  const personData = timeData.filter((d) => d["type"] === 2);

  // 获取当前的zoom transform
  var zoom_transform = self.zoom_transform;

  // 检查之前被选取的元素是否消失
  if (!timeData.map((d) => d["id"]).includes(self.SELECTED_ID)) {
    // 退出选择模式
    this.quitSelectedMode();
  }

  // 更新路径
  if (self.SELECTED_MODE) {
    idData = self.cvtIdData(data, self.SELECTED_ID);
    idPosData = idData.map((d) => d["position"]);
    self.paintPath(idPosData);
  }

  // 设置动画效果时间
  if (transition) {
    trans = d3.transition().duration(2000).ease(d3.easeLinear); // 动画效果
  } else {
    trans = d3.transition().duration(0); // 无动画效果
  }

  // 对数据进行调整
  datagroup
    .selectAll("rect")
    .data(vehicleData, (d) => d["id"])
    .exit()
    .remove();

  // 添加元素
  datagroup
    .selectAll("rect")
    .data(vehicleData, (d) => d["id"])
    .enter()
    .append("rect")
    .attr(
      "transform",
      (d) =>
        zoom_transform +
        " " +
        `rotate(${(d["orientation"] / Math.PI) * 180},
        ${reformulatePos(d)[4]}, ${reformulatePos(d)[5]})`
    )
    .attr("angle", (d) => (d["orientation"] / Math.PI) * 180)
    .attr("x", (d) => reformulatePos(d)[0])
    .attr("y", (d) => reformulatePos(d)[1])
    .attr("width", (d) => reformulatePos(d)[2])
    .attr("height", (d) => reformulatePos(d)[3])
    .attr("class", "data_item")
    .attr("fill", (d) => TYPE2COLOR[d["type"]])
    .attr("opacity", self.SELECTED_MODE ? 0.25 : 1)
    .attr("selected", false)
    .attr("id", (d) => "id_" + String(d["id"]))
    .on("mouseover", self.mouseoverEvent)
    .on("mouseout", self.mouseoutEvent)
    .on("click", this.mouseclickEventFactory(data))
    .on("dblclick", this.mousedblclickEvent);
  // .on("dblclick", self.mousedblclickEvent);

  // 其他元素进行调整
  datagroup
    .selectAll("rect")
    .data(vehicleData, (d) => d["id"])
    // .attr("transform", d => `rotate(${d['orientation'] / Math.PI * 180},
    //       ${reformulatePos(d)[0]}, ${reformulatePos(d)[1]})`)
    .transition(trans)
    .attrTween("transform", function (d, i, a) {
      var rect = d3.select(this);
      var x_old = Number(rect.attr("x"));
      var y_old = Number(rect.attr("y"));
      var angle_old = Number(rect.attr("angle"));
      var x_new = reformulatePos(d)[0];
      var y_new = reformulatePos(d)[1];
      var angle_new = (d["orientation"] / Math.PI) * 180;
      var width = reformulatePos(d)[2];
      var height = reformulatePos(d)[3];

      if (Math.abs(angle_new - angle_old) > 180) {
        if (angle_new > angle_old) {
          angle_new = angle_new - 360;
        } else {
          angle_old = angle_old - 360;
        }
      }

      // 计算中心点的变化
      const interpolateX = d3.interpolateNumber(
        x_old + width / 2,
        x_new + width / 2
      );
      const interpolateY = d3.interpolateNumber(
        y_old + height / 2,
        y_new + height / 2
      );
      // 计算角度的变化
      const interpolateAngle = d3.interpolateNumber(angle_old, angle_new);

      return function (t) {
        var old_transform = rect.attr("transform");
        var old_translate = old_transform.slice(
          old_transform.search("translate"),
          old_transform.search("rotate")
        );

        const centerX = interpolateX(t);
        const centerY = interpolateY(t);
        const centerAngle = interpolateAngle(t);
        return (
          old_translate + " " + `rotate(${centerAngle}, ${centerX}, ${centerY})`
        );
      };
    })
    .attr("angle", (d) => (d["orientation"] / Math.PI) * 180)
    .attr("x", (d) => reformulatePos(d)[0])
    .attr("y", (d) => reformulatePos(d)[1])
    .attr("width", (d) => reformulatePos(d)[2])
    .attr("height", (d) => reformulatePos(d)[3])
    .attr("class", "data_item")
    .attr("fill", (d) => TYPE2COLOR[d["type"]]);

  datagroup
    .selectAll("circle")
    .data(personData, (d) => d["id"])
    .exit()
    .remove();

  datagroup
    .selectAll("circle")
    .data(personData, (d) => d["id"])
    .enter()
    .append("circle")
    .attr("cx", (d) => projection([d["position"]["x"], d["position"]["y"]])[0])
    .attr("cy", (d) => projection([d["position"]["x"], d["position"]["y"]])[1])
    .attr("r", (d) => d["shape"]["x"] * 1)
    .attr("class", "data_item")
    .attr("fill", (d) => TYPE2COLOR[d["type"]])
    .attr("transform", zoom_transform)
    .attr("opacity", self.SELECTED_MODE ? 0.25 : 1)
    .attr("selected", false)
    .attr("id", (d) => "id_" + String(d["id"]))
    .on("mouseover", self.mouseoverEvent)
    .on("mouseout", self.mouseoutEvent)
    .on("click", this.mouseclickEventFactory(data))
    .on("dblclick", this.mousedblclickEvent);
  // .on("dblclick", self.mousedblclickEvent);

  datagroup
    .selectAll("circle")
    .data(personData, (d) => d["id"])
    .transition(trans)
    .attr("cx", (d) => projection([d["position"]["x"], d["position"]["y"]])[0])
    .attr("cy", (d) => projection([d["position"]["x"], d["position"]["y"]])[1])
    .attr("r", (d) => d["shape"]["x"] * 1)
    .attr("class", "data_item")
    .attr("fill", (d) => TYPE2COLOR[d["type"]]);

  await trans.end();
};

MainFig.prototype.play = async function () {
  while (this.play_flag) {
    // TODO: 无法在00时刻停止
    if (this.cur_time_stamp_idx === this.time_stamp_list.length - 1) {
      this.update_data();
      await this.updateObject(true);
    }
    // 更新数据状态
    this.cur_time_stamp_idx += 1;
    this.cur_time_stamp = this.time_stamp_list[this.cur_time_stamp_idx];
    this.time_text.text(this.timeFormat(new Date(this.cur_time_stamp * 1000)));
    await this.updateObject(true);
  }
};

MainFig.prototype.NoHighlight = function () {
  this.mapgroup.selectAll(".crosswalk").attr("stroke", "#CCCCCC");
};

MainFig.prototype.highlightCrosslines = function (selectedCrossing) {
  if (selectedCrossing in crossinglines) {
    this.mapgroup
      .selectAll(".crosswalk")
      .filter((d) => crossinglines[selectedCrossing].includes(d.properties.fid))
      .attr("stroke", "red");
  }
};

MainFig.prototype.selectId = function (id) {
  var self = this;
  // 找到id对应的第一帧时间
  // time0 = new Date(1681341971599693);
  // ts0 = Math.floor(time0.getTime() / 1000); // TODO.

  fetch(`http://127.0.0.1:5100/get_data_by_id?id=${id}`)
    .then((response) => response.json())
    .then(function (idData) {
      ts0 = idData[0]["time_meas"];
      fetch(`http://127.0.0.1:5100/get_data_by_ts?ts=${ts0}`)
        .then((response) => response.json())
        .then(async function (data) {
          await self.renderObject(data);
          // 选择id
          if (self.SELECTED_MODE) {
            self.quitSelectedMode();
          }
          self.intoSelectedMode(id, data);
        });
    });
};

MainFig.prototype.show = async function (cache, mapData) {
  // 绘制地图
  await this.renderMap(mapData);
  // 绘制图例
  await this.renderLegend();
  // 初始化物体
  this.renderObject(cache);
};
