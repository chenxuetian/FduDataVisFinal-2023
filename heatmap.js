function render_heatmap(data,projection){
    // 假设 data 是加载的车辆数据

    // 定义网格大小
    const gridSize = 0.5; // 根据实际情况调整

    // 初始化聚合数据的对象
    let aggregatedData = {};

    // 遍历每个时间戳的数据
    for (let timestamp in data) {
        // 遍历每个时间戳内的车辆
        data[timestamp].forEach(vehicle => {
            if (vehicle.is_moving >0){
                let gridX = Math.floor(vehicle.position.x / gridSize)*gridSize;
                let gridY = Math.floor(vehicle.position.y / gridSize)*gridSize;
                let gridKey = `${gridX}_${gridY}`;

                if (!aggregatedData[gridKey]) {
                    aggregatedData[gridKey] = { count: 0, x: gridX, y: gridY };
                }
                aggregatedData[gridKey].count++;
            }
        });
    }

    // 将聚合数据转换为数组以便后续处理
    let aggregatedArray = Object.values(aggregatedData);


    const points = aggregatedArray.map(d => {
        return {
            x: projection([d.x,d.y])[0], 
            y: projection([d.x,d.y])[1],
            value: d.count
        };
    });

    

    let svg = d3.select('.mainfig')
    points.forEach((point, index) => {
        // 为每个点创建一个径向渐变
        const gradient = svg.append('defs')
          .append('radialGradient')
          .attr('id', 'gradient' + index);
    
        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', "red")
          .attr('stop-opacity', 0.5*point.value/d3.max(points, d => d.value));
    
        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', "red")
          .attr('stop-opacity', 0);
    
        // 绘制使用渐变的圆
        svg.append('circle')
          .attr('cx', point.x)
          .attr('cy', point.y)
          .attr('r', 10)  // 半径，可以根据需要调整
          .style('fill', 'url(#gradient' + index + ')');
    });
}

