function render_heatmap(data){
    // 假设 data 是加载的车辆数据

    // 定义网格大小
    const gridSize = 0.5; // 根据实际情况调整

    // 初始化聚合数据的对象
    let aggregatedData = {};

    // 遍历每个时间戳的数据
    for (let timestamp in data) {
        // 遍历每个时间戳内的车辆
        data[timestamp].forEach(vehicle => {
            // 计算网格坐标
            let gridX = Math.floor(vehicle.position.x / gridSize);
            let gridY = Math.floor(vehicle.position.y / gridSize);
            let gridKey = `${gridX}_${gridY}`;

            // 聚合计数
            if (!aggregatedData[gridKey]) {
                aggregatedData[gridKey] = { count: 0, x: gridX, y: gridY };
            }
            aggregatedData[gridKey].count++;
        });
    }

    // 将聚合数据转换为数组以便后续处理
    let aggregatedArray = Object.values(aggregatedData);
    // 接下来可以使用 aggregatedArray 来创建热力图
    const width = 800;
    const height = 600;
    const svg = d3.select('body').append('svg')
        .attr('id','heatmap')
        .attr('width', width)
        .attr('height', height);

    // 创建一个画布元素作为热力图的基础
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    document.body.appendChild(canvas);

    // 初始化 simpleheat 对象
    const heat = simpleheat(canvas);
    heat.radius(10, 20); // 设置热力图的半径和模糊度
    heat.gradient({ 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }); // 设置颜色渐变

    // 添加数据点
    aggregatedArray.forEach(item => {
        // 添加每个网格的中心点和计数
        // 注意：这里需要根据实际的坐标系和画布尺寸来转换 x 和 y 的值
        heat.add([item.x, item.y, item.count]);
    });

    // 绘制热力图
    heat.draw();
}

