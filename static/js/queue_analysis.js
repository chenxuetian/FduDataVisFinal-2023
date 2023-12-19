function QueueFig(pos,size){
    this.x = pos.x;
    this.y = pos.y;
    this.margin = { top: 20, right: 20, bottom: 20, left: 30 };
    this.outerWidth = size.width;
    this.outerHeight = size.height;
    this.innerWidth = size.width - this.margin.left - this.margin.right;
    this.innerHeight = size.height - this.margin.top - this.margin.bottom;

    this.fig = d3
        .select("#mainsvg")
        .append("svg")
        .attr("id", "queuefig")
        .attr("x", this.x)
        .attr("y", this.y)
        .attr("width", this.outerWidth)
        .attr("height", this.outerHeight);

    this.bound = this.fig
        .append("rect")
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 1)
        .attr("stroke-width", 1)
        .attr("stroke", "black")
        .attr("width", this.outerWidth)
        .attr("height", this.outerHeight);

    this.svg = this.fig.append("g")
                        .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

}

QueueFig.prototype.show = function (data){
    console.log(this.selected_Lanes);
    console.log(data);



    let svg = this.svg;
    this.data = data;

    const keys = ['left','right','down','up'];
    const aggregatedData = {};

    for (const crossing in data) {
        aggregatedData[crossing] = {};
        keys.forEach(key => {
            aggregatedData[crossing][key] = 0; // 使用默认值 0
        });

        for (const direction in data[crossing]) {
            aggregatedData[crossing][direction] = 0;
            for (const timestamp in data[crossing][direction]) {
                aggregatedData[crossing][direction] = Math.max(aggregatedData[crossing][direction],data[crossing][direction][timestamp].stop_num);
            }
        }
    }

    // 转换为适用于堆叠布局的数组格式
    const processedData = Object.keys(aggregatedData).map(crossing => {
        return { crossing, ...aggregatedData[crossing] };
    });
    console.log(processedData);

     // 假设这是所有可能的方位
    const stack = d3.stack().keys(keys);
    const stackedData = stack(processedData);
    console.log(stackedData);

    const xScale = d3.scaleBand()
        .domain(processedData.map(d => d.crossing))
        .range([0, this.innerWidth])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(stackedData, d => d3.max(d, d => d[1]))])
        .range([this.innerHeight, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)  // 使用 D3 的一个内置颜色方案
        .domain(['left','right','down','up']);
    
    svg.selectAll("g")
        .data(stackedData)
        .enter().append("g")
        .attr("fill", d => colorScale(d.key)) // 根据方位选择颜色
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => xScale(d.data.crossing))
        .attr("y", d => yScale(d[1]))
        .attr("height", d => yScale(d[0]) - yScale(d[1]))
        .attr("width", xScale.bandwidth());


    const xAxis = d3.axisBottom(xScale);

    svg.append("g")
        .attr("transform", `translate(0, ${this.innerHeight})`) 
        .call(xAxis)
        .selectAll("text")
        .style("font-size", "6px");

    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .call(yAxis)
        .selectAll("text")
        .style("font-size", "6px");

    svg.append("text")
        .attr("x", this.innerWidth / 2)
        .attr("y", 0 - this.margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "8px")
        .text("路口停车数量堆叠柱状图");

    svg.append("text")
        .attr("x", this.innerWidth+ this.margin.right/2 -2)
        .attr("y", this.innerHeight+ this.margin.bottom/2 + 3)             
        .style("text-anchor", "middle")
        .style("font-size", "6px")
        .text("路口编号");
     
     svg.append("text")
        .attr("y", 0 - this.margin.top / 2)
        .attr("x", 0 - this.margin.left/2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "6px")
        .text("停车数量");

    const legend = this.svg.selectAll(".legend")
        .data(colorScale.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0,${i * 7-15})`);

    legend.append("rect")
        .attr("x", this.innerWidth - 8)
        .attr("width", 8)
        .attr("height", 4)
        .style("fill", colorScale);

    legend.append("text")
        .attr("x", this.innerWidth - 12)
        .attr("y", 2)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .style("font-size", "6px")  // 设置字体大小
        .text(d => `${d}`); 

}