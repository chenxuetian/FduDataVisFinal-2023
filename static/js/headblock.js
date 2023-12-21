function HeadBlock(pos, size) {
  this.x = pos.x;
  this.y = pos.y;
  this.margin = { top: 0, right: 0, bottom: 0, left: 0 };
  this.outerWidth = size.width;
  this.outerHeight = size.height;
  this.innerWidth = size.width - this.margin.left - this.margin.right;
  this.innerHeight = size.height - this.margin.top - this.margin.bottom;

  this.fig = d3
    .select("#mainsvg")
    .append("svg")
    .attr("id", "headfig")
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

  logo_block_margin = { top: 10, right: 10, bottom: 10, left: 10 };
  logo_block = this.fig
    .append("svg")
    .attr("id", "logo")
    .attr("width", this.innerWidth / 4)
    .attr("height", this.innerWidth / 4)
    .attr("x", logo_block_margin.left)
    .attr("y", logo_block_margin.top);
  d3.xml("static/images/fdu.svg").then(function (xml) {
    var importedNode = document.importNode(xml.documentElement, true);
    logo_block.node().appendChild(importedNode);
  });

  side_block_margin = { top: 10, right: 10, bottom: 10, left: 10 };
  side_block = this.fig
    .append("text")
    .attr("id", "side")
    .attr(
      "width",
      (this.innerWidth / 4) * 3 -
        logo_block_margin.right -
        logo_block_margin.left
    )
    .attr("height", this.innerWidth / 4)
    .attr(
      "x",
      this.innerWidth / 4 +
        logo_block_margin.left +
        logo_block_margin.right +
        side_block_margin.left
    )
    .attr("y", side_block_margin.top + this.innerWidth / 8 + 8)
    .text("数据可视化-2023")
    .attr("font-size", "16px");

  title_block_margin = { top: 10, right: 10, bottom: 10, left: 10 };
  title_block = this.fig
    .append("text")
    .attr("id", "title")
    .attr("width", this.innerWidth)
    .attr("height", (this.innerWidth / 4) * 3)
    .attr("x", title_block_margin.left)
    .attr(
      "y",
      title_block_margin.top + logo_block_margin.top + 35 + this.innerWidth / 4
    )
    .text("“数析时空”城市路口多维数据可视分析")
    .attr("font-size", "16px");
}
