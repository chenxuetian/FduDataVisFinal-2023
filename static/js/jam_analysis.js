function JamFig(pos, size) {
  this.x = pos.x;
  this.y = pos.y;
  this.margin = { top: 20, right: 20, bottom: 20, left: 25 };
  this.outerWidth = size.width;
  this.outerHeight = size.height;
  this.innerWidth = size.width - this.margin.left - this.margin.right;
  this.innerHeight = size.height - this.margin.top - this.margin.bottom;

  this.fig = d3
    .select("#mainsvg")
    .append("svg")
    .attr("id", "jamfig")
    .attr("x", this.x)
    .attr("y", this.y)
    .attr("width", this.outerWidth)
    .attr("height", this.outerHeight);

  this.bound = this.fig
    .append("rect")
    .attr("fill-opacity", 0)
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 2.5)
    .attr("stroke", "black")
    .attr("width", this.outerWidth)
    .attr("height", this.outerHeight);

  this.svg = this.fig
    .append("g")
    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
    .attr("id", "jamsvg");

  this.crossing_lane_map = {
    1: {
      left: { in_cross: ["202", "201", "200"], out_cross: ["203", "204"] },
      down: { in_cross: ["105", "104", "103"], out_cross: ["101", "102"] },
      right: { in_cross: ["209", "208", "207"], out_cross: ["205", "206"] },
    },
    2: {
      left: { in_cross: ["218", "217", "216"], out_cross: ["219", "220"] },
      down: {
        in_cross: ["80688", "80689", "80690", "80691"],
        out_cross: ["80692", "80693", "80694"],
      },
      right: { in_cross: ["225", "224", "223"], out_cross: ["221", "222"] },
    },
    3: {
      left: { in_cross: ["234", "233", "232"], out_cross: ["235", "236"] },
      down: {
        in_cross: ["70369", "1003", "1002"],
        out_cross: ["1001", "70358"],
      },
      right: { in_cross: ["241", "240", "239"], out_cross: ["237", "238"] },
    },
    4: {
      left: { in_cross: ["250", "249", "248"], out_cross: ["251", "252"] },
      down: {
        in_cross: ["70416", "80679", "80680", "80681"],
        out_cross: ["80682", "80683", "80684", "70411"],
      },
      right: { in_cross: ["257", "256", "255"], out_cross: ["253", "254"] },
    },
    5: {
      left: {
        in_cross: ["70351", "80561", "80560", "80559", "80558", "80557"],
        out_cross: ["80562", "80563", "80564", "80565", "80566", "70352"],
      },
      down: { in_cross: ["157", "156", "155"], out_cross: ["139", "140"] },
      right: {
        in_cross: ["80573", "80572", "80571", "80570"],
        out_cross: ["80569", "80568", "80567"],
      },
      up: { in_cross: ["136", "135", "134"], out_cross: ["137", "138"] },
    },
    6: {
      left: {
        in_cross: ["1909", "1908", "1907", "1906"],
        out_cross: ["1911", "1912"],
      },
      down: {
        in_cross: ["1978", "1977", "1976", "1975"],
        out_cross: ["1972", "1973", "1974"],
      },
      right: {
        in_cross: ["1933", "1932", "1931", "1930"],
        out_cross: ["1921", "1922", "1923", "1924", "1925"],
      },
      up: {
        in_cross: ["1954", "1953", "1952", "1951"],
        out_cross: ["1955", "1956", "1957"],
      },
    },
    7: {
      left: {
        in_cross: ["1450", "1449", "1448", "1447", "1446"],
        out_cross: ["1442", "1443", "1444", "1445"],
      },
      down: {
        in_cross: ["70413", "1042", "1041", "1040"],
        out_cross: ["1020", "1021", "70370"],
      },
      right: {
        in_cross: ["1476", "1475", "1474", "1473", "1472"],
        out_cross: ["1451", "1452", "1453"],
      },
      up: {
        in_cross: ["70363", "1017", "1016"],
        out_cross: ["1018", "1019", "70364"],
      },
    },
    8: {
      left: {
        in_cross: ["1463", "1462", "1461", "1460", "1459"],
        out_cross: ["1464", "1465", "1466"],
      },
      down: {
        in_cross: ["1489", "1488", "1487", "1486"],
        out_cross: ["1483", "1484", "1485"],
      },
      right: {
        in_cross: ["1557", "1556", "1555", "1554", "1553"],
        out_cross: ["1490", "1491", "1492", "1493"],
      },
      up: {
        in_cross: ["1479", "1478", "1477"],
        out_cross: ["1480", "1481", "1482"],
      },
    },
    9: {
      down: {
        in_cross: ["3136", "3135", "3134"],
        out_cross: ["3128", "3129", "3130"],
      },
      up: {
        in_cross: ["70413", "3142", "3141", "3140"],
        out_cross: ["3143", "3144", "3145", "70414"],
      },
    },
  };
  this.selected_Lanes = [];
  for (const crossing in this.crossing_lane_map) {
    for (const direction in this.crossing_lane_map[crossing]) {
      this.selected_Lanes = this.selected_Lanes.concat(
        this.crossing_lane_map[crossing][direction].in_cross
      );
      this.selected_Lanes = this.selected_Lanes.concat(
        this.crossing_lane_map[crossing][direction].out_cross
      );
      // selected_Lanes = selected_Lanes.concat(crossing_lane_map[crossing][direction].out_cross);
    }
  }
  this.selectedcross = -1;
}

JamFig.prototype.show = function (data) {
  //   console.log(this.selected_Lanes);
  //   console.log(data);

  // let average_len = 60;
  // const lanesData = Object.entries(data).map(([laneID, timestamps]) => {
  //     var queue=[];
  //     for(let i=0;i<average_len;i++){
  //         queue.push([0,0]);
  //     }
  //     return {
  //         lane:laneID,
  //         values: Object.entries(timestamps).map(([timestamp, data]) => {
  //             queue.shift();
  //             queue.push([data.num,data.v]);
  //             var n = 0, av =0;
  //             for(let i=0;i<average_len;i++){
  //                 n = n+queue[i][0];
  //                 av = av+queue[i][1]*queue[i][0];
  //             }
  //             return {
  //                 time: new Date(timestamp* 1000),
  //                 avgSpeed: av/n,
  //                 total_num:n,
  //             };

  //         })
  //     };
  // });

  // console.log(lanesData);

  let jamfig_svg = this.svg;

  const timeFormat = d3.timeFormat("%H:%M");
  this.xScale = d3
    .scaleTime()
    .domain([new Date(1681340400 * 1000), new Date(1681372800 * 1000)])
    .range([0, this.innerWidth])
    .nice();
  const xScale = this.xScale;
  const xAxis = jamfig_svg
    .append("g")
    .attr("transform", `translate(0, ${this.innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(10).tickFormat(timeFormat))
    .style("font-size", "6px");

  const ySclae = d3.scaleLinear().domain([0, 10]).range([this.innerHeight, 0]);
  const yAxis = jamfig_svg
    .append("g")
    .call(d3.axisLeft(ySclae))
    .style("font-size", "6px");

  const lineGenerator = d3
    .line()
    .x((d) => xScale(d[0]))
    .y((d) => ySclae(d[1]));

  jamfig_svg
    .append("text")
    .attr("text-anchor", "end")
    .attr("x", this.innerWidth + this.margin.right / 2 + 7)
    .attr("y", this.innerHeight + 5)
    .text("时间")
    .style("font-size", "6px");

  const colorScale = d3
    .scaleOrdinal(d3.schemeCategory10) // 使用 D3 的一个内置颜色方案
    .domain(["up", "left", "right", "down"]);

  jamfig_svg
    .append("text")
    .attr("y", -15)
    .attr("x", 0 - this.margin.left / 2 + 5)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "6px")
    .text("平均速度");

  jamfig_svg
    .append("text")
    .attr("x", this.innerWidth / 2)
    .attr("y", 0)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .text("各路口平均速度折线图");

  for (let cross in data) {
    for (let direction in data[cross]) {
      data_records = new Object();
      Object.keys(data[cross][direction]).forEach((key) => {
        if (key % 600 === 0) {
          data_records[key] = data[cross][direction][key];
        }
      });
      let temp = {
        c: cross,
        d: direction,
        value: Object.entries(data_records).map((d) => {
          return [new Date(d[0] * 1000), d[1]["v"]];
        }),
      };
      jamfig_svg
        .append("path")
        .datum(temp)
        .attr("class", "lines")
        .attr("fill", "none")
        .attr("stroke", colorScale(direction)) // 可以为每条线分配不同的颜色
        .attr("stroke-width", 1)
        .attr("d", (d) => lineGenerator(d["value"]));
    }
  }

  // jamfig_svg.selectAll(".lines").style('opacity',d => {
  //     if(d.c==1){

  //         return 1;}
  //     else return 0;
  // })

  this.rect_0 = this.svg
    .append("rect")
    .attr("id", "rect_0")
    .attr("x", 0)
    .attr("y", 10)
    .attr("width", 1)
    .attr("height", this.innerHeight)
    .attr("opacity", 0)
    .attr("fill", "#EEEEEE");
  this.rect_1 = this.svg
    .append("rect")
    .attr("id", "rect_1")
    .attr("x", 0)
    .attr("y", 10)
    .attr("width", 1)
    .attr("height", this.innerHeight)
    .attr("opacity", 0)
    .attr("fill", "#EEEEEE");

  const crossings = [1, 2, 3, 4, 5, 6, 7, 8];
  let isOpen = false;

  // 创建一个用于显示当前选择的文本元素
  const currentSelection = jamfig_svg
    .append("text")
    .attr("x", 20)
    .attr("y", 10)
    .text("路口1")
    .style("cursor", "pointer")
    .style("font-size", "8px")
    .on("click", function () {
      isOpen = !isOpen;
      showOptions(isOpen);
    });

  // 创建选项组
  const optionsGroup = jamfig_svg.append("g");

  var that = this;
  function showOptions(show) {
    optionsGroup.selectAll(".cross_id").remove();

    if (show) {
      optionsGroup
        .selectAll("text")
        .data(crossings)
        .enter()
        .append("text")
        .attr("class", "cross_id")
        .attr("x", 20)
        .attr("y", (d, i) => 18 + i * 9)
        .text((d) => `路口 ${d}`)
        .style("cursor", "pointer")
        .style("font-size", "8px")
        .on("click", function (event, d) {
          currentSelection.text(`路口 ${d}`);
          isOpen = false;
          optionsGroup.selectAll(".cross_id").remove();
          updateChart(d); // 根据选择的路口更新图表
          that.selectedcross = d;
          mainfig.NoHighlight();
          mainfig.highlightCrosslines(d);
        });
    } else {
      jamfig_svg.selectAll(".lines").style("opacity", 1);
      currentSelection.text("选择路口");
      that.selectedcross = -1;
      mainfig.NoHighlight();
    }
  }

  function updateChart(selectedCrossing) {
    jamfig_svg.selectAll(".lines").style("opacity", (d) => {
      if (d.c == selectedCrossing) {
        return 1;
      } else return 0;
    });

    console.log("Selected crossing:", selectedCrossing);
  }

  const labels = {
    up: "北",
    down: "南",
    left: "西",
    right: "东",
  };

  const legend = this.svg
    .selectAll(".legend")
    .data(colorScale.domain())
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(0,${i * 10})`);

  legend
    .append("rect")
    .attr("x", this.innerWidth - 8)
    .attr("width", 8)
    .attr("height", 8)
    .style("fill", colorScale);

  legend
    .append("text")
    .attr("x", this.innerWidth - 12)
    .attr("y", 4)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .style("font-size", "6px") // 设置字体大小
    .text((d) => labels[d]);

  updateChart(1);
};

JamFig.prototype.highlightTime = function (ts0, ts1, reset = false) {
  var self = this;
  if (reset) {
    this.rect_0.attr("opacity", 0);
    this.rect_1.attr("opacity", 0);
    return;
  }
  x0 = self.xScale(new Date(ts0 * 1000));
  x1 = self.xScale(new Date(ts1 * 1000));

  // 设置遮挡矩形位置
  this.rect_0.attr("width", x0).attr("opacity", 0.8);
  this.rect_1
    .attr("x", x1)
    .attr("width", this.innerWidth - x1)
    .attr("opacity", 0.8);
};
