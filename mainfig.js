

function renderMap (mapData) {

    bound_data = mapData[0]
    cross_walk_data = mapData[1]
    laneroad_data = mapData[2]
    signalroad_data = mapData[3]
    stoplinear_data = mapData[4]

    let svg = d3.select("#mainsvg")
    let map_group = svg.append("g").attr("id", "map_group")
    let path = d3.geoPath()

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
    .attr("transform", `translate(${WIDTH1/2 + MARGIN.left}, ${HEIGHT1/2 + MARGIN.top})`)
    .attr("d", path)    
    
    let crossWalkMap = map_group.selectAll("crosswalk")
    .data(crosswalks)
    .enter()
    .append("path")
    .attr("class", "crosswalk")
    .attr('stroke',"#CCCCCC")
    .attr('stroke-width', 1)
    .attr("fill", "#FFFFFF")
    .attr("transform", `translate(${WIDTH1/2 + MARGIN.left}, ${HEIGHT1/2 + MARGIN.top})`)
    .attr("d", path) 
        
    // let laneRoadMap = map_group.selectAll("laneroad")
    // .data(laneroads)
    // .enter()
    // .append("path")
    // .attr("class", "laneroad")
    // .attr('stroke',"#000000")
    // .attr('stroke-width', 1)
    // .attr("fill", "#FFFFFF")
    // .attr("transform", `translate(${width/2 + margin.left}, ${height/2 + margin.top})`)
    // .attr("d", path)

    // let signalRoadMap = map_group.selectAll("signalroad")
    // .data(signalroads)
    // .enter()
    // .append("path")
    // .attr("class", "signalroad")
    // .attr('stroke',"#333333")
    // .attr('stroke-width', 1)
    // .attr("fill", "#FFFFFF")
    // .attr("transform", `translate(${width/2 + margin.left}, ${height/2 + margin.top})`)
    // .attr("d", path) 
    
    let stopLinearMap = map_group.selectAll("stoplinear")
    .data(stoplinears)
    .enter()
    .append("path")
    .attr("class", "stoplinear")
    .attr('stroke',"#333333")
    .attr('stroke-width', 1)
    .attr("fill", "#FFFFFF")
    .attr("transform", `translate(${WIDTH1/2 + MARGIN.left}, ${HEIGHT1/2 + MARGIN.top})`)
    .attr("d", path) 
}

function renderObject (Data) {

    // 添加数据
    time_stamp = 840670939
    console.log(Data[time_stamp])

    let datagroup = d3.select("#mainsvg")
    .append("g").attr("id", "datagroup")

    const reformulatePos = function (d) {
        cent_x = d['position']['x']
        cent_y = d['position']['y']
        shape_x = d['shape']['x']
        shape_y = d['shape']['y']
        x = cent_x - shape_x / 2
        y = cent_y - shape_y / 2
        width = shape_x
        height = shape_y
        return [x, y, width, height]
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
    .attr("transform", d => `translate(${WIDTH1/2 + MARGIN.left}, ${HEIGHT1/2 + MARGIN.top})
     rotate(${d['orientation'] / Math.PI * 180}, ${d['position']['x']}, ${d['position']['y']})`)    
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
    .attr("transform", d => `translate(${WIDTH1/2 + MARGIN.left}, ${HEIGHT1/2 + MARGIN.top})`)
    .attr("cx", d => d["position"]["x"])
    .attr("cy", d => d["position"]["y"])
    .attr("r", d => d["shape"]["x"] * 2)
    .attr("class", "data_circle")
    .attr("fill", "#38A507")

}

function renderMainFig (Data, mapData) {

    // 1. 渲染地图
    renderMap(mapData)
    // console.log(Data)

    // 2. 绘制车辆
    renderObject(Data)
}