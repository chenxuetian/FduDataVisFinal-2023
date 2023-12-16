var SELECTED_MODE = false;
var SELECTED_ID = "none";

const mouseoverEvent = function (event, d) {
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

const mouseoutEvent = function (event, d) {
  let this_object = d3.select(this);
  // console.log(this_object.attr("selected"));
  if (
    !this_object.attr("selected") ||
    this_object.attr("selected") == "false"
  ) {
    this_object.attr("stroke-width", 0);
  }
  tooltip.style("opacity", 0);
};

async function renderMap(mainfig, mapData, projection) {
  bound_data = mapData[0];
  cross_walk_data = mapData[1];
  laneroad_data = mapData[2];
  signalroad_data = mapData[3];
  stoplinear_data = mapData[4];

  let map_group = mainfig.append("g").attr("id", "map_group");
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
    // .attr("transform", `translate(${WIDTH_MAIN/2}, ${HEIGHT_MAIN/2})`)
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
    // .attr("transform", `translate(${WIDTH_MAIN/2}, ${HEIGHT_MAIN/2})`)
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
    // .attr("transform", `translate(${WIDTH_MAIN/2}, ${HEIGHT_MAIN/2})`)
    .attr("d", path);
}

function cvtIdData(Data, id) {
  let recs_for_id = [];
  var time_stamp_list = Object.keys(Data);
  time_stamp_list.forEach(function (d, idx) {
    let one_time_data = Data[d];
    one_time_data.forEach(function (d, idx) {
      if (d["id"] == id) {
        recs_for_id.push(d);
      }
    });
  });
  return recs_for_id;
}

function renderObject(mainfig, Data, projection, first_time_stamp = 840670945) {
  // 添加数据
  time_stamp = first_time_stamp;

  let datagroup = mainfig.append("g").attr("id", "data_group");

  const reformulatePos = function (d) {
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

    _point1 = [0, 0];
    _point2 = [width, height];
    _proj_point1 = projection(_point1);
    _proj_point2 = projection(_point2);
    proj_width = _proj_point2[0] - _proj_point1[0];
    proj_height = _proj_point2[1] - _proj_point1[1];

    return [proj_x, proj_y, proj_width, proj_height, proj_cent_x, proj_cent_y];
  };

  let vehicleData = Data[time_stamp].filter((d) =>
    [1, 3, 4, 5, 6, 10].includes(d["type"])
  );

  let personData = Data[time_stamp].filter((d) => d["type"] === 2);

  const mouseclickEvent = function (event, d) {
    if (!SELECTED_MODE && !(d3.select(this).attr("selected") == "true")) {
      SELECTED_MODE = true;
      let id = d3.select(this).data()[0]["id"];
      SELECTED_ID = id;
      let idData = cvtIdData(Data, id);
      let idPosData = idData.map((d) => d["position"]);
      let pathgroup = mainfig.select("#pathgroup");
      let zoom_rect = mainfig.select("#zoom_transform_rec");
      var zoom_transform = zoom_rect.attr("transform");
      // 加边框显示
      d3.select(this)
        .attr("stroke", "black")
        .attr("stroke-width", 0.2)
        .attr("selected", true);
      // 其他的淡化
      d3.select("#data_group")
        .selectAll(".data_item")
        .filter((d) => d["id"] != id)
        .attr("opacity", 0.25)
        .attr("selected", false);
      // 清除已有路径
      pathgroup.selectAll("path").remove();
      // 生成路径
      const pathLine = d3
        .line()
        .curve(d3.curveBasis)
        .x((d) => projection([d["x"], d["y"]])[0])
        .y((d) => projection([d["x"], d["y"]])[1]);
      pathgroup
        .append("path")
        .attr("class", "path")
        .attr("d", pathLine(idPosData))
        .attr("transform", zoom_transform)
        .attr("stroke-width", 0.7)
        .attr("stroke", "red")
        .attr("fill", "none");
    }
  };

  const mousedblclickEvent = function (event, d) {
    // 取消选取模式
    if (SELECTED_MODE && d3.select(this).attr("selected") == "true") {
      SELECTED_MODE = false;
      SELECTED_ID = "none";
      // 恢复正常
      d3.select(this)
        .attr("stroke", "black")
        .attr("stroke-width", 0)
        .attr("selected", false);
      d3.select("#data_group")
        .selectAll(".data_item")
        .attr("opacity", 1)
        .attr("selected", false);
      // 删除路径
      let pathgroup = mainfig.select("#pathgroup");
      pathgroup.selectAll("path").remove();
    }
  };

  datagroup
    .selectAll("rect")
    .data(vehicleData, (d) => d["id"])
    .enter()
    .append("rect")
    .attr(
      "transform",
      (d) => `translate(0, 0) rotate(${(d["orientation"] / Math.PI) * 180},
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
    .on("mouseover", mouseoverEvent)
    .on("mouseout", mouseoutEvent)
    .on("click", mouseclickEvent)
    .on("dblclick", mousedblclickEvent);

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
    .attr("selected", false)
    .on("mouseover", mouseoverEvent)
    .on("mouseout", mouseoutEvent)
    .on("click", mouseclickEvent)
    .on("dblclick", mousedblclickEvent);
}

async function updateObject(
  mainfig,
  Data,
  projection,
  new_time_stamp = 840671014,
  transition = true
) {
  const datagroup = mainfig.select("#data_group");

  let new_data = Data[new_time_stamp];

  // 检查之前被选取的元素是否消失
  if (!new_data.map((d) => d["id"]).includes(SELECTED_ID)) {
    SELECTED_MODE = false;
    SELECTED_ID = "none";
    // 恢复正常
    d3.select("#data_group")
      .selectAll(".data_item")
      .attr("opacity", 1)
      .attr("selected", false);
    // 删除路径
    let pathgroup = mainfig.select("#pathgroup");
    pathgroup.selectAll("path").remove();
  }

  let vehicleData = new_data.filter((d) =>
    [1, 3, 4, 5, 6, 10].includes(d["type"])
  );

  let personData = new_data.filter((d) => d["type"] === 2);

  const reformulatePos = function (d) {
    cent_x = d["position"]["x"];
    cent_y = d["position"]["y"];
    shape_x = d["shape"]["x"];
    shape_y = d["shape"]["y"];
    x = cent_x - shape_x / 2;
    y = cent_y - shape_y / 2;
    proj_x = projection([x, y])[0];
    proj_y = projection([x, y])[1];
    width = shape_x;
    height = shape_y;

    proj_cent_x = projection([cent_x, cent_y])[0];
    proj_cent_y = projection([cent_x, cent_y])[1];

    _point1 = [0, 0];
    _point2 = [width, height];
    _proj_point1 = projection(_point1);
    _proj_point2 = projection(_point2);
    proj_width = _proj_point2[0] - _proj_point1[0];
    proj_height = _proj_point2[1] - _proj_point1[1];

    return [proj_x, proj_y, proj_width, proj_height, proj_cent_x, proj_cent_y];
  };

  const mouseclickEvent = function (event, d) {
    if (!SELECTED_MODE && !(d3.select(this).attr("selected") == "true")) {
      SELECTED_MODE = true;
      let id = d3.select(this).data()[0]["id"];
      SELECTED_ID = id;
      let idData = cvtIdData(Data, id);
      let idPosData = idData.map((d) => d["position"]);
      let pathgroup = mainfig.select("#pathgroup");
      let zoom_rect = mainfig.select("#zoom_transform_rec");
      var zoom_transform = zoom_rect.attr("transform");
      // 加边框显示
      d3.select(this)
        .attr("stroke", "black")
        .attr("stroke-width", 0.2)
        .attr("selected", true);
      // 其他的淡化
      d3.select("#data_group")
        .selectAll(".data_item")
        .filter((d) => d["id"] != id)
        .attr("opacity", 0.25)
        .attr("selected", false);
      // 清除已有路径
      pathgroup.selectAll("path").remove();
      // 生成路径
      const pathLine = d3
        .line()
        .curve(d3.curveBasis)
        .x((d) => projection([d["x"], d["y"]])[0])
        .y((d) => projection([d["x"], d["y"]])[1]);
      pathgroup
        .append("path")
        .attr("class", "path")
        .attr("d", pathLine(idPosData))
        .attr("transform", zoom_transform)
        .attr("stroke-width", 0.7)
        .attr("stroke", "red")
        .attr("fill", "none");
    }
  };

  const mousedblclickEvent = function (event, d) {
    // 取消选取模式
    if (SELECTED_MODE && d3.select(this).attr("selected") == "true") {
      SELECTED_MODE = false;
      SELECTED_ID = "none";
      // 恢复正常
      d3.select(this)
        .attr("stroke", "black")
        .attr("stroke-width", 0)
        .attr("selected", false);
      d3.select("#data_group")
        .selectAll(".data_item")
        .attr("opacity", 1)
        .attr("selected", false);
      // 删除路径
      let pathgroup = mainfig.select("#pathgroup");
      pathgroup.selectAll("path").remove();
    }
  };

  if (transition) {
    trans = d3.transition().duration(2000).ease(d3.easeLinear); // 动画效果
  } else {
    trans = d3.transition().duration(0); // 无动画效果
  }

  // 获取当前的zoom transform
  var zoom_transform = mainfig.select("#zoom_transform_rec").attr("transform");

  // 删除元素
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
    .attr("opacity", SELECTED_MODE ? 0.25 : 1)
    .attr("selected", false)
    .on("mouseover", mouseoverEvent)
    .on("mouseout", mouseoutEvent)
    .on("click", mouseclickEvent)
    .on("dblclick", mousedblclickEvent);

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

  // 对于行人的数据一模一样
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
    .attr("opacity", SELECTED_MODE ? 0.25 : 1)
    .attr("selected", false)
    .on("mouseover", mouseoverEvent)
    .on("mouseout", mouseoutEvent)
    .on("click", mouseclickEvent)
    .on("dblclick", mousedblclickEvent);

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
}

function renderLegend(mainfig) {
  // 绘制图例
  const legendWidth = 140;
  const legendHeight = 100;
  let figLegend = mainfig
    .append("g")
    .attr("id", "legend_group")
    .attr(
      "transform",
      `translate(${WIDTH_MAIN - legendWidth - 20}, ${
        HEIGHT_MAIN - legendHeight - 20
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

  let legendPos = (d, i) => [
    legendWidth / 5 + 10,
    12 + i * ((legendHeight - 20) / 5),
  ];
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
}

function Zoom(mainfig, projection) {
  // 进行缩放功能
  var zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);

  var initialScale = 1;
  var initialTranslate = [0, 0];

  // 创建一个透明的rect对象，用来记录Zoom
  mainfig
    .append("rect")
    .attr("id", "zoom_transform_rec")
    .attr("opacity", 0)
    .attr(
      "transform",
      `translate(
        ${initialTranslate[0]},${initialTranslate[1]}
    ) scale(${initialScale})`
    )
    .attr("translate_x", initialTranslate[0])
    .attr("translate_y", initialTranslate[1])
    .attr("scale", initialScale);

  mainfig.call(
    zoom,
    d3.zoomIdentity
      .translate(initialTranslate[0], initialTranslate[1])
      .scale(initialScale)
  );

  function zoomed(event) {
    let map_svg = mainfig.select("#map_group");
    let data_group = mainfig.select("#data_group");
    let path_group = mainfig.select("#pathgroup");

    mainfig
      .select("#zoom_transform_rec")
      .attr("transform", event.transform)
      .attr("translate_x", event.transform.x)
      .attr("translate_y", event.transform.y)
      .attr("scale", event.transform.k);

    map_svg
      .selectAll("path")
      .attr("transform", event.transform)
      .attr("stroke-width", function () {
        return 1 / event.transform.k;
      });

    data_group.selectAll("rect").attr("transform", function () {
      var _this = d3.select(this);
      var old_transform = _this.attr("transform");
      var old_rotate = old_transform.slice(old_transform.search("rotate"));
      // console.log(old_rotate)
      return event.transform.toString() + " " + old_rotate;
    });
    data_group.selectAll("circle").attr("transform", event.transform);
    path_group.selectAll("path").attr("transform", event.transform);
  }

  return zoom;
}

async function renderMainFig(Data, mapData) {
  // 主视图
  const svg = d3.select("#mainsvg");
  const mainfig = svg
    .append("svg")
    .attr("height", HEIGHT_MAIN)
    .attr("width", WIDTH_MAIN)
    .attr("x", POS_MAIN["x"])
    .attr("y", POS_MAIN["y"]);
  const pathgroup = mainfig.append("g").attr("id", "pathgroup");

  let projection = d3
    .geoIdentity()
    .fitSize([WIDTH_MAIN, HEIGHT_MAIN], mapData[0]);
  // console.log(projection.scale());

  // 记录时间戳
  var time_stamp_list = Object.keys(Data);
  var cur_time_stamp = time_stamp_list[0];
  var cur_time_stamp_idx = 0;
  const time_stamp_len = time_stamp_list.length;

  // 绘制边框
  let figBound = mainfig
    .append("rect")
    .attr("fill-opacity", "0")
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 3)
    .attr("stroke", "black")
    .attr("width", WIDTH_MAIN)
    .attr("height", HEIGHT_MAIN);

  // 缩放
  var zoom = Zoom(mainfig, projection);

  // 1. 渲染地图
  await renderMap(mainfig, mapData, projection);
  // console.log(Data)

  // 2. 绘制车辆
  renderObject(mainfig, Data, projection);

  // 3. 绘制图例
  renderLegend(mainfig);

  // 控制播放设置
  var play_flag = false;

  var cur_time_stamp_idx = 0;
  var cur_time_stamp = time_stamp_list[cur_time_stamp_idx];
  updateObject(mainfig, Data, projection, cur_time_stamp, false);

  // 标识事件
  var timestamp2time = function (timestamp) {
    n = Number(timestamp) * 2 * 1000;
    return new Date(parseInt(n)).toLocaleString();
  };

  let time_text = mainfig
    .append("text")
    .attr("id", "time_text")
    .attr("x", 150)
    .attr("y", 50)
    .text(timestamp2time(cur_time_stamp));

  // 播放
  let bottom_rect = mainfig
    .append("rect")
    .attr("id", "play_bottom")
    .attr("x", 50)
    .attr("y", 30)
    .attr("width", 50)
    .attr("height", 30)
    .attr("fill", "#CCCCCC")
    .on("click", async function (event, d) {
      if (!play_flag) {
        play_flag = true;
        bottom_text.text("停止播放");
      } else {
        play_flag = false;
        bottom_text.text("播放");
      }
      if (cur_time_stamp_idx == time_stamp_len && play_flag) {
        cur_time_stamp_idx = 0;
        cur_time_stamp = time_stamp_list[cur_time_stamp_idx];
        if (typeof cur_time_stamp != "undefined")
          time_text.text(timestamp2time(cur_time_stamp));
        await updateObject(mainfig, Data, projection, cur_time_stamp, false);
      }
      while (play_flag && cur_time_stamp_idx < time_stamp_len) {
        cur_time_stamp_idx = cur_time_stamp_idx + 1;
        cur_time_stamp = time_stamp_list[cur_time_stamp_idx];
        if (typeof cur_time_stamp != "undefined")
          time_text.text(timestamp2time(cur_time_stamp));
        await updateObject(mainfig, Data, projection, cur_time_stamp, true);
        // console.log(cur_time_stamp);
      }
    });

  let bottom_text = mainfig
    .append("text")
    .attr("id", "bottom_text")
    .attr("x", 75)
    .attr("y", 50)
    .text("播放")
    .attr("font-size", ".7em")
    .attr("text-anchor", "middle");
}
