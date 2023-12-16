function render_heatmap(data, mapData) {
  const gridSize = 0.5;

  let heatmap = d3
    .select("#mainsvg")
    .append("svg")
    .attr("id", "heatmap")
    .attr("x", POS_HEAT["x"])
    .attr("y", POS_HEAT["y"])
    .attr("width", WIDTH_HEAT)
    .attr("height", HEIGHT_HEAT);

  let heatmap_svg = heatmap.append("g");

  let figBound = heatmap_svg
    .append("rect")
    .attr("fill-opacity", 0)
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 1)
    .attr("stroke", "black")
    .attr("width", WIDTH_HEAT)
    .attr("height", HEIGHT_HEAT);

  let projection = d3
    .geoIdentity()
    .fitSize([WIDTH_HEAT, HEIGHT_HEAT], mapData[0]);

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

  renderMap(heatmap_svg, mapData, projection);

  // 遍历每个时间戳的数据
  let aggregatedData = {};
  for (let timestamp in data) {
    data[timestamp].forEach((vehicle) => {
      if (vehicle.is_moving > 0) {
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
      x: projection([d.x, d.y])[0],
      y: projection([d.x, d.y])[1],
      value: d.count,
    };
  });

  points.forEach((point, index) => {
    // 为每个点创建一个径向渐变
    const gradient = heatmap_svg
      .append("defs")
      .append("radialGradient")
      .attr("id", "gradient" + index);

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "red")
      .attr(
        "stop-opacity",
        (0.5 * point.value) / d3.max(points, (d) => d.value)
      );

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "red")
      .attr("stop-opacity", 0);

    // console.log(1);
    // 绘制使用渐变的圆
    heatmap_svg
      .append("circle")
      .attr("class", "heat_point")
      .attr("cx", point.x)
      .attr("cy", point.y)
      .attr("r", 5) // 半径，可以根据需要调整
      .style("fill", "url(#gradient" + index + ")");
  });
}
