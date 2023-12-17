function render_jamfig(data){

    crossing_lane_map = {
        1:{
            'left':{
                'in_cross':["78","77","76"],
                'out_cross':['79','80'],
            },
            'down':{
                'in_cross':['37','36','35'],
                'out_cross':['33','34'],
            },
            'right':{
                'in_cross':['85','84','83'],
                'out_cross':['81','82']
            }
        },
        2:{
            'left':{
                'in_cross':["90","89","88"],
                'out_cross':['91','92'],
            },
            'down':{
                'in_cross':['235','236','237','238'],
                'out_cross':['239','240','241'],
            },
            'right':{
                'in_cross':['97','96','95'],
                'out_cross':['93','94']
            }
        },
        3:{
            'left':{
                'in_cross':["102","101","100"],
                'out_cross':['103','104'],
            },
            'down':{
                'in_cross':['219','328','327'],
                'out_cross':['326','208'],
            },
            'right':{
                'in_cross':['109','108','107'],
                'out_cross':['105','106']
            }
        },
        4:{
            'left':{
                'in_cross':["114","113","112"],
                'out_cross':['115','116'],
            },
            'down':{
                'in_cross':['228','229','230','231'],
                'out_cross':['232','233','234','223'],
            },
            'right':{
                'in_cross':['121','120','119'],
                'out_cross':['117','118']
            }
        },
        5:{
            'left':{
                'in_cross':["205","191","190",'189','188','187'],
                'out_cross':['192','193','194','195','196','206'],
            },
            'down':{
                'in_cross':['71','70','69'],
                'out_cross':['67','68'],
            },
            'right':{
                'in_cross':['203','202','201','200'],
                'out_cross':['199','198','197'],
            },
            'up':{
                'in_cross':['64','63','62'],
                'out_cross':['65','66'],
            }
        },
        6:{
            'left':{
                'in_cross':["262","261","260",'259'],
                'out_cross':['264','265'],
            },
            'down':{
                'in_cross':['325','324','323','322'],
                'out_cross':['319','320','321'],
            },
            'right':{
                'in_cross':['284','283','282','281'],
                'out_cross':['272','273','274','275','276'],
            },
            'up':{
                'in_cross':['303','302','301','300'],
                'out_cross':['304','305','306'],
            }
        },
        7:{
            'left':{
                'in_cross':["137","136","135",'134','133'],
                'out_cross':['129','130','131','132'],
            },
            'down':{
                'in_cross':['225','5','4','3'],
                'out_cross':['339','340','220'],
            },
            'right':{
                'in_cross':['157','156','155','154','153'],
                'out_cross':['138','139','140'],
            },
            'up':{
                'in_cross':['213','336','335'],
                'out_cross':['337','338','214'],
            }
        },
        8:{
            'left':{
                'in_cross':["147","146","145",'144','143'],
                'out_cross':['148','149','150'],
            },
            'down':{
                'in_cross':['170','169','168','167'],
                'out_cross':['164','165','166'],
            },
            'right':{
                'in_cross':['184','183','182','181','180'],
                'out_cross':['171','172','173','174'],
            },
            'up':{
                'in_cross':['160','159','158'],
                'out_cross':['161','162','163'],
            }
        },
        9:{
            'down':{
                'in_cross':['20','19','18'],
                'out_cross':['12','13','14'],
            },
            'up':{
                'in_cross':['225','26','25','24'],
                'out_cross':['27','28','29','226'],
            }
        },
    }

    let selected_Lanes = [];

    for (const crossing in crossing_lane_map) {
        for (const direction in crossing_lane_map[crossing]) {
            selected_Lanes = selected_Lanes.concat(crossing_lane_map[crossing][direction].in_cross);
            selected_Lanes = selected_Lanes.concat(crossing_lane_map[crossing][direction].out_cross);
        }
    }

    const selectedData = selected_Lanes.reduce((acc, id) => {
        if (data[id] !== undefined) {
            acc[id] = data[id];
        }
        return acc;
    }, {});
    console.log(selectedData);
    let average_len = 10;
    const lanesData = Object.entries(selectedData).map(([laneID, timestamps]) => {
        var queue=[];
        for(let i=0;i<average_len;i++){
            queue.push([0,0]);
        }
        return {
            lane:laneID,
            values: Object.entries(timestamps).map(([timestamp, data]) => {
                queue.shift();
                queue.push([data.num,data.v]);
                var n = 0, av =0;
                for(let i=0;i<average_len;i++){
                    n = n+queue[i][0];
                    av = av+queue[i][1]*queue[i][0];
                }
                return {
                    time: new Date(timestamp* 1000),
                    avgSpeed: av/n,
                    total_num:n,
                };
                
            })
        };
    });

    console.log(lanesData);

    const margin = { top: 15, right: 10, bottom: 15, left: 25 };
    const width = WIDTH_JAM - margin.left - margin.right;
    const height = HEIGHT_JAM - margin.top - margin.bottom;

    let jamfig = d3
        .select("#mainsvg")
        .append("svg")
        .attr("id", "jamfig")
        .attr("x", POS_JAM["x"])
        .attr("y", POS_JAM["y"])
        .attr("width", WIDTH_JAM)
        .attr("height", HEIGHT_JAM);

    let jamfig_svg = jamfig.append("g")
                        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const timeFormat = d3.timeFormat("%H:%M");
    const xScale = d3.scaleTime()
        .domain(d3.extent(lanesData.flatMap(lane => lane.values), d => d.time))
        .range([0, width])
        .nice();
    const xAxis = jamfig_svg
        .append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(10).tickFormat(timeFormat));

    const ySclae = d3.scaleLinear()
        .domain([0, d3.max(lanesData.flatMap(lane => lane.values), d => d.avgSpeed)])
        .range([height, margin.top+margin.bottom]);
    const yAxis = jamfig_svg
        .append("g")
        .call(d3.axisLeft(ySclae));

    const lineGenerator = d3.line()
        .x(d => xScale(d.time))
        .y(d => ySclae(d.avgSpeed));

    jamfig_svg
        .append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + 40)
        .text("时间");

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)  // 使用 D3 的一个内置颜色方案
        .domain(lanesData.map(d => d.lane));

    const selected_cross = ['1','5'];
    
    for(let cross in selected_cross){
        for(let direction in crossing_lane_map[cross]){
            for(let state in crossing_lane_map[cross][direction]){
                for(var i=0;i<crossing_lane_map[cross][direction][state].length;i++){
                    let lane_id =  crossing_lane_map[cross][direction][state][i];
                    if(lane_id in lanesData){
                        console.log(lanesData[lane_id]);
                        jamfig_svg.append("path")
                            .datum(lanesData[lane_id].values)
                            .attr("fill", "none")
                            .attr("stroke", colorScale(lane_id)) // 可以为每条线分配不同的颜色
                            .attr("stroke-width", 1)
                            .attr("d", lineGenerator);
                    }
                    
                }
            }
        }
    };
    // lanesData.forEach(laneData => {
    //     jamfig_svg.append("path")
    //       .datum(laneData.values)
    //       .attr("fill", "none")
    //       .attr("stroke", colorScale(laneData.lane)) // 可以为每条线分配不同的颜色
    //       .attr("stroke-width", 0.3)
    //       .attr("d", lineGenerator);
    // });


    // const legend = jamfig_svg.selectAll(".legend")
    //     .data(colorScale.domain())
    //     .enter().append("g")
    //     .attr("class", "legend")
    //     .attr("transform", (d, i) => `translate(0,${i * 5})`);

    // legend.append("rect")
    //     .attr("x", width - 4)
    //     .attr("width", 4)
    //     .attr("height", 4)
    //     .style("fill", colorScale);

    // legend.append("text")
    //     .attr("x", width - 24)
    //     .attr("y", 9)
    //     .attr("dy", ".35em")
    //     .style("font-size", "4px")
    //     .style("text-anchor", "end")
    //     .text(d => ` ${d}`);

}