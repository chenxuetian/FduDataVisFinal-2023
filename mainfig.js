

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

function renderObject (svg, Data, projection, first_time_stamp=840670945) {

    // 添加数据
    time_stamp = first_time_stamp

    let datagroup = svg
    .append("g").attr("id", "data_group")

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
    .data(vehicleData, d => d["id"])
    .enter()
    .append("rect")
    .attr("transform", d => `rotate(${d['orientation'] / Math.PI * 180},
          ${reformulatePos(d)[0]}, ${reformulatePos(d)[1]})`)   
    .attr("angle", d => d['orientation'] / Math.PI * 180) 
    .attr("x", d => reformulatePos(d)[0])
    .attr("y", d => reformulatePos(d)[1])
    .attr("width", d => reformulatePos(d)[2])
    .attr("height", d => reformulatePos(d)[3])
    .attr("class", "data_rect")
    .attr("fill", d => TYPE2COLOR[d["type"]])

    datagroup
    .selectAll("circle")
    .data(personData, d => d["id"])
    .enter()
    .append("circle")
    .attr("cx", d => projection([d["position"]["x"], d["position"]["y"]])[0])
    .attr("cy", d => projection([d["position"]["x"], d["position"]["y"]])[1])
    .attr("r", d => d["shape"]["x"] * 1)
    .attr("class", "data_circle")
    .attr("fill", d => TYPE2COLOR[d["type"]])

}

async function updateObject (svg, Data, projection, new_time_stamp=840671014, transition=true) {
    
    const datagroup = svg.select("#data_group") 

    let new_data = Data[new_time_stamp]

    let vehicleData = new_data.filter(
        d => [1, 3, 4, 5, 6, 10].includes(d["type"])
    )

    let personData = new_data.filter(
        d => d["type"] === 2
    )

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

    if (transition) {
        trans = d3.transition().duration(2000).ease(d3.easeLinear)  // 动画效果
    }
    else {
        trans = d3.transition().duration(0)  // 无动画效果
    }

    // 删除元素
    datagroup
    .selectAll('rect')
    .data(vehicleData, d => d["id"])
    .exit()
    .remove()

    // 添加元素
    datagroup
    .selectAll('rect')
    .data(vehicleData, d => d["id"])
    .enter()
    .append("rect")
    .attr("transform", d => `rotate(${d['orientation'] / Math.PI * 180},
          ${reformulatePos(d)[0]}, ${reformulatePos(d)[1]})`)    
    .attr("angle", d => d['orientation'] / Math.PI * 180)
    .attr("x", d => reformulatePos(d)[0])
    .attr("y", d => reformulatePos(d)[1])
    .attr("width", d => reformulatePos(d)[2])
    .attr("height", d => reformulatePos(d)[3])
    .attr("class", "data_rect")
    .attr("fill", d => TYPE2COLOR[d["type"]]) 

    // 其他元素进行调整
    datagroup.
    selectAll('rect')
    .data(vehicleData, d => d["id"])
    // .attr("transform", d => `rotate(${d['orientation'] / Math.PI * 180},
    //       ${reformulatePos(d)[0]}, ${reformulatePos(d)[1]})`) 
    .transition(trans) 
    .attrTween("transform", function (d) {

        const rect = d3.select(this)
        const x_old = Number(rect.attr("x"))
        const y_old = Number(rect.attr("y"))
        const angle_old = Number(rect.attr("angle"))
        const x_new = reformulatePos(d)[0]
        const y_new = reformulatePos(d)[1]
        const angle_new = d['orientation'] / Math.PI * 180
        const width = reformulatePos(d)[2]
        const height = reformulatePos(d)[3]

        // 计算中心点的变化
        const interpolateX = d3.interpolateNumber(x_old + width / 2, x_new + width / 2);
        const interpolateY = d3.interpolateNumber(y_old + height / 2, y_new + height / 2);
        // 计算角度的变化
        const interpolateAngle = d3.interpolateNumber(angle_old, angle_new);
        
        return function (t) {
            const centerX = interpolateX(t);
            const centerY = interpolateY(t);
            const centerAngle = interpolateAngle(t);
            return `rotate(${centerAngle}, ${centerX}, ${centerY})`;
        }
    })  
    .attr("angle", d => d['orientation'] / Math.PI * 180)
    .attr("x", d => reformulatePos(d)[0])
    .attr("y", d => reformulatePos(d)[1])
    .attr("width", d => reformulatePos(d)[2])
    .attr("height", d => reformulatePos(d)[3])
    .attr("class", "data_rect")
    .attr("fill", d => TYPE2COLOR[d["type"]])  
    
    // 对于行人的数据一模一样
    datagroup
    .selectAll('circle')
    .data(personData, d => d["id"])
    .exit()
    .remove()

    datagroup
    .selectAll('circle')
    .data(vehicleData, d => d["id"])
    .enter()
    .append("circle")  
    .attr("x", d => reformulatePos(d)[0])
    .attr("y", d => reformulatePos(d)[1])
    .attr("width", d => reformulatePos(d)[2])
    .attr("height", d => reformulatePos(d)[3])
    .attr("class", "data_rect")
    .attr("fill", d => TYPE2COLOR[d["type"]])      

    datagroup
    .selectAll("circle")
    .data(personData, d => d["id"])
    .transition(trans)
    .attr("cx", d => projection([d["position"]["x"], d["position"]["y"]])[0])
    .attr("cy", d => projection([d["position"]["x"], d["position"]["y"]])[1])
    .attr("r", d => d["shape"]["x"] * 1)
    .attr("class", "data_circle")
    .attr("fill", d => TYPE2COLOR[d["type"]])   
    
    await trans.end()
}

function renderLegend (svg) {
    // 绘制图例
    const legendWidth = 100
    const legendHeight = 100
    let figLegend = svg.append("g")
    .attr("id", "legend_group")
    .attr("transform", `translate(${WIDTH1-legendWidth-20}, ${HEIGHT1-legendHeight-20})`)

    figLegend.append("rect")
    .attr("fill-opacity", "0")
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 1.5)
    .attr("stroke", "black")
    .attr("width", legendWidth)
    .attr("height", legendHeight)

    const color = Object.values(TYPE2COLOR)
    const legendText = Object.values(TYPE)

    let legendPos = (d, i) => [legendWidth/5+10, 12+i*((legendHeight-20)/6)]
    let legend_text = figLegend.append("g")
    .attr("id", "text_group")
    .selectAll("text")
    .data(legendText).enter()
    .append("text")
    .attr("x", (d,i) => legendPos(d,i)[0])
    .attr("y", (d,i) => legendPos(d,i)[1])
    .text(d => d)    
    .attr("text-anchor", "start")
    .attr("font-size", ".5em")

    let legend_color = figLegend.append("g")
    .attr("id", "rect_group")
    .selectAll("rect")
    .data(color).enter()
    .append("rect")
    .attr("x", (d,i) => legendPos(d,i)[0]-23)
    .attr("y", (d,i) => legendPos(d,i)[1]-6)
    .attr("width", legendWidth/5)
    .attr("height", (legendHeight-20)/10)
    .attr("fill", d => d)
}

function renderMainFig (Data, mapData) {

    // 主视图
    let svg = d3.select("#mainsvg")
    let mainfig = svg.append("svg")
    .attr("height", HEIGHT1).attr("width", WIDTH1)
    .attr("x", POS1["x"]).attr("y", POS1["y"])

    let projection = d3.geoIdentity().fitSize([WIDTH1, HEIGHT1], mapData[0])

    // 记录时间戳
    var time_stamp_list = Object.keys(Data)
    var cur_time_stamp = time_stamp_list[0]
    var cur_time_stamp_idx = 0
    const time_stamp_len = time_stamp_list.length
    console.log(time_stamp_list)
    // 1. 渲染地图
    renderMap(mainfig, mapData, projection)
    // console.log(Data)

    // 2. 绘制车辆
    renderObject(mainfig, Data, projection)

    // 3. 绘制图例
    renderLegend(mainfig)

    // 绘制边框
    let figBound = mainfig.append("rect")
    .attr("fill-opacity", "0")
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 3)
    .attr("stroke", "black")
    .attr("width", WIDTH1).attr("height", HEIGHT1)
    .on("click", async function(event, d){
        // console.log("launch")
        cur_time_stamp_idx = 0
        cur_time_stamp = time_stamp_list[cur_time_stamp_idx]
        updateObject(mainfig, Data, projection, cur_time_stamp, false)

        while (cur_time_stamp_idx < time_stamp_len) {
            cur_time_stamp_idx = cur_time_stamp_idx + 1
            cur_time_stamp = time_stamp_list[cur_time_stamp_idx]
            await updateObject(mainfig, Data, projection, cur_time_stamp, true)
            console.log(cur_time_stamp)
        }
    })
}