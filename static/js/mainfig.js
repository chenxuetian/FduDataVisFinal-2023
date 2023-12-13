

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

    // Zoom(svg)
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

        proj_cent_x = projection([cent_x, cent_y])[0]
        proj_cent_y = projection([cent_x, cent_y])[1]

        width = shape_x
        height = shape_y

        _point1 = [0,0]
        _point2 = [width, height]
        _proj_point1 = projection(_point1)
        _proj_point2 = projection(_point2)
        proj_width = _proj_point2[0] - _proj_point1[0]
        proj_height = _proj_point2[1] - _proj_point1[1]

        return [proj_x, proj_y, proj_width, proj_height, proj_cent_x, proj_cent_y]
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
    .attr("transform", d => `translate(0, 0) rotate(${d['orientation'] / Math.PI * 180},
          ${reformulatePos(d)[4]}, ${reformulatePos(d)[5]})`)   
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

    // Zoom(svg)
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

        proj_cent_x = projection([cent_x, cent_y])[0]
        proj_cent_y = projection([cent_x, cent_y])[1]


        _point1 = [0,0]
        _point2 = [width, height]
        _proj_point1 = projection(_point1)
        _proj_point2 = projection(_point2)
        proj_width = _proj_point2[0] - _proj_point1[0]
        proj_height = _proj_point2[1] - _proj_point1[1]

        return [proj_x, proj_y, proj_width, proj_height, proj_cent_x, proj_cent_y]
    }

    if (transition) {
        trans = d3.transition().duration(2000).ease(d3.easeLinear)  // 动画效果
    }
    else {
        trans = d3.transition().duration(0)  // 无动画效果
    }

    // 获取当前的zoom transform
    var zoom_transform = svg.select("#zoom_transform_rec").attr("transform")

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
    .attr("transform", d => zoom_transform + ' ' + `rotate(${d['orientation'] / Math.PI * 180},
          ${reformulatePos(d)[4]}, ${reformulatePos(d)[5]})`)    
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
    .attrTween("transform", function (d, i, a) {
        var rect = d3.select(this)
        var x_old = Number(rect.attr("x"))
        var y_old = Number(rect.attr("y"))
        var angle_old = Number(rect.attr("angle"))
        var x_new = reformulatePos(d)[0]
        var y_new = reformulatePos(d)[1]
        var angle_new = d['orientation'] / Math.PI * 180
        var width = reformulatePos(d)[2]
        var height = reformulatePos(d)[3]

        if (Math.abs(angle_new - angle_old) > 180) {
            if (angle_new > angle_old) {
                angle_new = angle_new - 360
            }
            else {
                angle_old = angle_old - 360
            }
        }

        // 计算中心点的变化
        const interpolateX = d3.interpolateNumber(x_old + width / 2, x_new + width / 2);
        const interpolateY = d3.interpolateNumber(y_old + height / 2, y_new + height / 2);
        // 计算角度的变化
        const interpolateAngle = d3.interpolateNumber(angle_old, angle_new);

        return function (t) {
            var old_transform = rect.attr('transform')
            var old_translate = old_transform.slice(old_transform.search("translate"), old_transform.search("rotate"))

            const centerX = interpolateX(t);
            const centerY = interpolateY(t);
            const centerAngle = interpolateAngle(t);
            return old_translate + ' ' + `rotate(${centerAngle}, ${centerX}, ${centerY})`;
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
    .data(personData, d => d["id"])
    .enter()
    .append("circle")  
    .attr("cx", d => projection([d["position"]["x"], d["position"]["y"]])[0])
    .attr("cy", d => projection([d["position"]["x"], d["position"]["y"]])[1])
    .attr("r", d => d["shape"]["x"] * 1)
    .attr("class", "data_circle")
    .attr("fill", d => TYPE2COLOR[d["type"]])
    .attr("transform", zoom_transform)

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
    const legendWidth = 140
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
    .attr("font-size", ".7em")

    let legend_color = figLegend.append("g")
    .attr("id", "rect_group")
    .selectAll("rect")
    .data(color).enter()
    .append("rect")
    .attr("x", (d,i) => legendPos(d,i)[0]-33)
    .attr("y", (d,i) => legendPos(d,i)[1]-10)
    .attr("width", legendWidth/5)
    .attr("height", (legendHeight-20)/10)
    .attr("fill", d => d)
}

function Zoom (svg) {

    // 进行缩放功能
    var zoom = d3.zoom()
    .scaleExtent([1,8]).on("zoom", zoomed)

    var initialScale = 1
    var initialTranslate = [0, 0]

    // 创建一个透明的rect对象，用来记录Zoom
    svg.append("rect")
    .attr("id", "zoom_transform_rec")
    .attr("opacity", 0)
    .attr("transform", `translate(
        ${initialTranslate[0]}, ${initialTranslate[1]}
    ) scale(${initialScale})`)

    svg.call(zoom,
        d3.zoomIdentity.translate(initialTranslate[0], initialTranslate[1]).scale(initialScale))
    
    function zoomed (event) {
        
        let map_svg = svg.select("#map_group")
        let data_group = svg.select("#data_group")
        
        svg.select("#zoom_transform_rec")
        .attr("transform", event.transform)

        map_svg.selectAll('path')
        .attr('transform', event.transform)
        .attr("stroke-width", function () {return 1/event.transform.k})

        data_group.selectAll('rect')
        .attr('transform', function () { 
            var _this = d3.select(this)
            var old_transform = _this.attr("transform")
            var old_rotate = old_transform.slice(old_transform.search("rotate"))
            // console.log(old_rotate)
            return event.transform.toString() + ' ' + old_rotate
        })
        data_group.selectAll('circle')
        .attr('transform', event.transform)
    }

    return zoom
    // zoomed()
}

function stopZoom(svg) { 
    svg.on('zoom', null)
}

function renderMainFig (Data, mapData) {

    // 主视图
    let svg = d3.select("#mainsvg")
    let mainfig = svg.append("svg")
    .attr("id", "mainfig")
    .attr("height", HEIGHT1).attr("width", WIDTH1)
    .attr("x", POS1["x"]).attr("y", POS1["y"])

    let projection = d3.geoIdentity().fitSize([WIDTH1, HEIGHT1], mapData[0])
    console.log(projection.scale())

    // 记录时间戳
    var time_stamp_list = Object.keys(Data)
    var cur_time_stamp = time_stamp_list[0]
    var cur_time_stamp_idx = 0
    const time_stamp_len = time_stamp_list.length
    console.log(time_stamp_list)

    // 缩放
    var zoom = Zoom(mainfig)

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
            console.log("hello")
        }
    })
}