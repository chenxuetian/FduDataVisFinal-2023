

function renderMap (svg, mapData, projection) {

    bound_data = mapData[0]
    cross_walk_data = mapData[1]
    laneroad_data = mapData[2]
    signalroad_data = mapData[3]
    stoplinear_data = mapData[4]

    let map_group = svg.append("g").attr("id", "map_group")
    let path = d3.geoPath().projection(projection)

    let bounds = bound_data.features
    let crosswalks = cross_walk_data.features
    let laneroads = laneroad_data.features
    let signalroads = signalroad_data.features
    let stoplinears = stoplinear_data.features

    let boundMap = map_group.selectAll("bound")
    .data(bounds)
    .enter()
    .append("path")
    .attr("class", "bound")
    .attr('stroke',"#777777")
    .attr('stroke-width', 1)
    .attr("fill", "#FFFFFF")
    // .attr("transform", `translate(${WIDTH1/2}, ${HEIGHT1/2})`)
    .attr("d", path)    
    
    let crossWalkMap = map_group.selectAll("crosswalk")
    .data(crosswalks)
    .enter()
    .append("path")
    .attr("class", "crosswalk")
    .attr('stroke',"#CCCCCC")
    .attr('stroke-width', 1)
    .attr("fill", "#FFFFFF")
    // .attr("transform", `translate(${WIDTH1/2}, ${HEIGHT1/2})`)
    .attr("d", path) 

    let stopLinearMap = map_group.selectAll("stoplinear")
    .data(stoplinears)
    .enter()
    .append("path")
    .attr("class", "stoplinear")
    .attr('stroke',"#333333")
    .attr('stroke-width', 1)
    .attr("fill", "#FFFFFF")
    // .attr("transform", `translate(${WIDTH1/2}, ${HEIGHT1/2})`)
    .attr("d", path) 
}

function renderObject (svg, Data, projection) {

    // 添加数据
    time_stamp = 840670939
    console.log(Data[time_stamp])

    let datagroup = svg
    .append("g").attr("id", "datagroup")

    const reformulatePos = function (d) {
        cent_x = d['position']['x']
        cent_y = d['position']['y']
        shape_x = d['shape']['x']
        shape_y = d['shape']['y']
        x = cent_x - shape_x / 2
        y = cent_y - shape_y / 2
        proj_x = projection([x, y])[0]
        proj_y = projection([x, y])[1]
        width = shape_x
        height = shape_y

        _point1 = [0,0]
        _point2 = [width, height]
        _proj_point1 = projection(_point1)
        _proj_point2 = projection(_point2)
        proj_width = _proj_point2[0] - _proj_point1[0]
        proj_height = _proj_point2[1] - _proj_point1[1]

        return [proj_x, proj_y, proj_width, proj_height]
    }

    let vehicleData = Data[time_stamp].filter(
        d => [1, 3, 4, 5, 6, 10].includes(d["type"])
    )

    let personData = Data[time_stamp].filter(
        d => d["type"] === 2
    )

    datagroup
    .selectAll('rect')
    .data(vehicleData)
    .enter()
    .append("rect")
    .attr("transform", d => `rotate(${d['orientation'] / Math.PI * 180},
           ${reformulatePos(d)[0]}, ${reformulatePos(d)[1]})`)    
    .attr("x", d => reformulatePos(d)[0])
    .attr("y", d => reformulatePos(d)[1])
    .attr("width", d => reformulatePos(d)[2])
    .attr("height", d => reformulatePos(d)[3])
    .attr("class", "data_rect")
    .attr("fill", d => TYPE2COLOR[d["type"]])

    datagroup
    .selectAll("circle")
    .data(personData)
    .enter()
    .append("circle")
    .attr("cx", d => projection([d["position"]["x"], d["position"]["y"]])[0])
    .attr("cy", d => projection([d["position"]["x"], d["position"]["y"]])[1])
    .attr("r", d => d["shape"]["x"] * 1)
    .attr("class", "data_circle")
    .attr("fill", "#38A507")

}

function renderMainFig (Data, mapData) {

    // 主视图
    let svg = d3.select("#mainsvg")
    let mainfig = svg.append("svg")
    .attr("height", HEIGHT1).attr("width", WIDTH1)
    .attr("x", POS1["x"]).attr("y", POS1["y"])

    let projection = d3.geoIdentity().fitSize([WIDTH1, HEIGHT1], mapData[0])

    // 1. 渲染地图
    renderMap(mainfig, mapData, projection)
    // console.log(Data)

    // 2. 绘制车辆
    renderObject(mainfig, Data, projection)

    // 绘制边框
    let figBound = mainfig.append("rect")
    .attr("fill-opacity", "0")
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 3)
    .attr("stroke", "black")
    .attr("width", WIDTH1).attr("height", HEIGHT1)

}